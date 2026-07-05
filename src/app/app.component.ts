import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { ChatService } from './core/services/chat.service';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { SettingsPanelComponent } from './layout/settings-panel/settings-panel.component';
import { HeaderComponent } from './layout/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, SettingsPanelComponent, HeaderComponent],
  template: `
    <div class="app-shell" [attr.data-theme]="theme()">
      <app-header
        [isSidebarOpen]="isSidebarOpen()"
        (toggleSidebar)="toggleSidebar()"
        (openSettings)="openSettings()" />

      <div class="app-body">
        <div class="sidebar-overlay" [class.visible]="isSidebarOpen() && isMobile()" (click)="closeSidebar()"></div>

        <app-sidebar
          [isOpen]="isSidebarOpen()"
          (newChat)="onNewChat()"
          (selectConversation)="onSelectConversation($event)"
          (closeSidebar)="closeSidebar()"
          (openSettings)="openSettings()" />

        <main class="main-content">
          <router-outlet />
        </main>

        <app-settings-panel
          [isOpen]="isSettingsOpen()"
          (close)="closeSettings()" />
      </div>
    </div>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent {
  themeService = inject(ThemeService);
  chatService = inject(ChatService);
  private router = inject(Router);

  theme = computed(() => this.themeService.theme());
  isSidebarOpen = signal(true);
  isSettingsOpen = signal(false);
  isMobile = signal(window.innerWidth < 768);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
      if (window.innerWidth >= 768) this.isSidebarOpen.set(true);
    });
    if (window.innerWidth < 768) this.isSidebarOpen.set(false);
  }

  toggleSidebar(): void { this.isSidebarOpen.update(v => !v); }
  closeSidebar(): void { if (this.isMobile()) this.isSidebarOpen.set(false); }
  openSettings(): void { this.isSettingsOpen.set(true); }
  closeSettings(): void { this.isSettingsOpen.set(false); }

  onNewChat(): void {
    this.chatService.startNewConversation();
    this.closeSidebar();
  }

  onSelectConversation(id: string): void {
    this.chatService.loadConversation(id);
    this.router.navigate(['/chat', id]);
    this.closeSidebar();
  }
}
