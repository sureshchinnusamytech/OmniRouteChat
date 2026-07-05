import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OmniRouteApiService } from './omniroute-api.service';
import { ConversationService } from './conversation.service';
import { SettingsService } from './settings.service';
import { Message, RoutingStrategy, ImageAttachment } from '../models/conversation.model';
import { ChatMessage, ChatMessageContentPart, StreamEvent } from '../models/api.model';
import { generateUUID } from '../../shared/utils/uuid.util';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = inject(OmniRouteApiService);
  private conversationService = inject(ConversationService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  activeConversationId = signal<string | null>(null);
  activeMessages = signal<Message[]>([]);
  isStreaming = signal(false);
  errorMessage = signal<string | null>(null);

  activeConversation = computed(() => {
    const id = this.activeConversationId();
    return id ? this.conversationService.getConversation(id) : null;
  });

  private currentSubscription: Subscription | null = null;
  private titleSet = false;

  loadConversation(conversationId: string): void {
    const conv = this.conversationService.getConversation(conversationId);
    if (conv) {
      this.activeConversationId.set(conversationId);
      this.activeMessages.set([...conv.messages]);
      this.errorMessage.set(null);
      this.titleSet = conv.messages.length > 0;
    }
  }

  startNewConversation(): string {
    const settings = this.settingsService.settings();
    const conv = this.conversationService.createConversation(settings.defaultModel, settings.systemPrompt);
    this.activeConversationId.set(conv.id);
    this.activeMessages.set([]);
    this.errorMessage.set(null);
    this.titleSet = false;
    this.router.navigate(['/chat', conv.id]);
    return conv.id;
  }

  sendMessage(content: string, strategy?: RoutingStrategy, images?: ImageAttachment[]): void {
    if (this.isStreaming() || !content.trim()) return;

    let convId = this.activeConversationId();
    if (!convId) {
      convId = this.startNewConversation();
    }

    const settings = this.settingsService.settings();
    const model = strategy || settings.defaultModel;

    // Add user message (with optional images)
    const userMsg: Message = {
      id: generateUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      images: images && images.length > 0 ? images : undefined,
    };
    this.activeMessages.update((msgs) => [...msgs, userMsg]);

    // Auto-title from first message
    if (!this.titleSet) {
      const title = content.trim().substring(0, 50) + (content.length > 50 ? '...' : '');
      this.conversationService.renameConversation(convId!, title);
      this.titleSet = true;
    }

    // Add streaming placeholder
    const assistantMsg: Message = { id: generateUUID(), role: 'assistant', content: '', timestamp: Date.now() };
    this.activeMessages.update((msgs) => [...msgs, assistantMsg]);

    const apiMessages = this.buildApiMessages();
    this.isStreaming.set(true);
    this.errorMessage.set(null);

    this.currentSubscription = this.api
      .streamChatCompletion(apiMessages, model, settings)
      .subscribe({
        next: (event: StreamEvent) => {
          if (event.type === 'token') {
            this.activeMessages.update((msgs) => {
              const updated = [...msgs];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, content: last.content + event.content };
              return updated;
            });
          } else if (event.type === 'usage') {
            this.activeMessages.update((msgs) => {
              const updated = [...msgs];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                metadata: { ...last.metadata, promptTokens: event.promptTokens, completionTokens: event.completionTokens, totalTokens: event.totalTokens, model: event.model },
              };
              return updated;
            });
          } else if (event.type === 'done') {
            this.activeMessages.update((msgs) => {
              const updated = [...msgs];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, metadata: { ...last.metadata, latencyMs: event.latencyMs } };
              return updated;
            });
          }
        },
        error: (err: any) => {
          this.isStreaming.set(false);
          this.errorMessage.set(`Connection error: ${err?.body || err?.message || 'Check if OmniRoute is running on ' + settings.apiBaseUrl}`);
          // Remove empty assistant placeholder
          this.activeMessages.update((msgs) => {
            const last = msgs[msgs.length - 1];
            return last?.role === 'assistant' && !last.content ? msgs.slice(0, -1) : msgs;
          });
        },
        complete: () => {
          this.isStreaming.set(false);
          this.saveActive();
        },
      });
  }

  regenerateResponse(messageId: string): void {
    const msgs = this.activeMessages();
    const idx = msgs.findIndex((m) => m.id === messageId);
    if (idx === -1 || msgs[idx].role !== 'assistant') return;
    let userIdx = idx - 1;
    while (userIdx >= 0 && msgs[userIdx].role !== 'user') userIdx--;
    if (userIdx < 0) return;
    const userMsg = msgs[userIdx];
    this.activeMessages.set(msgs.slice(0, userIdx));
    this.sendMessage(userMsg.content, undefined, userMsg.images);
  }

  editAndResend(messageId: string, newContent: string): void {
    const msgs = this.activeMessages();
    const idx = msgs.findIndex((m) => m.id === messageId);
    if (idx === -1 || msgs[idx].role !== 'user') return;
    this.activeMessages.set(msgs.slice(0, idx));
    this.sendMessage(newContent);
  }

  deleteMessage(messageId: string): void {
    this.activeMessages.update((msgs) => msgs.filter((m) => m.id !== messageId));
    this.saveActive();
  }

  stopGeneration(): void {
    this.api.stopGeneration();
    this.currentSubscription?.unsubscribe();
    this.currentSubscription = null;
    this.isStreaming.set(false);
    this.saveActive();
  }

  clearActive(): void {
    this.activeConversationId.set(null);
    this.activeMessages.set([]);
    this.errorMessage.set(null);
    this.titleSet = false;
  }

  /**
   * Build API messages with multimodal content support.
   * If a user message has images, content becomes an array of parts
   * following the OpenAI vision API format.
   */
  private buildApiMessages(): ChatMessage[] {
    const settings = this.settingsService.settings();
    const msgs = this.activeMessages();
    const result: ChatMessage[] = [];

    if (settings.systemPrompt) {
      result.push({ role: 'system', content: settings.systemPrompt });
    }

    for (const m of msgs) {
      if (m.role === 'assistant' && !m.content) continue;
      if (m.role === 'system') continue;

      // If user message has images, build multimodal content
      if (m.role === 'user' && m.images && m.images.length > 0) {
        const parts: ChatMessageContentPart[] = [];

        // Add text part
        if (m.content) {
          parts.push({ type: 'text', text: m.content });
        }

        // Add image parts
        for (const img of m.images) {
          parts.push({
            type: 'image_url',
            image_url: { url: img.base64, detail: 'auto' },
          });
        }

        result.push({ role: 'user', content: parts });
      } else {
        // Plain text message
        result.push({ role: m.role as 'user' | 'assistant', content: m.content });
      }
    }

    return result;
  }

  private saveActive(): void {
    const id = this.activeConversationId();
    if (id) this.conversationService.updateMessages(id, this.activeMessages());
  }
}
