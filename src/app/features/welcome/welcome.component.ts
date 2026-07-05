import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';

interface QuickStart {
  icon: string;
  label: string;
  prompt: string;
  strategy: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  template: `
    <div class="welcome">
      <div class="welcome__hero">
        <div class="welcome__logo">
          <span class="welcome__diamond">◆</span>
        </div>
        <h1 class="welcome__title">OmniRouteChat</h1>
        <p class="welcome__subtitle">Connect to <strong>236+ AI providers</strong> through a single endpoint.<br>Smart routing, auto-fallback, and token compression built-in.</p>

        <div class="welcome__stats">
          <div class="stat-badge">
            <span class="stat-badge__num">236</span>
            <span class="stat-badge__label">providers</span>
          </div>
          <div class="stat-badge">
            <span class="stat-badge__num">90+</span>
            <span class="stat-badge__label">free tiers</span>
          </div>
          <div class="stat-badge">
            <span class="stat-badge__num">17</span>
            <span class="stat-badge__label">strategies</span>
          </div>
          <div class="stat-badge">
            <span class="stat-badge__num">95%</span>
            <span class="stat-badge__label">token savings</span>
          </div>
        </div>
      </div>

      <div class="welcome__quickstart">
        <p class="welcome__section-label">Quick start</p>
        <div class="quickstart-grid">
          @for (item of quickStarts; track item.label) {
            <button class="quickstart-card" (click)="startWith(item)">
              <span class="quickstart-card__icon">{{ item.icon }}</span>
              <span class="quickstart-card__label">{{ item.label }}</span>
              <span class="quickstart-card__prompt">{{ item.prompt }}</span>
            </button>
          }
        </div>
      </div>

      <p class="welcome__hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Type a message below or click a card to start a new conversation
      </p>
    </div>
  `,
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent {
  chatService = inject(ChatService);
  router = inject(Router);

  quickStarts: QuickStart[] = [
    { icon: '💻', label: 'Code Help', prompt: 'Write a TypeScript function that...', strategy: 'auto/coding' },
    { icon: '💬', label: 'General Chat', prompt: 'Explain how OmniRoute works and its benefits', strategy: 'auto' },
    { icon: '⚡', label: 'Quick Answer', prompt: 'What are the top 5 AI providers by capability?', strategy: 'auto/fast' },
    { icon: '📊', label: 'Data Analysis', prompt: 'Help me analyze and visualize data patterns', strategy: 'auto' },
    { icon: '✍️', label: 'Creative Writing', prompt: 'Write a short story about...', strategy: 'auto' },
    { icon: '🔍', label: 'Research', prompt: 'Compare different LLM architectures and their strengths', strategy: 'auto' },
  ];

  startWith(item: QuickStart): void {
    const id = this.chatService.startNewConversation();
    this.router.navigate(['/chat', id]).then(() => {
      this.chatService.sendMessage(item.prompt, item.strategy as any);
    });
  }
}
