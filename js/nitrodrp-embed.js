addEventListener('message', (e) => {
  if (e.origin !== 'https://demo.jadedmedia.ca') return
  if (e.data?.type === 'nitrodrp:height') document.getElementById('nitrodrp').style.height = e.data.height + 'px'
})
