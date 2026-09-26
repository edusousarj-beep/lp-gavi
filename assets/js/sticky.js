/*
 * CTA fixo no celular.
 *
 * Aparece depois que o botão do hero sai da tela e some sempre que outro botão
 * do SDR está visível: um botão primário por viewport. Depois do CTA final,
 * não volta. O destino e o evento de clique são os mesmos de qualquer outro
 * [data-sdr] — quem cuida disso é o sdr.js.
 */
(function () {
  'use strict';

  var bar = document.querySelector('[data-sticky-cta]');
  if (!bar) return;

  var inline = Array.prototype.filter.call(
    document.querySelectorAll('[data-sdr]'),
    function (el) { return !bar.contains(el); }
  );
  if (!inline.length) return;

  var first = inline[0];
  var last = inline[inline.length - 1];
  var pending = false;

  function visible(el, height) {
    var rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < height;
  }

  function update() {
    pending = false;

    var height = window.innerHeight;
    var show = first.getBoundingClientRect().bottom < 0 &&
      last.getBoundingClientRect().top > height &&
      !inline.some(function (el) { return visible(el, height); });

    if (show) {
      bar.setAttribute('data-state', 'on');
    } else {
      bar.removeAttribute('data-state');
    }
  }

  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
})();
