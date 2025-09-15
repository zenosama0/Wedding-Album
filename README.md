# Wedding QR Photo Pool

## Description

This is a secure, self-hosted wedding photo sharing web app. It allows guests and admins to upload, view, and download images for a specific event via a QR code on the wedding invitation.

Key features:

* **Event-based structure**: Each event has its own folder with unique guest and admin codes.
* **Guest Portal**: Guests can view, upload, and download images. Optional uploader name is supported.
* **Admin Portal**: Full control to view, upload, and delete images.
* **Client-side encryption**: All images are encrypted in the browser before being uploaded.
* **Simple Material Design UI**: Uses modern font with simple theme for a clean look.

---

## Project Structure

```
project/
│
├─ server.js             # Express server
├─ package.json
├─ public/               # Frontend files
│   ├─ owner.html        # Event management portal
│   ├─ index.html        # Landing page
│   ├─ guest.html        # Guest portal
│   ├─ admin.html        # Admin portal
│   ├─ client.css
│   ├─ style.css
│   ├─ client.js
│   └─ script.js
│
├─ events/               # Event folders
│   ├─ event123456/
│   │   ├─ config.json   # guestCode, adminCode, encryptionKey
│   │   └─ uploads/      # uploaded images (encrypted)
```

---

## Getting Started

### Prerequisites

* Node.js installed (v16+ recommended)
* NPM installed

### Installation

1. Clone the repo:

```bash
git clone https://github.com/zenosama0/Wedding-Album.git
cd Wedding-Album
```

2. Install dependencies:

```bash
npm install express multer
```


---

### Running the Server

```bash
node server.js
```

Visit: `http://localhost:3000/event/<eventID>` (replace `<eventID>` with your event folder name, e.g., `event123456`)

* A copy link button from the management portal can be used to get the admin or guest link
* Guests can only upload or view images for that event.
* Guests CAN NOT delete any uploaded images.
* Admins can delete any image.

---

### Notes

* Uploaded images are encrypted in the browser before being sent to the server.
* Each event is isolated in its own folder for easier management.
