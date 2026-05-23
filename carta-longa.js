(function () {
  'use strict';

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Deep link pro app Instagram (mesma lógica da carta principal).
  document.querySelectorAll('[data-ig-deep]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var ua = navigator.userAgent || '';
      var isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
      if (!isMobile) return;

      e.preventDefault();
      var webFallback = el.getAttribute('href');

      var fallbackTimer = setTimeout(function () {
        window.location.href = webFallback;
      }, 1200);
      function onHide() {
        if (document.hidden) {
          clearTimeout(fallbackTimer);
          document.removeEventListener('visibilitychange', onHide);
        }
      }
      document.addEventListener('visibilitychange', onHide);

      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'instagram://direct/t/ninaz.marc';
      document.body.appendChild(iframe);

      setTimeout(function () {
        if (!document.hidden) {
          window.location.href = 'instagram://user?username=ninaz.marc';
        }
      }, 300);
    });
  });
})();
