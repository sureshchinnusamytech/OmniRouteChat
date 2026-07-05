import { Injectable, signal } from '@angular/core';
import { Conversation, Message, RoutingStrategy } from '../models/conversation.model';
import { LocalStorageUtil } from '../../shared/utils/local-storage.util';
import { generateUUID } from '../../shared/utils/uuid.util';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private static readonly STORAGE_KEY = 'omniroute_conversations';
  private static readonly MAX_CONVERSATIONS = 100;

  conversations = signal<Conversation[]>(this.loadFromStorage());

  createConversation(routingStrategy: RoutingStrategy = 'auto', systemPrompt = ''): Conversation {
    const conversation: Conversation = {
      id: generateUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      routingStrategy,
      systemPrompt,
    };
    this.conversations.update((convs) => [conversation, ...convs]);
    this.persist();
    return conversation;
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations().find((c) => c.id === id);
  }

  renameConversation(id: string, newTitle: string): void {
    this.conversations.update((convs) =>
      convs.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
    this.persist();
  }

  updateMessages(id: string, messages: Message[]): void {
    this.conversations.update((convs) =>
      convs.map((c) => (c.id === id ? { ...c, messages: [...messages], updatedAt: Date.now() } : c))
    );
    this.persist();
  }

  deleteConversation(id: string): void {
    this.conversations.update((convs) => convs.filter((c) => c.id !== id));
    this.persist();
  }

  clearAll(): void {
    this.conversations.set([]);
    this.persist();
  }

  private loadFromStorage(): Conversation[] {
    return LocalStorageUtil.get<Conversation[]>(ConversationService.STORAGE_KEY) || [];
  }

  private persist(): void {
    const sorted = [...this.conversations()].sort((a, b) => b.updatedAt - a.updatedAt);
    const trimmed = sorted.slice(0, ConversationService.MAX_CONVERSATIONS);
    if (trimmed.length !== this.conversations().length) this.conversations.set(trimmed);
    LocalStorageUtil.set(ConversationService.STORAGE_KEY, trimmed);
  }
}
