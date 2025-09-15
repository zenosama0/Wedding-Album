import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = 3000;
const OWNER_TOKEN = "OWNERSECRET123";

// Simple owner auth for owner portal (CHANGE for production)
// const OWNER_TOKEN = process.env.OWNER_TOKEN || "OWNERSECRET123";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Helpers
const EVENTS_DIR = path.join(process.cwd(), "events");
if (!fs.existsSync(EVENTS_DIR)) fs.mkdirSync(EVENTS_DIR, { recursive: true });

function eventPath(eid) { return path.join(EVENTS_DIR, eid); }
function configPath(eid) { return path.join(eventPath(eid), "config.json"); }
function metadataPath(eid) { return path.join(eventPath(eid), "metadata.json"); }
function uploadsPath(eid) { return path.join(eventPath(eid), "uploads"); }

function loadConfig(eid) {
  const p = configPath(eid);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// --- Owner endpoints ---
app.post("/owner/create", (req, res) => {
  const token = req.headers["x-owner-token"] || req.body.ownerToken;
  if (token !== OWNER_TOKEN) return res.status(403).json({ error: "forbidden" });

  const alias = (req.body.alias || "").trim() || "Unnamed Event";
  const id = "event_" + uuidv4();
  const guestCode = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6-digit
  const adminCode = "adm-" + uuidv4().slice(0,10);
  const createdAt = new Date().toISOString();

  const cfg = { alias, guestCode, adminCode, createdAt };

  fs.mkdirSync(eventPath(id));
  fs.mkdirSync(uploadsPath(id));
  fs.writeFileSync(configPath(id), JSON.stringify(cfg, null, 2));
  fs.writeFileSync(metadataPath(id), JSON.stringify([], null, 2));

  return res.json({ success: true, eventId: id, guestCode, adminCode, alias, createdAt });
});

app.get("/owner/list", (req, res) => {
  const token = req.headers["x-owner-token"];
  if (token !== OWNER_TOKEN) return res.status(403).json({ error: "forbidden" });

  const events = fs.readdirSync(EVENTS_DIR)
    .filter(f => fs.existsSync(configPath(f)))
    .map(eid => {
      const cfg = loadConfig(eid);
      return {
        eventId: eid,
        alias: cfg.alias,
        createdAt: cfg.createdAt,
        guestCode: cfg.guestCode,   // include codes now
        adminCode: cfg.adminCode
      };
    });

  res.json(events);
});

app.post("/owner/delete-event", (req, res) => {
  const token = req.headers["x-owner-token"];
  if (token !== OWNER_TOKEN) return res.status(403).json({ error: "forbidden" });
  const { eventId } = req.body;
  const evPath = eventPath(eventId);
  if (!fs.existsSync(evPath)) return res.status(404).json({ error: "not found" });
  // safe remove directory
  fs.rmSync(evPath, { recursive: true, force: true });
  res.json({ success: true });
});

// --- Landing + code verification ---
app.post("/event/:eventId/verify", (req, res) => {
  const eventId = req.params.eventId;
  const cfg = loadConfig(eventId);
  if (!cfg) return res.status(404).json({ error: "Event not found" });
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "missing code" });
  if (code === cfg.guestCode) return res.json({ role: "guest" });
  if (code === cfg.adminCode)  return res.json({ role: "admin" });
  return res.status(401).json({ error: "Invalid code" });
});

// --- Upload (encrypted blob files) ---
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const eid = req.params.eventId;
    const dir = uploadsPath(eid);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // keep original name in metadata, filename on disk is random
    cb(null, Date.now() + "-" + uuidv4() + path.extname(file.originalname || ".bin"));
  }
});
const upload = multer({ storage: diskStorage });

app.post("/event/:eventId/upload", upload.single("image"), (req, res) => {
  const eid = req.params.eventId;
  const cfg = loadConfig(eid);
  if (!cfg) return res.status(404).json({ error: "Event not found" });

  const uploader = (req.body.uploader || "Anonymous").slice(0,64);
  if (!req.file) return res.status(400).json({ error: "no file" });

  // save metadata entry
  const meta = JSON.parse(fs.readFileSync(metadataPath(eid), "utf8"));
  meta.push({
    filename: req.file.filename,
    originalName: req.file.originalname || "",
    uploader,
    ts: new Date().toISOString()
  });
  fs.writeFileSync(metadataPath(eid), JSON.stringify(meta, null, 2));
  res.json({ success: true });
});

// --- List images (metadata) ---
app.get("/event/:eventId/images", (req, res) => {
  const eid = req.params.eventId;
  const cfg = loadConfig(eid);
  if (!cfg) return res.status(404).json({ error: "Event not found" });
  const meta = fs.existsSync(metadataPath(eid)) ? JSON.parse(fs.readFileSync(metadataPath(eid), "utf8")) : [];
  res.json(meta);
});

// --- Serve encrypted file ---
app.get("/event/:eventId/file/:filename", (req, res) => {
  const { eventId, filename } = req.params;
  const p = path.join(uploadsPath(eventId), filename);
  if (!fs.existsSync(p)) return res.status(404).end();
  res.sendFile(p);
});

// --- Delete (admin only) ---
app.post("/event/:eventId/delete", (req, res) => {
  const eid = req.params.eventId;
  const cfg = loadConfig(eid);
  if (!cfg) return res.status(404).json({ error: "Event not found" });

  const { filename, adminCode } = req.body;
  if (adminCode !== cfg.adminCode) return res.status(401).json({ error: "Unauthorized" });

  const p = path.join(uploadsPath(eid), filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);

  // remove from metadata
  const meta = JSON.parse(fs.readFileSync(metadataPath(eid), "utf8"));
  const newMeta = meta.filter(m => m.filename !== filename);
  fs.writeFileSync(metadataPath(eid), JSON.stringify(newMeta, null, 2));

  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
