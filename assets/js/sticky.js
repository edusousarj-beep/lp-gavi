/*
 * CTA fixo no celular.
 *
 * Aparece depois que o botão do hero sai da tela e some sempre que outro botão
 * do SDR está visível: um botão primário por viewport. Depois do CTA final,
 * não volta. O destino e o evento de clique são os mesmos de qualquer outro
 * [data-sdr] — quem cuida disso é o sdr.js.
 *
 * IntersectionObserver, não scroll: o reveal move os blocos depois que a
 * rolagem para, e um botão pode entrar na tela sem nenhum evento de scroll.
 */
(function () {
  'use strict';

  var bar = document.querySelector('[data-sticky-cta]');
  if (!bar || !('IntersectionObserver' in window)) return;

  var inline = Array.prototype.filter.call(
    document.querySelectorAll('[data-sdr]'),
    function (el) { return !bar.contains(el); }
  );
  if (!inline.length) return;

  var first = inline[0];
  var last = inline[inline.length - 1];
  var visible = inline.map(function () { return false; });
  var pastFirst = false;
  var beforeLast = true;

  function render() {
    var show = pastFirst && beforeLast && visible.indexOf(true) === -1;

    if (show) {
      bar.setAttribute('data-state', 'on');
    } else {
      bar.removeAttribute('data-state');
    }
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var rect = entry.boundingClientRect;
      var root = entry.rootBounds;
      var top = root ? root.top : 0;
      var bottom = root ? root.bottom : window.innerHeight;

      visible[inline.indexOf(entry.target)] = entry.isIntersecting;

      if (entry.target === first) {
        pastFirst = !entry.isIntersecting && rect.bottom <= top;
      }
      if (entry.target === last) {
        beforeLast = !entry.isIntersecting && rect.top >= bottom;
      }
    });

    render();
  });

  inline.forEach(function (el) { observer.observe(el); });
})();
