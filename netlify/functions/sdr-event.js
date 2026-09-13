/**
 * Ponte entre o Make e a Conversions API da Meta.
 *
 * O Make manda JSON plano com o telefone cru. Aqui a gente normaliza,
 * hasheia e monta o user_data antes de mandar para o dataset do SDR.
 *
 * Existe porque os eventos QUALIFIED / BAD / CONVERTED chegavam na Meta
 * com match_key_feedback vazio e composite_score 0 — sem chave de
 * correspondencia a Meta recebe o evento e nao consegue ligar a pessoa
 * nenhuma, e otimizacao por QUALIFIED fica impossivel.
 *
 * Variaveis de ambiente (as duas obrigatorias, falha fechado sem elas):
 *   META_CAPI_TOKEN       token da Conversions API do dataset
 *   SDR_WEBHOOK_SECRET    segredo compartilhado com o Make
 *   META_CAPI_TEST_CODE   opcional, so enquanto valida no Test Events
 */

'use strict';

const crypto = require('crypto');

const DATASET_ID = '963230822869669';
const API_VERSION = 'v21.0';

// Lista fechada. Endpoint publico nao escreve nome de evento arbitrario
// no dataset — isso envenenaria a otimizacao de quem achasse a URL.
const EVENTOS = new Set(['QUALIFIED', 'BAD', 'CONVERTED']);

// --- normalizacao + hash -------------------------------------------------
// Regra da Meta: normaliza primeiro, hasheia depois. SHA-256 hex minusculo.
// Campo sem valor e omitido: hash de string vazia conta como chave valida
// e suja a metrica.

const sha256 = (v) => crypto.createHash('sha256').update(v, 'utf8').digest('hex');

function hashEmail(raw) {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  return v.includes('@') ? sha256(v) : null;
}

/** So digitos, com codigo do pais. E aqui que os 34 leads sem 55 passam a casar. */
function hashPhone(raw, pais = '55') {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (!d.startsWith(pais)) d = pais + d;
  if (d.length < 12 || d.length > 13) return null;   // fora do formato BR
  if (/^(\d)\1{7,}/.test(d.slice(4))) return null;   // 99999999 e afins
  return sha256(d);
}

function hashNome(raw) {
  if (!raw) return null;
  const v = String(raw)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z]/g, '');
  return v ? sha256(v) : null;
}

function partirNome(completo) {
  const p = String(completo || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return { fn: null, ln: null };
  return { fn: hashNome(p[0]), ln: p.length > 1 ? hashNome(p[p.length - 1]) : null };
}

/**
 * Ordem de valor para este funil (Instant Form -> WhatsApp -> SDR):
 *   lead_id > ph > em > fn/ln
 * fbc e fbp normalmente nao existem aqui: o lead nunca tocou o site.
 * Quando existirem, vao em TEXTO PURO — esses dois nao sao hasheados.
 */
function montarUserData(lead) {
  const { fn, ln } = partirNome(lead.nome);
  const ud = {};

  if (lead.lead_id) ud.lead_id = String(lead.lead_id);

  const ph = hashPhone(lead.telefone);
  if (ph) ud.ph = [ph];

  const em = hashEmail(lead.email);
  if (em) ud.em = [em];

  if (fn) ud.fn = [fn];
  if (ln) ud.ln = [ln];
  if (lead.crm_id) ud.external_id = [sha256(String(lead.crm_id))];

  ud.country = [sha256('br')];

  if (lead.fbc) ud.fbc = lead.fbc;
  if (lead.fbp) ud.fbp = lead.fbp;

  return ud;
}

function montarEvento(nome, lead) {
  const ud = montarUserData(lead);

  // Guarda principal: sem chave de identidade nao envia. Mandar sem chave
  // e o bug que estamos consertando — melhor devolver 422 visivel.
  if (!ud.lead_id && !ud.ph && !ud.em && !ud.external_id) {
    const e = new Error('evento sem chave de identidade');
    e.code = 'SEM_CHAVE';
    throw e;
  }

  const quando = lead.quando ? new Date(lead.quando) : new Date();
  const ts = Math.floor((isNaN(quando) ? Date.now() : quando.getTime()) / 1000);

  const ev = {
    event_name: nome,
    event_time: ts,
    action_source: 'chat',   // conversa de WhatsApp
    user_data: ud,
    // deduplicacao: estavel por lead + evento, para reenvio nao contar duas vezes
    event_id: lead.event_id
      || `${nome}:${lead.crm_id || lead.lead_id || ud.ph?.[0] || ts}`,
  };

  if (nome === 'CONVERTED' && lead.valor != null && lead.valor !== '') {
    const v = Number(lead.valor);
    if (!isNaN(v)) ev.custom_data = { value: v, currency: lead.moeda || 'BRL' };
  }

  return ev;
}

// --- handler -------------------------------------------------------------

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, erro: 'use POST' });
  }

  const TOKEN = process.env.META_CAPI_TOKEN;
  const SECRET = process.env.SDR_WEBHOOK_SECRET;

  // Falha fechado: sem config nao processa. Evita que um deploy de branch
  // sem variavel de ambiente vire endpoint aberto.
  if (!TOKEN || !SECRET) {
    console.error('config ausente: META_CAPI_TOKEN e/ou SDR_WEBHOOK_SECRET');
    return json(503, { ok: false, erro: 'funcao nao configurada' });
  }

  const enviado = event.headers['x-sdr-secret'] || '';
  const a = Buffer.from(String(enviado));
  const b = Buffer.from(SECRET);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return json(401, { ok: false, erro: 'segredo invalido' });
  }

  let corpo;
  try {
    corpo = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, erro: 'JSON invalido' });
  }

  const nome = String(corpo.event || '').trim().toUpperCase();
  if (!EVENTOS.has(nome)) {
    return json(400, {
      ok: false,
      erro: `event deve ser um de: ${[...EVENTOS].join(', ')}`,
      recebido: nome || null,
    });
  }

  let ev;
  try {
    ev = montarEvento(nome, corpo);
  } catch (e) {
    if (e.code === 'SEM_CHAVE') {
      // 422 e proposital: o Make mostra o erro em vez de marcar sucesso.
      return json(422, {
        ok: false,
        erro: 'sem chave de identidade — mande lead_id, telefone, email ou crm_id',
      });
    }
    throw e;
  }

  const payload = { data: [ev] };
  if (process.env.META_CAPI_TEST_CODE) {
    payload.test_event_code = process.env.META_CAPI_TEST_CODE;
  }

  let resp, saida;
  try {
    resp = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${DATASET_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );
    saida = await resp.json();
  } catch (e) {
    console.error('falha de rede na CAPI:', e.message);
    return json(502, { ok: false, erro: 'CAPI inalcancavel' });
  }

  if (!resp.ok) {
    // Sem PII no log — so o que a Meta reclamou.
    console.error('CAPI rejeitou:', resp.status, JSON.stringify(saida));
    return json(502, { ok: false, status: resp.status, meta: saida });
  }

  return json(200, {
    ok: true,
    evento: nome,
    // quais chaves foram de fato enviadas, para conferir no Make
    chaves: Object.keys(ev.user_data).filter((k) => k !== 'country'),
    events_received: saida.events_received,
    fbtrace_id: saida.fbtrace_id,
  });
};

// exportado para teste local
exports._interno = { montarEvento, montarUserData, hashPhone, hashEmail, hashNome };
