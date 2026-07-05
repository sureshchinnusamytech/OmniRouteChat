import { Component, inject, input, output, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConversationService } from '../../core/services/conversation.service';
import { ChatService } from '../../core/services/chat.service';
import { ThemeService } from '../../core/services/theme.service';
import { Conversation } from '../../core/models/conversation.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <aside class="sidebar" [class.sidebar--open]="isOpen()">
      <!-- Brand -->
      <div class="sidebar__brand">
        <div class="brand-logo">
          <span class="brand-logo__diamond">◆</span>
          <span class="brand-logo__name">OmniRouteChat</span>
        </div>
        <button class="sidebar__close-btn" (click)="closeSidebar.emit()" aria-label="Close sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- New Chat Button -->
      <button class="new-chat-btn" (click)="onNewChat()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Chat
      </button>

      <!-- Search -->
      <div class="sidebar__search">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          class="search-input"
          type="text"
          placeholder="Search conversations..."
          [(ngModel)]="searchQuery"
          aria-label="Search conversations" />
      </div>

      <!-- Conversations List -->
      <div class="sidebar__conversations">
        @if (filteredConversations().length === 0) {
          <div class="conversations-empty">
            @if (searchQuery) {
              <span>No results for "{{ searchQuery }}"</span>
            } @else {
              <span>No conversations yet</span>
            }
          </div>
        }

        @for (conv of filteredConversations(); track conv.id) {
          <div
            class="conv-item"
            [class.conv-item--active]="isActive(conv.id)"
            (click)="onSelect(conv)">

            @if (editingId() === conv.id) {
              <!-- Inline rename input -->
              <input
                class="conv-item__rename-input"
                [value]="conv.title"
                #renameInput
                (keydown.enter)="saveRename(conv.id, renameInput.value)"
                (keydown.escape)="editingId.set(null)"
                (blur)="saveRename(conv.id, renameInput.value)"
                (click)="$event.stopPropagation()"
                autofocus />
            } @else {
              <div class="conv-item__icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span class="conv-item__title">{{ conv.title }}</span>
              <div class="conv-item__actions">
                <button class="conv-action-btn" title="Rename" (click)="startEdit(conv.id, $event)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="conv-action-btn conv-action-btn--danger" title="Delete" (click)="onDelete(conv.id, $event)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6"/></svg>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Bottom Bar -->
      <div class="sidebar__bottom">
        <button class="sidebar-bottom-btn" (click)="openSettings.emit()" title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </button>
        <button class="theme-toggle-btn" (click)="themeService.toggleTheme()" [title]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'">
          @if (themeService.isDarkMode()) {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          } @else {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  conversationService = inject(ConversationService);
  chatService = inject(ChatService);
  themeService = inject(ThemeService);
  router = inject(Router);

  isOpen = input<boolean>(true);
  newChat = output<void>();
  selectConversation = output<string>();
  closeSidebar = output<void>();
  openSettings = output<void>();

  searchQuery = '';
  editingId = signal<string | null>(null);

  filteredConversations = computed(() => {
    const q = this.searchQuery.toLowerCase();
    const convs = this.conversationService.conversations();
    return q ? convs.filter(c => c.title.toLowerCase().includes(q)) : convs;
  });

  isActive(id: string): boolean {
    return this.chatService.activeConversationId() === id;
  }

  onNewChat(): void {
    this.newChat.emit();
  }

  onSelect(conv: Conversation): void {
    this.selectConversation.emit(conv.id);
    this.chatService.loadConversation(conv.id);
    this.router.navigate(['/chat', conv.id]);
  }

  startEdit(id: string, event: Event): void {
    event.stopPropagation();
    this.editingId.set(id);
  }

  saveRename(id: string, newTitle: string): void {
    const trimmed = newTitle.trim();
    if (trimmed) this.conversationService.renameConversation(id, trimmed);
    this.editingId.set(null);
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.conversationService.deleteConversation(id);
    if (this.chatService.activeConversationId() === id) {
      this.chatService.clearActive();
      this.router.navigate(['/']);
    }
  }
}
