import { Injectable, signal, computed } from '@angular/core';
import { AppSettings } from '../models/settings.model';
import { ModelParams } from '../models/api.model';
import { SYSTEM_PROMPT_PRESETS } from '../constants/system-prompts';
import { LocalStorageUtil } from '../../shared/utils/local-storage.util';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private static readonly STORAGE_KEY = 'omniroute_settings';
  private static readonly DEFAULTS: AppSettings = {
    apiBaseUrl: 'http://localhost:20128/v1',
    apiKey: 'omniroute-local-key',
    defaultModel: 'auto',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1.0,
    isDarkMode: true,
    systemPrompt: SYSTEM_PROMPT_PRESETS[0].prompt,
  };

  settings = signal<AppSettings>(this.loadSettings());
  apiBaseUrl = computed(() => this.settings().apiBaseUrl);
  apiKey = computed(() => this.settings().apiKey);

  updateSettings(partial: Partial<AppSettings>): void {
    this.settings.update((current) => ({ ...current, ...partial }));
    LocalStorageUtil.set(SettingsService.STORAGE_KEY, this.settings());
  }

  resetToDefaults(): void {
    this.settings.set({ ...SettingsService.DEFAULTS });
    LocalStorageUtil.set(SettingsService.STORAGE_KEY, this.settings());
  }

  getModelParams(): ModelParams {
    const s = this.settings();
    return { temperature: s.temperature, maxTokens: s.maxTokens, topP: s.topP };
  }

  private loadSettings(): AppSettings {
    try {
      const stored = LocalStorageUtil.get<AppSettings>(SettingsService.STORAGE_KEY);
      return stored ? { ...SettingsService.DEFAULTS, ...stored } : { ...SettingsService.DEFAULTS };
    } catch {
      return { ...SettingsService.DEFAULTS };
    }
  }
}
