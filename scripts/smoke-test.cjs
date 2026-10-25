const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const distDir = path.join(__dirname, '..', 'dist');
const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
if (!m) { console.log('FAIL: bundle not found in index.html'); process.exit(1); }
const bundlePath = path.join(distDir, m[1]);
const bundleCode = fs.readFileSync(bundlePath, 'utf8');

const errors = [];
const vc = new VirtualConsole();
vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 300)));
vc.on('jsdomError', (e) => errors.push(String(e && e.message || e).slice(0, 300)));

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://app8872967138.tgcloud.ai/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
});

const w = dom.window;

w.HTMLElement.prototype.scrollIntoView = function () {};
if (!w.navigator.clipboard) {
  Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: async () => {} } });
}

const AGENTS = {
  agents: [
    { id: 'chat', name: 'Общение', tagline: 'Универсальный собеседник', description: 'Свободный диалог.', color: '#7C8CF8' },
    { id: 'lawyer', name: 'Правовед', tagline: 'Право и документы', description: 'Правовые вопросы.', color: '#C9A227' },
    { id: 'marketer', name: 'Маркетолог', tagline: 'Стратегия и рост', description: 'Продвижение.', color: '#34D399' },
    { id: 'designer', name: 'Дизайнер', tagline: 'UI/UX и визуал', description: 'Интерфейсы.', color: '#F472B6' },
    { id: 'copywriter', name: 'Копирайтер', tagline: 'Тексты', description: 'Тексты.', color: '#38BDF8' },
  ],
};

const calls = [];
w.Telegram = {
  WebApp: {
    ready: () => {},
    expand: () => {},
    setHeaderColor: () => {},
    setBackgroundColor: () => {},
    initData: 'query_id=test&user=%7B%22id%22%3A987654321%7D',
    initDataUnsafe: { user: { id: 987654321, first_name: 'Test' } },
    Serverless: {
      call(name, input, cb) {
        calls.push(name);
        setTimeout(() => {
          if (name === 'listAgents') cb(null, AGENTS);
          else if (name === 'listConversations') cb(null, { conversations: [] });
          else if (name === 'getHistory') cb(null, { conversationId: null, agentId: 'chat', reasoning: 'fast', messages: [] });
          else cb(null, {});
        }, 5);
      },
    },
    HapticFeedback: { impactOccurred: () => {} },
  },
};

try {
  w.eval(bundleCode);
} catch (e) {
  console.log('FAIL: bundle eval threw:', String(e && e.message || e).slice(0, 400));
  process.exit(1);
}

setTimeout(() => {
  const root = w.document.getElementById('root');
  const children = root ? root.children.length : 0;
  const text = root ? (root.textContent || '').slice(0, 400) : '';
  const cyr = String.fromCharCode(0x0411, 0x044b); // 'Бы'
  const mojibake = text.indexOf(String.fromCharCode(0x0420, 0x2018)) >= 0; // 'Р‘' double-encoded marker
  console.log('--- SMOKE RESULT ---');
  console.log('root children:', children);
  console.log('endpoints called:', calls.join(', ') || '(none)');
  console.log('rendered text:', JSON.stringify(text));
  console.log('cyrillic ok:', text.includes(cyr), '| mojibake:', mojibake);
  console.log('console errors:', errors.length ? errors.join(' | ') : '(none)');
  const ok = children > 0
    && calls.includes('listAgents')
    && text.includes(cyr)
    && !mojibake
    && !errors.some((e) => /minified|error/i.test(e));
  console.log(ok ? 'PASS: React mounted, endpoints called, no errors' : 'FAIL');
  process.exit(ok ? 0 : 1);
}, 800);
