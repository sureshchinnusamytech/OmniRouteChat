import { Component, inject, signal, computed, AfterViewChecked, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { RoutingStrategy } from '../../core/models/conversation.model';
import { MessageBubbleComponent } from './components/message-bubble/message-bubble.component';
import { ChatInputComponent } from './components/chat-input/chat-input.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [MessageBubbleComponent, ChatInputComponent],
  template: `
    <div class="chat-view">

      <!-- Messages area -->
      <div class="chat-messages" #messagesContainer (scroll)="onScroll()">
        <div class="chat-messages__inner">
          @for (msg of messages(); track msg.id; let last = $last) {
            <app-message-bubble
              [message]="msg"
              [isStreaming]="last && isStreaming() && msg.role === 'assistant'"
              (regenerate)="chatService.regenerateResponse($event)"
              (edit)="onEdit($event)"
              (delete)="chatService.deleteMessage($event)" />
          }

          @if (isStreaming() && messages().length === 0) {
            <div class="streaming-placeholder">
              <div class="streaming-dot"></div>
              <div class="streaming-dot"></div>
              <div class="streaming-dot"></div>
            </div>
          }

          <!-- Error banner -->
          @if (errorMessage()) {
            <div class="error-banner" (click)="chatService.errorMessage.set(null)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{{ errorMessage() }}</span>
              <button class="error-banner__dismiss" aria-label="Dismiss error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          }

          <!-- Scroll anchor -->
          <div #scrollAnchor></div>
        </div>
      </div>

      <!-- Scroll to bottom button -->
      @if (showScrollBtn()) {
        <button class="scroll-to-bottom" (click)="scrollToBottom(true)" aria-label="Scroll to bottom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        </button>
      }

      <!-- Chat Input -->
      <app-chat-input
        [isStreaming]="isStreaming()"
        (send)="onSend($event)"
        (stopGeneration)="chatService.stopGeneration()" />

    </div>
  `,
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLDivElement>;

  chatService = inject(ChatService);
  route = inject(ActivatedRoute);

  messages = computed(() => this.chatService.activeMessages());
  isStreaming = computed(() => this.chatService.isStreaming());
  errorMessage = computed(() => this.chatService.errorMessage());

  showScrollBtn = signal(false);
  private shouldAutoScroll = true;
  private prevMessageCount = 0;
  private routeSub: any;

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('conversationId');
      if (id && id !== this.chatService.activeConversationId()) {
        this.chatService.loadConversation(id);
      }
    });
  }

  ngAfterViewChecked(): void {
    const currentCount = this.messages().length;
    if (currentCount !== this.prevMessageCount || this.isStreaming()) {
      this.prevMessageCount = currentCount;
      if (this.shouldAutoScroll) {
        this.scrollToBottom();
      }
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  onSend(event: { content: string; strategy: RoutingStrategy; images?: any[] }): void {
    this.shouldAutoScroll = true;
    this.chatService.sendMessage(event.content, event.strategy, event.images);
  }

  onEdit(event: { id: string; content: string }): void {
    this.chatService.editAndResend(event.id, event.content);
  }

  onScroll(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.shouldAutoScroll = distanceFromBottom < 80;
    this.showScrollBtn.set(distanceFromBottom > 200);
  }

  scrollToBottom(force = false): void {
    try {
      if (force) this.shouldAutoScroll = true;
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: force ? 'smooth' : 'instant' });
    } catch {}
  }
}
