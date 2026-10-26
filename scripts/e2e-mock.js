// Мок Telegram.WebApp.Serverless для локального e2e-теста UI (dist-test).
// Эмулирует пайплайн хода (startTurn/runTurnStep/finishTurn/getTurn/stopTurn)
// и legacy sendMessage (editMessage). ?resume=1 — активный ход для баннера.
(function () {
  var seq = 0;
  function ev(type, payload) { return { id: ++seq, type: type, payload: payload, at: Date.now() }; }
  var events = [];
  var served = 0;
  var stepCursor = 0;
  var replyText = 'Кратко: сначала претензия магазину в письменном виде, затем — жалоба в Роспотребнадзор.\n\n**Претензия** — официальное письмо со ссылкой на ст. 25 Закона о защите прав потребителей.';
  var reasoningAll = 'Пользователь спрашивает про возврат товара в течение 14 дней. Нужно вспомнить нормы ЗоЗПП: ст. 25 — обмен/возврат товара надлежащего качества в течение 14 дней.\n\nДальше: деньги не возвращают. Ст. 22 ЗоЗПП — 10 дней на возврат денег после требования. Значит план: претензия письменно, потом Роспотребнадзор, потом суд.';
  var visionDesc = 'Скриншот договора аренды: шапка с реквизитами сторон, таблица платежей, подпись внизу.';
  var planSteps = [
    { type: 'vision', title: 'Изучить документ' },
    { type: 'search', title: 'Нормы возврата товара', params: { query: 'возврат товара 14 дней ЗоЗПП' } },
    { type: 'read_url', title: 'Статья о правах потребителя', params: { url: 'https://www.consultant.ru/document/cons_doc_LAW_30558/' } },
    { type: 'reason', title: 'Анализ ситуации клиента' },
    { type: 'synthesize', title: 'Финальный ответ' },
  ];
  var turnMeta = {
    model: 'nvidia/nemotron-3.5-super-120b-a12b', reasoning: 'medium', latencyMs: 12400,
    tokens: { prompt: 980, completion: 640, total: 1620 },
    skills: [], reasoningText: reasoningAll, error: null,
    steps: [
      { type: 'vision', title: 'Изучить документ', ms: 900, ok: true, finding: visionDesc },
      { type: 'search', title: 'Нормы возврата товара', ms: 1400, ok: true, finding: 'Ст. 25 ЗоЗПП: обмен товара надлежащего качества — 14 дней. Ст. 22: деньги — 10 дней.' },
      { type: 'read_url', title: 'Статья о правах потребителя', ms: 1100, ok: true, finding: 'Текст статьи: порядок возврата и претензии.' },
      { type: 'reason', title: 'Анализ ситуации клиента', ms: 5200, ok: true, finding: 'Претензия письменно, затем Роспотребнадзор.' },
      { type: 'synthesize', title: 'Финальный ответ', ms: 3800, ok: true },
    ],
  };
  function buildEvents() {
    seq = 0; served = 0; stepCursor = 0;
    events = [
      ev('start', { model: null, reasoning: 'medium', agentId: 'lawyer', agentName: 'Правовед', pipeline: true }),
      ev('plan', { steps: planSteps.map(function (s) { return { type: s.type, title: s.title }; }), ok: true, repaired: true, model: 'nvidia/nemotron-3.5-bolt-e4b', latencyMs: 2300 }),
      ev('step_start', { index: 0, type: 'vision', title: 'Изучить документ' }),
      ev('image', { index: 0, name: 'doc.png', description: visionDesc, cached: false }),
      ev('step_done', { index: 0, type: 'vision', title: 'Изучить документ', ok: true, ms: 900 }),
      ev('step_start', { index: 1, type: 'search', title: 'Нормы возврата товара' }),
      ev('search', { index: 1, query: 'возврат товара 14 дней ЗоЗПП', count: 3, items: [
        { title: 'Ст. 25 ЗоЗПП — обмен товара', link: 'https://www.consultant.ru/document/cons_doc_LAW_30558/121c0c9cf7d69f7d1e38563c7d69f7d/', snippet: 'Потребитель вправе обменять непродовольственный товар надлежащего качества в течение 14 дней.' },
        { title: 'Ст. 22 ЗоЗПП — сроки возврата денег', link: 'https://www.consultant.ru/document/cons_doc_LAW_30558/22/', snippet: 'Требование о возврате денежных средств подлежит удовлетворению в течение 10 дней.' },
      ] }),
      ev('step_done', { index: 1, type: 'search', title: 'Нормы возврата товара', ok: true, ms: 1400 }),
      ev('step_start', { index: 2, type: 'read_url', title: 'Статья о правах потребителя' }),
      ev('read_url', { index: 2, url: 'https://www.consultant.ru/document/cons_doc_LAW_30558/', via: 'direct', chars: 15000 }),
      ev('step_done', { index: 2, type: 'read_url', title: 'Статья о правах потребителя', ok: true, ms: 1100 }),
      ev('step_start', { index: 3, type: 'reason', title: 'Анализ ситуации клиента' }),
      ev('reasoning', { text: reasoningAll.slice(0, 140) }),
      ev('reasoning', { text: reasoningAll.slice(140) }),
      ev('step_done', { index: 3, type: 'reason', title: 'Анализ ситуации клиента', ok: true, ms: 5200 }),
      ev('step_start', { index: 4, type: 'synthesize', title: 'Финальный ответ' }),
      ev('content', { text: replyText.slice(0, 80) }),
      ev('content', { text: replyText.slice(80) }),
      ev('done', { messageId: 555, content: replyText, meta: turnMeta }),
    ];
  }
  // Результаты runTurnStep по шагам (индекс = сколько шагов уже исполнено).
  var stepResults = [
    { status: 'executing', currentStep: 1, stepResult: { index: 0, type: 'vision', title: 'Изучить документ', ok: true, ms: 900, finding: visionDesc } },
    { status: 'executing', currentStep: 2, stepResult: { index: 1, type: 'search', title: 'Нормы возврата товара', ok: true, ms: 1400, finding: 'Ст. 25 ЗоЗПП: обмен — 14 дней. Ст. 22: деньги — 10 дней.' } },
    { status: 'executing', currentStep: 3, stepResult: { index: 2, type: 'read_url', title: 'Статья о правах потребителя', ok: true, ms: 1100 } },
    { status: 'executing', currentStep: 4, stepResult: { index: 3, type: 'reason', title: 'Анализ ситуации клиента', ok: true, ms: 5200, finding: 'Претензия письменно, затем Роспотребнадзор.' } },
    { status: 'done', message: { id: 555, content: replyText, meta: turnMeta }, stepResult: { index: 4, type: 'synthesize', ok: true, ms: 3800 } },
  ];
  var turnN = 0;
  window.__e2eMock = true;
  var params = new URLSearchParams(window.location.search);
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
        if (name === 'getHistory') {
          var withImage = params.get('img') === '1';
          return cb(null, {
            conversationId: params.get('resume') === '1' ? 9002 : null,
            agentId: 'chat', title: null, reasoning: 'fast',
            messages: withImage ? [
              { id: 10, role: 'user', content: '', attachments: [{ fileId: 777, name: 'IMG_20261026.webp', mime: 'image/webp', size: 328 }] },
              { id: 11, role: 'assistant', content: 'Ответ с картинкой в истории.', meta: null },
            ] : [],
          });
        }
        if (name === 'getFileChunk') {
          return cb(null, { dataBase64: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAvUlEQVR4nO3ZuxGEMBRDUZdDOdt/FXTAJiQkfCxh8eDeIbZ1MhjaXLyWHqAGIB2AdADSvRqwTNP5Z+DmTQAAiAEAIAYAgJgf0H7L/vNcwOH0Oxg2wKX1RoMH0LHeZTAAutdbDOr3gLheN0gAy3rR8GGAcb1iAAAAAAAAAADUBJR/F3oDoPz3gMWg3q4DFIPhasf+uc/guddyynrW8PW3/OQbNn29znvc+ACkA5AOQDoA6QCkA5AOQDoA6coD/tR0IJpjf0a1AAAAAElFTkSuQmCC', mime: 'image/webp', name: 'IMG_20261026.webp', size: 328, chunkCount: 1 });
        }
        if (name === 'listConversations') return cb(null, { conversations: [] });
        if (name === 'newConversation') return cb(null, { conversationId: 9000 + (++turnN) });
        if (name === 'getTurnEvents') {
          var before = served;
          served = Math.min(events.length, served + 10);
          var out = events.slice(before, served);
          return cb(null, { turnId: input.turnId, events: out, lastId: served, done: served >= events.length && out.length > 0 && out[out.length - 1].type === 'done' });
        }
        if (name === 'startTurn') {
          buildEvents();
          return cb(null, { turnId: 'a-mock-' + Date.now().toString(36), conversationId: 9001, agentId: 'lawyer', agentName: 'Правовед', status: 'executing', plan: planSteps, planMeta: { ok: true, repaired: true, model: 'nvidia/nemotron-3.5-bolt-e4b', latencyMs: 2300 }, reasoning: 'medium' });
        }
        if (name === 'runTurnStep') {
          var r = stepResults[Math.min(stepCursor, stepResults.length - 1)];
          if (stepCursor < stepResults.length) stepCursor += 1;
          return cb(null, r);
        }
        if (name === 'finishTurn') return cb(null, { status: 'done', message: { id: 555, content: replyText, meta: turnMeta } });
        if (name === 'stopTurn') return cb(null, { status: 'stopped', stepsDone: 2, summary: '⏹ Ход остановлен.\nШагов выполнено: 2.\n• Изучить документ\n• Нормы возврата товара' });
        if (name === 'getTurn') {
          if (params.get('resume') === '1' && !window.__resumeConsumed) {
            window.__resumeConsumed = true;
            buildEvents();
            return cb(null, { turn: { turnId: 'a-resume-mock', conversationId: 9002, status: 'executing', question: 'Вернули бракованный товар — что делать?', plan: planSteps, currentStep: 2, findings: [], reasoningLevel: 'medium', error: null } });
          }
          return cb(null, { turn: null });
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
