const params = new URLSearchParams(window.location.search);
const eventID = params.get("eventID");
const fileInput = document.getElementById("fileInput");
const nameInput = document.getElementById("nameInput");
const previewBtn = document.getElementById("previewBtn");
const confirmCard = document.getElementById("confirmCard");
const previewArea = document.getElementById("previewArea");
const cancelUpload = document.getElementById("cancelUpload");
const doUpload = document.getElementById("doUpload");
const refreshBtn = document.getElementById("refreshBtn");
const gallery = document.getElementById("gallery");

let selectedFiles = [];

// Preview before upload
previewBtn.addEventListener("click", () => {
  selectedFiles = Array.from(fileInput.files);
  if (!selectedFiles.length) return alert("Please select images first.");
  previewArea.innerHTML = "";
  selectedFiles.forEach(f => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(f);
    previewArea.appendChild(img);
  });
  confirmCard.style.display = "block";
});

// Cancel upload
cancelUpload.addEventListener("click", () => {
  selectedFiles = [];
  confirmCard.style.display = "none";
});

// Do upload
doUpload.addEventListener("click", async () => {
  for (const f of selectedFiles) {
    const fd = new FormData();
    fd.append("file", f);
    fd.append("uploader", nameInput.value.trim() || "Anonymous");

    await fetch(`/api/${eventID}/upload`, { method: "POST", body: fd });
  }
  alert("Upload successful!");
  confirmCard.style.display = "none";
  fileInput.value = "";
  selectedFiles = [];
  await loadGallery();
});

// Refresh gallery
refreshBtn.addEventListener("click", loadGallery);

// Load gallery
async function loadGallery() {
  const res = await fetch(`/api/${eventID}/list`);
  const files = await res.json();
  gallery.innerHTML = "";
  for (const f of files) {
    const img = document.createElement("img");
    img.src = `/api/${eventID}/download/${encodeURIComponent(f.file)}`;
    img.title = f.uploader ? `Uploaded by: ${f.uploader}` : "Uploader: Anonymous";

    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";
    wrapper.appendChild(img);

    const footer = document.createElement("div");
    footer.className = "footer";
    footer.textContent = f.uploader || "Anonymous";
    wrapper.appendChild(footer);

    gallery.appendChild(wrapper);
  }
}

loadGallery();
