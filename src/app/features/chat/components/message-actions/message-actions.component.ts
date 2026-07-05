import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-message-actions',
  standalone: true,
  template: `
    <div class="msg-actions">
      <button class="msg-action-btn" [title]="copyLabel()" (click)="onCopy()">
        @if (copyLabel() === 'Copied!') {
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        } @else {
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        }
        <span>{{ copyLabel() }}</span>
      </button>

      @if (role() === 'assistant') {
        <button class="msg-action-btn" title="Regenerate" (click)="regenerate.emit()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          <span>Regenerate</span>
        </button>
      }

      @if (role() === 'user') {
        <button class="msg-action-btn" title="Edit" (click)="edit.emit()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Edit</span>
        </button>
      }

      <button class="msg-action-btn msg-action-btn--danger" title="Delete" (click)="delete.emit()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  `,
  styles: [`
    .msg-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      opacity: 0;
      transition: opacity var(--transition-fast);
      margin-top: 4px;
    }
    :host(.visible) .msg-actions { opacity: 1; }
    .msg-action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: 11px;
      color: var(--text-muted);
      border-radius: var(--radius-xs);
      transition: all var(--transition-fast);
      white-space: nowrap;
    }
    .msg-action-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    .msg-action-btn--danger:hover {
      background: rgba(239,68,68,0.1);
      color: var(--accent-danger);
    }
    .msg-action-btn span { display: none; }
    :host(.visible) .msg-action-btn:hover span { display: inline; }
  `],
  host: { '[class.visible]': 'visible()' }
})
export class MessageActionsComponent {
  role = input.required<'user' | 'assistant'>();
  visible = input<boolean>(false);
  content = input<string>('');

  copy = output<void>();
  regenerate = output<void>();
  edit = output<void>();
  delete = output<void>();

  copyLabel = signal('Copy');

  async onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.content());
      this.copyLabel.set('Copied!');
      setTimeout(() => this.copyLabel.set('Copy'), 2000);
    } catch {
      this.copyLabel.set('Error');
      setTimeout(() => this.copyLabel.set('Copy'), 2000);
    }
    this.copy.emit();
  }
}
