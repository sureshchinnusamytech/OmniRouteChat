import { Component, ElementRef, ViewChild, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoutingStrategy, ImageAttachment } from '../../../../core/models/conversation.model';
import { ROUTING_STRATEGIES } from '../../../../core/constants/routing-strategies';
import { generateUUID } from '../../../../shared/utils/uuid.util';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="input-area">
      <div class="input-wrapper">

        <!-- Strategy Selector -->
        <div class="strategy-selector">
          @for (s of strategies; track s.value) {
            <button
              class="strategy-btn"
              [class.strategy-btn--active]="selectedStrategy() === s.value"
              [title]="s.description"
              (click)="selectStrategy(s.value)">
              <span>{{ s.icon }}</span>
              <span class="strategy-btn__label">{{ s.label }}</span>
            </button>
          }
        </div>

        <!-- Image Previews -->
        @if (attachedImages().length > 0) {
          <div class="image-previews">
            @for (img of attachedImages(); track img.id) {
              <div class="image-preview">
                <img [src]="img.base64" [alt]="img.name" class="image-preview__img" />
                <button class="image-preview__remove" (click)="removeImage(img.id)" title="Remove image" aria-label="Remove image">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <span class="image-preview__name">{{ img.name }}</span>
              </div>
            }
          </div>
        }

        <!-- Textarea Row -->
        <div class="textarea-row">
          <!-- Attach Image Button -->
          <button
            class="attach-btn"
            (click)="fileInput.click()"
            [disabled]="isStreaming()"
            title="Attach image"
            aria-label="Attach image">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>

          <!-- Hidden File Input -->
          <input
            #fileInput
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            (change)="onFilesSelected($event)"
            style="display: none" />

          <textarea
            #textareaEl
            class="chat-textarea"
            [placeholder]="isStreaming() ? 'Generating response...' : 'Message OmniRoute... (Enter to send, Shift+Enter for new line)'"
            [(ngModel)]="inputText"
            [disabled]="isStreaming()"
            (keydown)="onKeyDown($event)"
            (input)="autoResize()"
            rows="1"
            aria-label="Chat message input"></textarea>

          @if (isStreaming()) {
            <button class="send-btn send-btn--stop" (click)="stopGeneration.emit()" title="Stop generation" aria-label="Stop generation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            </button>
          } @else {
            <button
              class="send-btn"
              [class.send-btn--active]="canSend()"
              [disabled]="!canSend()"
              (click)="onSend()"
              aria-label="Send message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          }
        </div>

        <p class="input-hint">
          <span>Powered by</span>
          <strong>OmniRoute</strong>
          <span>·</span>
          <span>236+ providers · auto-fallback · 95% token savings</span>
        </p>
      </div>
    </div>
  `,
  styleUrl: './chat-input.component.css',
})
export class ChatInputComponent {
  @ViewChild('textareaEl') textareaEl!: ElementRef<HTMLTextAreaElement>;

  isStreaming = input<boolean>(false);
  send = output<{ content: string; strategy: RoutingStrategy; images?: ImageAttachment[] }>();
  stopGeneration = output<void>();
  strategyChange = output<RoutingStrategy>();

  inputText = '';
  selectedStrategy = signal<RoutingStrategy>('auto');
  attachedImages = signal<ImageAttachment[]>([]);
  strategies = ROUTING_STRATEGIES;

  canSend = computed(() => {
    const hasText = this.inputText.trim().length > 0;
    const hasImages = this.attachedImages().length > 0;
    return (hasText || hasImages) && !this.isStreaming();
  });

  selectStrategy(value: RoutingStrategy): void {
    this.selectedStrategy.set(value);
    this.strategyChange.emit(value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onSend(): void {
    const text = this.inputText.trim();
    const images = this.attachedImages();
    if ((!text && images.length === 0) || this.isStreaming()) return;

    this.send.emit({
      content: text || '(Image attached)',
      strategy: this.selectedStrategy(),
      images: images.length > 0 ? [...images] : undefined,
    });

    this.inputText = '';
    this.attachedImages.set([]);
    setTimeout(() => this.resetHeight(), 0);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 20 * 1024 * 1024) {
        alert(`Image "${file.name}" is too large. Maximum size is 20MB.`);
        continue;
      }
      this.readFileAsBase64(file);
    }

    // Reset input so same file can be selected again
    input.value = '';
  }

  removeImage(id: string): void {
    this.attachedImages.update(imgs => imgs.filter(i => i.id !== id));
  }

  autoResize(): void {
    const el = this.textareaEl?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }

  private resetHeight(): void {
    const el = this.textareaEl?.nativeElement;
    if (el) el.style.height = 'auto';
  }

  private readFileAsBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const attachment: ImageAttachment = {
        id: generateUUID(),
        base64,
        mimeType: file.type,
        name: file.name,
        sizeBytes: file.size,
      };
      this.attachedImages.update(imgs => [...imgs, attachment]);
    };
    reader.readAsDataURL(file);
  }
}
