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

// ── LaTeX → читаемый текст ─────────────────────────────────────────
// Модель иногда отвечает формулами ($$...$$ и $...$), которые клиент не
// рисует. Превращаем их в плоский читаемый вид: \frac{a}{b} → (a)/(b),
// \times → ×, \ge → ≥ и т.д. Инлайн-$ конвертируем только если внутри
// есть LaTeX-команда (обратный слэш) — чтобы не ломать цены вида $1000.
function deLatexExpr(s) {
  let out = s;
  // Раскрываем \frac и \text итеративно — они бывают вложены друг в друга
  for (let i = 0; i < 6; i++) {
    const prev = out;
    out = out.replace(/\\frac\s*\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
    out = out.replace(/\\text\s*\{([^{}]*)\}/g, '$1');
    if (out === prev) break;
  }
  return out
    .replace(/\\(rightarrow|to)\b/g, '→')
    .replace(/\\(times|cdot)\b/g, '×')
    .replace(/\\(ge|geq|geqslant)\b/g, '≥')
    .replace(/\\(le|leq)\b/g, '≤')
    .replace(/\\(approx)\b/g, '≈')
    .replace(/\\left|\\right/g, '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\/g, '')
    .replace(/[{}]/g, '')
    .trim();
}

function deLatex(chunk) {
  let out = chunk.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => deLatexExpr(expr));
  out = out.replace(/\$([^$\n]+?)\$/g, (m, expr) => (expr.includes('\\') ? deLatexExpr(expr) : m));
  return out;
}

// ── GFM-таблицы ────────────────────────────────────────────────────
// | A | B |        → <table><thead><tr><th>A</th>…  (с выравниванием
// | --- |:---: |     из разделителя и inline-разметкой внутри ячеек).
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s
    .replace(/\\\|/g, '\u0001')
    .split('|')
    .map((c) => c.trim().replace(/\u0001/g, '|'));
}

function isSepRow(line) {
  if (!line.includes('|')) return false;
  const cells = splitRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
}

function alignOf(sepCell) {
  if (sepCell.startsWith(':') && sepCell.endsWith(':')) return 'center';
  if (sepCell.endsWith(':')) return 'right';
  return 'left';
}

function tableHtml(headCells, aligns, rows) {
  const cell = (content, tag, k) => {
    const a = aligns[k] || 'left';
    const style = a === 'left' ? '' : ` style="text-align:${a}"`;
    return `<${tag}${style}>${renderInline(content)}</${tag}>`;
  };
  let h = '<table><thead><tr>';
  headCells.forEach((c, k) => { h += cell(c, 'th', k); });
  h += '</tr></thead>';
  if (rows.length) {
    h += '<tbody>';
    for (const r of rows) {
      h += '<tr>';
      const n = Math.max(headCells.length, r.length);
      for (let k = 0; k < n; k++) h += cell(r[k] ?? '', 'td', k);
      h += '</tr>';
    }
    h += '</tbody>';
  }
  return `${h}</table>`;
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
    const lines = deLatex(parts[i]).split('\n');
    let list = null;
    let idx = 0;
    while (idx < lines.length) {
      const line = lines[idx];
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      const li = line.match(/^\s*[-*•]\s+(.*)$/);
      const oli = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      const bq = line.match(/^>\s?(.*)$/);
      const empty = line.trim() === '';

      // Таблица: строка с «|», за которой идёт разделитель «|---|---|»
      if (!h && !li && !oli && !bq && line.includes('|') && idx + 1 < lines.length && isSepRow(lines[idx + 1])) {
        if (list) { blocks.push(list === 'ul' ? '</ul>' : '</ol>'); list = null; }
        const aligns = splitRow(lines[idx + 1]).map(alignOf);
        const head = splitRow(line);
        const rows = [];
        let j = idx + 2;
        while (j < lines.length && lines[j].includes('|') && lines[j].trim() !== '') {
          rows.push(splitRow(lines[j]));
          j += 1;
        }
        blocks.push(tableHtml(head, aligns, rows));
        idx = j;
        continue;
      }

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
        idx += 1;
        continue;
      } else {
        blocks.push(`<p>${renderInline(line)}</p>`);
      }
      idx += 1;
    }
    if (list) blocks.push(list === 'ul' ? '</ul>' : '</ol>');
  }
  return blocks.join('');
}
