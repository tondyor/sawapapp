// Локальный e2e-прогон UI без Telegram: собирает dist/ и создаёт dist-test/ —
// копию с моком Telegram.WebApp.Serverless (scripts/e2e-mock.js), вшитым в head.
// Запуск: node scripts/make-dist-test.cjs && npx vite preview --port 4173 --outDir dist-test
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const distTest = path.join(root, 'dist-test');
const mockSrc = path.join(root, 'scripts', 'e2e-mock.js');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('Сначала собери фронт: npm run build');
  process.exit(1);
}

fs.rmSync(distTest, { recursive: true, force: true });
fs.cpSync(dist, distTest, { recursive: true });

let html = fs.readFileSync(path.join(distTest, 'index.html'), 'utf8');
// Настоящий SDK с telegram.org загрузится позже и перезапишет window.Telegram —
// для теста он не нужен вовсе.
html = html.replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>', '');
const mock = '<script>' + fs.readFileSync(mockSrc, 'utf8') + '</' + 'script>';
html = html.replace('<script type="module"', mock + '\n<script type="module"');
fs.writeFileSync(path.join(distTest, 'index.html'), html);
console.log('dist-test готов: npx vite preview --port 4173 --outDir dist-test');
