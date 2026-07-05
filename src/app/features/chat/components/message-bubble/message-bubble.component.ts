import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../../core/models/conversation.model';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { MessageActionsComponent } from '../message-actions/message-actions.component';
import { TokenMetadataComponent } from '../token-metadata/token-metadata.component';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [FormsModule, MarkdownPipe, MessageActionsComponent, TokenMetadataComponent],
  template: `
    <div
      class="bubble-wrapper"
      [class.bubble-wrapper--user]="isUser()"
      [class.bubble-wrapper--assistant]="isAssistant()"
      (mouseenter)="showActions.set(true)"
      (mouseleave)="showActions.set(false)">

      <!-- Avatar -->
      <div class="bubble-avatar" [class.bubble-avatar--user]="isUser()">
        @if (isUser()) {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        } @else {
          <span class="ai-avatar-icon">◆</span>
        }
      </div>

      <!-- Bubble Content -->
      <div class="bubble-content">
        @if (isEditing()) {
          <!-- Edit Mode -->
          <div class="bubble-edit">
            <textarea
              class="bubble-edit__input"
              [(ngModel)]="editContent"
              rows="3"
              (keydown.enter)="onEditKeydown($event)"></textarea>
            <div class="bubble-edit__actions">
              <button class="bubble-edit__cancel" (click)="cancelEdit()">Cancel</button>
              <button class="bubble-edit__submit" (click)="submitEdit()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send Edit
              </button>
            </div>
          </div>
        } @else {
          <!-- Message Bubble -->
          <div class="bubble" [class.bubble--user]="isUser()" [class.bubble--assistant]="isAssistant()">

            <!-- Attached images (user messages) -->
            @if (isUser() && message().images?.length) {
              <div class="bubble-images">
                @for (img of message().images!; track img.id) {
                  <img [src]="img.base64" [alt]="img.name" class="bubble-images__img" (click)="openImagePreview(img.base64)" />
                }
              </div>
            }

            @if (isUser()) {
              <p class="bubble__text">{{ message().content }}</p>
            } @else {
              <div
                class="markdown-content bubble__markdown"
                [innerHTML]="message().content | markdown"
                (click)="onMarkdownClick($event)"></div>
              @if (isStreaming()) {
                <span class="streaming-cursor" aria-hidden="true">▊</span>
              }
            }
          </div>

          <!-- Token metadata (assistant only) -->
          @if (isAssistant() && !isStreaming() && message().metadata) {
            <app-token-metadata [metadata]="message().metadata!" />
          }

          <!-- Actions -->
          @if (!isStreaming()) {
            <app-message-actions
              [role]="message().role === 'user' ? 'user' : 'assistant'"
              [visible]="showActions()"
              [content]="message().content"
              (regenerate)="regenerate.emit(message().id)"
              (edit)="startEdit()"
              (delete)="delete.emit(message().id)" />
          }
        }
      </div>
    </div>
  `,
  styleUrl: './message-bubble.component.css',
})
export class MessageBubbleComponent {
  message = input.required<Message>();
  isStreaming = input<boolean>(false);

  regenerate = output<string>();
  edit = output<{ id: string; content: string }>();
  delete = output<string>();

  showActions = signal(false);
  isEditing = signal(false);
  editContent = '';

  isUser = computed(() => this.message().role === 'user');
  isAssistant = computed(() => this.message().role === 'assistant');

  startEdit(): void {
    this.editContent = this.message().content;
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  onEditKeydown(event: Event): void {
    if ((event as KeyboardEvent).ctrlKey) {
      this.submitEdit();
    }
  }

  submitEdit(): void {
    if (this.editContent.trim()) {
      this.edit.emit({ id: this.message().id, content: this.editContent.trim() });
    }
    this.isEditing.set(false);
  }

  onMarkdownClick(event: Event): void {
    const btn = (event.target as HTMLElement).closest('.code-block__copy') as HTMLButtonElement;
    if (btn) {
      const code = btn.dataset['code'] || '';
      navigator.clipboard.writeText(code).then(() => {
        const span = btn.querySelector('span');
        if (span) {
          span.textContent = 'Copied!';
          setTimeout(() => { if (span) span.textContent = 'Copy'; }, 2000);
        }
      });
    }
  }

  openImagePreview(base64Url: string): void {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>Image Preview</title>
        <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0d0d14;}
        img{max-width:95vw;max-height:95vh;border-radius:8px;box-shadow:0 4px 30px rgba(0,0,0,0.5);}</style></head>
        <body><img src="${base64Url}" /></body></html>
      `);
    }
  }
}
