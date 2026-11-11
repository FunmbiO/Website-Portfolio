// Shows the portrait once one has been uploaded in the admin. Hidden until then.
const fig = document.getElementById('portrait');
const img = document.getElementById('portrait-img');

if (fig && img) {
  fetch('/api/profile', { headers: { Accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : { photoUrl: '' }))
    .then(({ photoUrl }) => {
      if (!photoUrl) return;
      img.addEventListener('load', () => { fig.hidden = false; });
      img.src = photoUrl;
    })
    .catch(() => { /* no photo is fine */ });
}
