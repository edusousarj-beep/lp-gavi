/* Reveals no scroll — IntersectionObserver nativo, sem biblioteca. */
(function () {
  'use strict';

  var targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sem movimento pedido, ou sem suporte: mostra tudo de uma vez.
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) {
      el.setAttribute('data-reveal', 'in');
    });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.setAttribute('data-reveal', 'in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  Array.prototype.forEach.call(targets, function (el) {
    observer.observe(el);
  });
})();
