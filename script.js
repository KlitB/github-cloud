// ========== AUTH HANDLING ==========
let githubToken = localStorage.getItem('githubToken');
const urlParams = new URLSearchParams(window.location.search);
const tokenFromURL = urlParams.get('token');

if (tokenFromURL) {
  githubToken = tokenFromURL;
  localStorage.setItem('githubToken', githubToken);
  window.history.replaceState({}, document.title, location.pathname);
}

if (!githubToken) {
  window.location.href = 'https://your-backend.com/api/login';
}

// ========== UI ==========
document.body.innerHTML = `
  <h1>Encrypted GitHub Cloud</h1>
  <input type="file" id="fileInput" />
  <input type="password" id="passwordInput" placeholder="Enter password" />
  <button id="uploadBtn">Encrypt & Upload</button>
  <button id="logoutBtn">Logout</button>
  <div id="status"></div>
`;

// ========== ENCRYPTION ==========
async function encryptFile(file, password) {
  const fileData = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: iv, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    fileData
  );
  return new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
}

// ========== UPLOAD ==========
async function uploadFile(file, password) {
  const encryptedData = await encryptFile(file, password);
  const contentBase64 = btoa(String.fromCharCode(...encryptedData));

  const response = await fetch('https://your-backend.com/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: githubToken,
      path: `${file.name}.enc`,
      content: contentBase64,
      message: `Upload ${file.name}`
    })
  });

  if (response.ok) {
    document.getElementById('status').innerText = `✅ Uploaded ${file.name}`;
  } else {
    document.getElementById('status').innerText = `❌ Upload failed`;
  }
}

// ========== EVENTS ==========
document.getElementById("uploadBtn").onclick = () => {
  const file = document.getElementById("fileInput").files[0];
  const password = document.getElementById("passwordInput").value;
  if (!file || !password) return alert("Select a file and enter a password.");
  uploadFile(file, password);
};

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("githubToken");
  location.reload();
};
