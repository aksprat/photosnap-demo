const form = document.getElementById('uploadForm');
const gallery = document.getElementById('gallery');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const res = await fetch('https://<your-backend-url>/upload', {
    method: 'POST',
    body: formData
  });
  const result = await res.json();
  alert('Uploaded!');
  loadPhotos();
});

async function loadPhotos() {
  const res = await fetch('https://<your-backend-url>/photos');
  const photos = await res.json();
  gallery.innerHTML = photos.map(p => `<div><img src="${p.url}" /><p>${p.caption}</p></div>`).join('');
}

loadPhotos();
