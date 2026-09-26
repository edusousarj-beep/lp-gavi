/*
 * Vídeos do YouTube em fachada: a página carrega só a capa, e o player entra
 * no clique (youtube-nocookie, sem cookie antes do play). Sem JS, o link abre
 * o vídeo no YouTube.
 */
(function () {
  'use strict';

  var links = document.querySelectorAll('[data-youtube]');

  Array.prototype.forEach.call(links, function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();

      var id = encodeURIComponent(link.getAttribute('data-youtube'));
      var iframe = document.createElement('iframe');

      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      iframe.title = link.getAttribute('data-title') || 'Vídeo';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

      link.parentNode.replaceChild(iframe, link);
      iframe.focus();
    });
  });
})();
