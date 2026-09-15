/**
 * Small, safe rich text. Owners write ordinary text in Studio with a light
 * syntax: blank line = new paragraph, ## Heading, - list item, **bold**,
 * _italic_ and [link text](/destination). Everything is HTML-escaped first,
 * so pasted markup can never become live script; link destinations are
 * restricted to relative paths, https, http, mailto and tel.
 */

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function safeUrl(url: string): string | null {
  const u = url.trim();
  if (/^(https?:)?\/\//i.test(u)) return /^https?:\/\//i.test(u) ? u : null;
  if (/^(mailto:|tel:)/i.test(u)) return u;
  if (u.startsWith('/') || u.startsWith('#')) return u;
  return null;
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const safe = safeUrl(url);
    return safe ? `<a href="${escapeHtml(safe)}">${text}</a>` : text;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|\s)_([^_]+)_(?=\s|[.,;:!?]|$)/g, '$1<em>$2</em>');
  return out;
}

export function renderRichText(source: string): string {
  const blocks = String(source ?? '').replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const html: string[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    if (!lines.length) continue;
    if (lines.every((l) => l.trim().startsWith('- '))) {
      html.push('<ul>' + lines.map((l) => `<li>${inline(l.trim().slice(2))}</li>`).join('') + '</ul>');
      continue;
    }
    const first = lines[0].trim();
    if (first.startsWith('### ')) {
      html.push(`<h4>${inline(first.slice(4))}</h4>`);
      lines.shift();
    } else if (first.startsWith('## ')) {
      html.push(`<h3>${inline(first.slice(3))}</h3>`);
      lines.shift();
    } else if (first.startsWith('# ')) {
      html.push(`<h2>${inline(first.slice(2))}</h2>`);
      lines.shift();
    }
    if (lines.length) html.push(`<p>${lines.map((l) => inline(l.trim())).join('<br />')}</p>`);
  }
  return html.join('\n');
}

/** Plain readable text for search and the assistant export. */
export function richTextToPlain(source: string): string {
  return String(source ?? '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^-\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
