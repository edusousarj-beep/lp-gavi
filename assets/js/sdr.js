/*
 * Botão do SDR — código crítico da página.
 *
 * Responsabilidades:
 *   1. Ler os parâmetros de campanha na chegada e guardá-los.
 *   2. Injetar essa origem no link do WhatsApp, para o SDR saber de onde o lead
 *      veio sem perguntar e para a atribuição sobreviver até o Kommo.
 *   3. Disparar um evento de clique próprio no pixel.
 *
 * NUNCA dispare `LeadQualificado` daqui. Esse evento é o sinal de renda
 * qualificada usado para otimizar a campanha no Meta; sujá-lo com clique de
 * página destrói a otimização. Ele pertence ao SDR, depois da qualificação.
 */
(function () {
  'use strict';

  var CONFIG = {
    // TODO: número real do SDR, formato internacional, só dígitos.
    phone: '5500000000000',
    message: 'Oi, Gavi! Vim pela página da mentoria e quero ver como funciona por dentro.',
    storageKey: 'gavi.attrib',
    ttlDays: 90,
    // Evento de clique próprio. Separado, de propósito, de LeadQualificado.
    clickEvent: 'ClickSDR'
  };

  // Ordem importa: é a ordem em que a origem é montada para o SDR ler.
  var TRACKED = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'utm_id', 'fbclid', 'gclid', 'ttclid'
  ];

  function store(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* modo privado ou storage bloqueado — segue com a atribuição da URL */
    }
  }

  function retrieve(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  // Parâmetros presentes na URL atual.
  function fromUrl() {
    var params = new URLSearchParams(window.location.search);
    var found = {};
    var has = false;

    TRACKED.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        found[key] = value;
        has = true;
      }
    });

    return has ? found : null;
  }

  // Atribuição guardada, se ainda dentro da validade.
  function fromStorage() {
    var raw = retrieve(CONFIG.storageKey);
    if (!raw) return null;

    var saved;
    try {
      saved = JSON.parse(raw);
    } catch (e) {
      return null;
    }

    var age = Date.now() - (saved.t || 0);
    if (age > CONFIG.ttlDays * 864e5) return null;

    return saved.p || null;
  }

  /*
   * Last touch: se esta visita chegou com parâmetros, ela substitui o que
   * estava guardado — é o anúncio mais recente que pagou por este lead.
   * Sem parâmetros (visita direta, digitou a URL, voltou depois), vale o que
   * ficou guardado da última visita paga.
   */
  function resolve() {
    var current = fromUrl();

    if (current) {
      store(CONFIG.storageKey, JSON.stringify({ p: current, t: Date.now() }));
      return current;
    }

    return fromStorage() || {};
  }

  // Linha compacta de origem, para o SDR ler no primeiro contato.
  function originLine(attrib) {
    var parts = [];

    if (attrib.utm_source) parts.push(attrib.utm_source);
    if (attrib.utm_medium) parts.push(attrib.utm_medium);
    if (attrib.utm_campaign) parts.push(attrib.utm_campaign);
    if (attrib.utm_content) parts.push(attrib.utm_content);

    if (!parts.length) {
      if (document.referrer) {
        try {
          parts.push(new URL(document.referrer).hostname);
        } catch (e) {
          parts.push('referral');
        }
      } else {
        parts.push('direto');
      }
    }

    return '[origem: ' + parts.join(' · ') + ']';
  }

  function buildHref(attrib) {
    var text = CONFIG.message + '\n\n' + originLine(attrib);
    return 'https://wa.me/' + CONFIG.phone + '?text=' + encodeURIComponent(text);
  }

  function track(placement, attrib) {
    if (typeof window.fbq !== 'function') return;

    var payload = { placement: placement };
    TRACKED.forEach(function (key) {
      if (attrib[key]) payload[key] = attrib[key];
    });

    // trackCustom, com nome próprio. Nunca `track('LeadQualificado', ...)`.
    window.fbq('trackCustom', CONFIG.clickEvent, payload);
  }

  function init() {
    var attrib = resolve();
    var href = buildHref(attrib);
    var buttons = document.querySelectorAll('[data-sdr]');

    Array.prototype.forEach.call(buttons, function (button) {
      // Todo botão da página vai para o mesmo destino, com a mesma mensagem.
      // O que diferencia um do outro é o parâmetro do evento, não o link.
      button.setAttribute('href', href);

      button.addEventListener('click', function () {
        track(button.getAttribute('data-sdr-placement') || 'sem-rotulo', attrib);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
