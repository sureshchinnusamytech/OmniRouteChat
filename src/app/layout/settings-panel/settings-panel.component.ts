import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { SYSTEM_PROMPT_PRESETS } from '../../core/constants/system-prompts';
import { ROUTING_STRATEGIES } from '../../core/constants/routing-strategies';
import { AppSettings } from '../../core/models/settings.model';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="settings-overlay" [class.visible]="isOpen()" (click)="close.emit()"></div>
    <aside class="settings-panel" [class.settings-panel--open]="isOpen()">

      <div class="settings-panel__header">
        <h2 class="settings-panel__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </h2>
        <button class="settings-close-btn" (click)="close.emit()" aria-label="Close settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="settings-panel__body">

        <!-- API Configuration -->
        <section class="settings-section">
          <h3 class="settings-section__title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            API Configuration
          </h3>

          <div class="form-group">
            <label class="form-label">Base URL</label>
            <input class="form-input" type="text" [(ngModel)]="localSettings.apiBaseUrl" placeholder="http://localhost:20128/v1" />
            <span class="form-hint">OmniRoute server endpoint (default: localhost:20128)</span>
          </div>

          <div class="form-group">
            <label class="form-label">API Key</label>
            <div class="input-with-toggle">
              <input
                class="form-input"
                [type]="showApiKey() ? 'text' : 'password'"
                [(ngModel)]="localSettings.apiKey"
                placeholder="omniroute-local-key" />
              <button class="input-toggle-btn" (click)="toggleApiKeyVisibility()" type="button">
                @if (showApiKey()) {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                } @else {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
        </section>

        <!-- Model Parameters -->
        <section class="settings-section">
          <h3 class="settings-section__title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Model Parameters
          </h3>

          <div class="form-group">
            <label class="form-label">Default Strategy</label>
            <select class="form-select" [(ngModel)]="localSettings.defaultModel">
              @for (s of strategies; track s.value) {
                <option [value]="s.value">{{ s.icon }} {{ s.label }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">
              Temperature
              <span class="param-value">{{ localSettings.temperature }}</span>
            </label>
            <input class="form-range" type="range" min="0" max="2" step="0.1" [(ngModel)]="localSettings.temperature" />
            <div class="range-labels"><span>Precise</span><span>Creative</span></div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Max Tokens
              <span class="param-value">{{ localSettings.maxTokens }}</span>
            </label>
            <input class="form-range" type="range" min="256" max="32768" step="256" [(ngModel)]="localSettings.maxTokens" />
            <div class="range-labels"><span>256</span><span>32768</span></div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Top P
              <span class="param-value">{{ localSettings.topP }}</span>
            </label>
            <input class="form-range" type="range" min="0" max="1" step="0.05" [(ngModel)]="localSettings.topP" />
            <div class="range-labels"><span>0</span><span>1</span></div>
          </div>
        </section>

        <!-- System Prompt -->
        <section class="settings-section">
          <h3 class="settings-section__title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            System Prompt
          </h3>

          <div class="form-group">
            <label class="form-label">Preset Template</label>
            <select class="form-select" [(ngModel)]="selectedPreset" (ngModelChange)="onPresetChange($event)">
              @for (p of presets; track p.name) {
                <option [value]="p.name">{{ p.name }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Custom Prompt</label>
            <textarea
              class="form-textarea"
              [(ngModel)]="localSettings.systemPrompt"
              placeholder="Enter system instructions..."
              rows="5"></textarea>
          </div>
        </section>

        <!-- Appearance -->
        <section class="settings-section">
          <h3 class="settings-section__title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            Appearance
          </h3>
          <div class="theme-toggle-row">
            <span class="form-label" style="margin-bottom:0">Theme</span>
            <div class="theme-switcher">
              <button class="theme-btn" [class.theme-btn--active]="themeService.isDarkMode()" (click)="setDark(true)">🌙 Dark</button>
              <button class="theme-btn" [class.theme-btn--active]="!themeService.isDarkMode()" (click)="setDark(false)">☀️ Light</button>
            </div>
          </div>
        </section>

      </div>

      <!-- Footer Actions -->
      <div class="settings-panel__footer">
        <button class="btn-reset" (click)="onReset()">Reset Defaults</button>
        <button class="btn-save" (click)="onSave()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Save Settings
        </button>
      </div>

    </aside>
  `,
  styleUrl: './settings-panel.component.css',
})
export class SettingsPanelComponent {
  settingsService = inject(SettingsService);
  themeService = inject(ThemeService);

  isOpen = input<boolean>(false);
  close = output<void>();

  presets = SYSTEM_PROMPT_PRESETS;
  strategies = ROUTING_STRATEGIES;

  showApiKey = signal(false);
  selectedPreset = 'Coding Assistant';
  localSettings: AppSettings = { ...this.settingsService.settings() };

  toggleApiKeyVisibility(): void {
    this.showApiKey.update((v) => !v);
  }

  setDark(isDark: boolean): void {
    this.themeService.setDarkMode(isDark);
  }

  onPresetChange(presetName: string): void {
    const preset = this.presets.find((p) => p.name === presetName);
    if (preset && preset.prompt) {
      this.localSettings = { ...this.localSettings, systemPrompt: preset.prompt };
    }
  }

  onSave(): void {
    this.settingsService.updateSettings(this.localSettings);
    this.close.emit();
  }

  onReset(): void {
    this.settingsService.resetToDefaults();
    this.localSettings = { ...this.settingsService.settings() };
  }
}
