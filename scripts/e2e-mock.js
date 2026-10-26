// Мок Telegram.WebApp.Serverless для локального e2e-теста UI (dist-test).
(function () {
  var seq = 0;
  function ev(type, payload) { return { id: ++seq, type: type, payload: payload, at: Date.now() }; }
  var events = [];
  var served = 0;
  var replyText = 'Кратко: сначала претензия магазину в письменном виде, затем — жалоба в Роспотребнадзор.\n\n**Претензия** — официальное письмо со ссылкой на ст. 25 Закона о защите прав потребителей.';
  var reasoningAll = 'Пользователь спрашивает про возврат товара в течение 14 дней. Нужно вспомнить нормы ЗоЗПП: ст. 25 — обмен/возврат товара надлежащего качества в течение 14 дней.\n\nДальше: деньги не возвращают. Ст. 22 ЗоЗПП — 10 дней на возврат денег после требования. Значит план: претензия письменно, потом Роспотребнадзор, потом суд.';
  function buildEvents() {
    seq = 0; served = 0;
    events = [
      ev('start', { model: 'nvidia/nemotron-3.5-super-vl-120b-a12b', reasoning: 'medium', agentId: 'lawyer', agentName: 'Правовед' }),
      ev('image', { index: 0, name: 'doc.png', description: 'Скриншот договора аренды: шапка с реквизитами сторон, таблица платежей, подпись внизу.', cached: false }),
      ev('reasoning', { text: reasoningAll.slice(0, 130) }),
      ev('reasoning', { text: reasoningAll.slice(130) }),
      ev('skill', { id: 'rf-consult-protocol', name: 'Протокол юридической консультации' }),
      ev('content', { text: replyText }),
      ev('done', { messageId: 555, content: replyText, meta: { model: 'nvidia/nemotron-3.5-super-vl-120b-a12b', reasoning: 'medium', latencyMs: 6400, tokens: { prompt: 210, completion: 180, total: 390 }, skills: [{ id: 'rf-consult-protocol', name: 'Протокол юридической консультации' }], steps: [{ type: 'image_read', name: 'doc.png', ms: 900, desc: 'Скриншот договора аренды: шапка с реквизитами сторон, таблица платежей, подпись внизу.' }, { type: 'skill_read', skill: 'rf-consult-protocol', ms: 3200 }], reasoningText: reasoningAll, error: null } }),
    ];
  }
  var turnN = 0;
  window.__e2eMock = true;
  window.Telegram = { WebApp: {
    ready: function () {}, expand: function () {}, disableVerticalSwipes: function () {},
    setHeaderColor: function () {}, setBackgroundColor: function () {},
    initData: 'mock', initDataUnsafe: { user: { id: 4242, first_name: 'E2E' } },
    HapticFeedback: { impactOccurred: function () {} },
    Serverless: { call: function (name, input, cb) {
      setTimeout(function () {
        if (name === 'listAgents') return cb(null, { agents: [
          { id: 'chat', name: 'Общение', tagline: 'Универсальный собеседник', description: 'd', color: '#7C8CF8' },
          { id: 'lawyer', name: 'Правовед', tagline: 'Право и документы', description: 'd', color: '#C9A227' },
        ] });
        if (name === 'getHistory') return cb(null, { conversationId: null, agentId: 'chat', title: null, messages: [], reasoning: 'fast' });
        if (name === 'listConversations') return cb(null, { conversations: [] });
        if (name === 'newConversation') return cb(null, { conversationId: 9000 + (++turnN) });
        if (name === 'getTurnEvents') {
          var before = served;
          served = Math.min(events.length, served + 2);
          var out = events.slice(before, served);
          return cb(null, { turnId: input.turnId, events: out, lastId: served, done: served >= events.length && out.length > 0 && out[out.length - 1].type === 'done' });
        }
        if (name === 'sendMessage') {
          buildEvents();
          setTimeout(function () {
            cb(null, { conversationId: 9001, agentId: 'lawyer', agentName: 'Правовед', reply: replyText, reasoning: 'medium', meta: events[events.length - 1].payload.meta, attachments: [] });
          }, 7000);
          return;
        }
        cb({ message: 'unknown endpoint ' + name });
      }, 60);
    } },
  } };
})();
