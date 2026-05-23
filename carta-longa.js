(function () {
  'use strict';

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // CTAs vão direto pro WhatsApp via wa.me/ — sem JS extra necessário.
  // wa.me/ é Universal Link da Meta e o sistema operacional abre o app
  // do WhatsApp direto, com texto pré-preenchido.
})();
