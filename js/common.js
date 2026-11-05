// Small helpers shared by every page except the home page's own script.
(() => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
