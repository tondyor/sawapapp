const fs = require('fs');
for (const f of ['src/components/Chat.jsx', 'tgcloud/lib/agents.js']) {
  const s = fs.readFileSync(f, 'utf8');
  const codes = [];
  for (let i = 0; i < s.length && codes.length < 8; i++) {
    if (s.charCodeAt(i) > 127) codes.push(s.charCodeAt(i).toString(16));
  }
  console.log(f, 'non-ascii codepoints:', codes.join(',') || '(none)');
}
