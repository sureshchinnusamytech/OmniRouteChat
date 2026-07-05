import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const renderer = new Renderer();

(renderer as any).code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : undefined;
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value;
  const langLabel = lang || 'text';
  const escapedCode = escapeHtml(text);
  return `<div class="code-block">
  <div class="code-block__header">
    <span class="code-block__lang">${langLabel}</span>
    <button class="code-block__copy" data-code="${escapedCode}" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      <span>Copy</span>
    </button>
  </div>
  <pre><code class="hljs">${highlighted}</code></pre>
</div>`;
};

(renderer as any).codespan = ({ text }: { text: string }) => {
  return `<code class="inline-code">${text}</code>`;
};

(renderer as any).link = ({ href, text }: { href: string; text: string }) => {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked.use({ renderer, gfm: true, breaks: true });

export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  const raw = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['data-code', 'type'],
    ADD_TAGS: ['button'],
  });
}
