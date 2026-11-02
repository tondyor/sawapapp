const fs = require('fs');
for (const f of ['src/components/Chat.jsx', 'src/lib/api.js', 'src/lib/img.js', 'tgcloud/lib/agents.js']) {
  const s = fs.readFileSync(f, 'utf8');
  const repl = (s.match(/\uFFFD/g) || []).length;
  const bystro = s.includes('\u0411\u044b\u0441\u0442\u0440\u043e');
  const privet = s.includes('\u041f\u0440\u0438\u0432\u0435\u0442');
  console.log(`${f}: replacementChars=${repl} hasBystro=${bystro} hasPrivet=${privet}`);
}
