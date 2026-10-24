function escapeHtml(s) {
  return s
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function renderInline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, '$1<em>$2</em>');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return out;
}

export function markdownToHtml(md) {
  if (!md) return '';
  const src = String(md).replace(/\r\n/g, '\n');
  const blocks = [];
  const parts = src.split(/```/);

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      const raw = parts[i];
      const nl = raw.indexOf('\n');
      const body = nl >= 0 ? raw.slice(nl + 1) : raw;
      blocks.push(`<pre><code>${escapeHtml(body.replace(/\n$/, ''))}</code></pre>`);
      continue;
    }
    const chunk = parts[i];
    const lines = chunk.split('\n');
    let list = null;
    for (const line of lines) {
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      const li = line.match(/^\s*[-*•]\s+(.*)$/);
      const oli = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      const bq = line.match(/^>\s?(.*)$/);
      const empty = line.trim() === '';
      if (!empty && list) { blocks.push(list === 'ul' ? '</ul>' : '</ol>'); list = null; }
      if (h) {
        blocks.push(`<h4>${renderInline(h[2])}</h4>`);
      } else if (li) {
        if (list !== 'ul') { blocks.push('<ul>'); list = 'ul'; }
        blocks.push(`<li>${renderInline(li[1])}</li>`);
      } else if (oli) {
        if (list !== 'ol') { blocks.push('<ol>'); list = 'ol'; }
        blocks.push(`<li>${renderInline(oli[2])}</li>`);
      } else if (bq) {
        blocks.push(`<blockquote>${renderInline(bq[1])}</blockquote>`);
      } else if (empty) {
        continue;
      } else {
        blocks.push(`<p>${renderInline(line)}</p>`);
      }
    }
    if (list) blocks.push(list === 'ul' ? '</ul>' : '</ol>');
  }
  return blocks.join('');
}
