/*
 * Prints ampliados num <dialog>. Sem suporte a showModal, o link do print
 * segue abrindo a imagem, como sem JS.
 */
(function () {
  'use strict';

  var dialog = document.querySelector('[data-lightbox-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  var image = dialog.querySelector('img');
  var close = dialog.querySelector('[data-lightbox-close]');

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-lightbox]');
    if (!link) return;

    event.preventDefault();

    var thumb = link.querySelector('img');
    image.src = link.href;
    image.alt = thumb ? thumb.alt : '';
    dialog.showModal();
  });

  close.addEventListener('click', function () { dialog.close(); });

  // Clique fora da imagem (no fundo escuro) fecha. Esc já fecha sozinho.
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', function () {
    image.removeAttribute('src');
  });
})();
