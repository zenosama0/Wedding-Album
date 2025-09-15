async function loadOwnerEvents() {
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) return alert("Missing owner token!");

  const res = await fetch(`/owner/events?token=${token}`);
  const events = await res.json();

  const list = document.getElementById("eventList");
  list.innerHTML = "";

  events.forEach((event) => {
    const li = document.createElement("li");
    li.style.marginBottom = "1rem";

    li.innerHTML = `
      <strong>${event.alias}</strong> 
      <em>(Created: ${event.createdAt})</em><br>
      <button onclick="toggleCodes('${event.id}', '${event.guestCode}', '${event.adminCode}')">Show Codes</button>
      <button onclick="copyLink('${event.id}')">Copy Link</button>
      <div id="codes-${event.id}" style="display:none; margin-top:5px; font-size:0.9em; background:#f1f1f1; padding:6px; border-radius:8px;">
        <p><b>Guest Code:</b> ${event.guestCode}</p>
        <p><b>Admin Code:</b> ${event.adminCode}</p>
      </div>
    `;

    list.appendChild(li);
  });
}

function toggleCodes(eventId, guest, admin) {
  const div = document.getElementById(`codes-${eventId}`);
  div.style.display = div.style.display === "none" ? "block" : "none";
}

function copyLink(eventId) {
  const link = `http://localhost:3000/event/${eventId}`;
  navigator.clipboard.writeText(link)
    .then(() => alert(`Link copied: ${link}`))
    .catch(err => alert("Failed to copy link: " + err));
}
