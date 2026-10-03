(function() {
  const config = window.EVENT_CONFIG;
  document.title = config.eventName + ' — ' + document.title.replace(/^.*? — /, '');
  document.querySelectorAll('[data-event]').forEach(el => { el.textContent = config[el.dataset.event] || ''; });
  document.documentElement.style.setProperty('--red', config.primaryColor);
  document.documentElement.style.setProperty('--dark', config.darkColor);
})();
