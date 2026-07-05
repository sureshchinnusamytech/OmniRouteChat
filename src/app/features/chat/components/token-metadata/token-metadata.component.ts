import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-token-metadata',
  standalone: true,
  template: `
    @if (metadata().totalTokens || metadata().latencyMs) {
      <div class="token-meta">
        @if (metadata().promptTokens != null) {
          <span class="token-meta__item" title="Prompt tokens">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            {{ metadata().promptTokens }}+{{ metadata().completionTokens }}={{ metadata().totalTokens }}
          </span>
          <span class="token-meta__sep">·</span>
        }
        @if (metadata().latencyMs != null) {
          <span class="token-meta__item" title="Response time">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ metadata().latencyMs }}ms
          </span>
        }
        @if (metadata().model) {
          <span class="token-meta__sep">·</span>
          <span class="token-meta__item token-meta__item--model" title="Model used">
            {{ metadata().model }}
          </span>
        }
      </div>
    }
  `,
  styles: [`
    .token-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--border-subtle);
    }
    .token-meta__item {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
    .token-meta__item--model {
      color: var(--accent-primary);
      opacity: 0.7;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--font-sans);
      font-size: 10px;
    }
    .token-meta__sep { color: var(--text-muted); font-size: 10px; opacity: 0.5; }
  `],
})
export class TokenMetadataComponent {
  metadata = input.required<{ promptTokens?: number; completionTokens?: number; totalTokens?: number; latencyMs?: number; model?: string }>();
}
