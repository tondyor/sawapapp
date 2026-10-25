const fs = require('fs');
for (const f of ['tgcloud/lib/files.js','tgcloud/lib/chat.js','tgcloud/handlers/message.js','tgcloud/lib/agents.js','src/components/Drawer.jsx','src/components/AgentSheet.jsx','src/lib/api.js']) {
  const s = fs.readFileSync(f, 'utf8');
  const codes = [];
  for (let i = 0; i < s.length && codes.length < 8; i++) {
    if (s.charCodeAt(i) > 127) codes.push(s.charCodeAt(i).toString(16));
  }
  console.log(f, 'non-ascii codepoints:', codes.join(',') || '(none)');
}

