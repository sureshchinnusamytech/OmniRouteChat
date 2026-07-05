import { Injectable, signal, computed, effect } from '@angular/core';
import { LocalStorageUtil } from '../../shared/utils/local-storage.util';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'omniroute_theme';

  isDarkMode = signal<boolean>(this.loadTheme());
  theme = computed(() => (this.isDarkMode() ? 'dark' : 'light'));

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update((dark) => !dark);
    LocalStorageUtil.set(ThemeService.STORAGE_KEY, this.isDarkMode());
  }

  setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    LocalStorageUtil.set(ThemeService.STORAGE_KEY, isDark);
  }

  private loadTheme(): boolean {
    const stored = LocalStorageUtil.get<boolean>(ThemeService.STORAGE_KEY);
    if (stored !== null) return stored;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  }
}
