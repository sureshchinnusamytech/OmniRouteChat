export class LocalStorageUtil {
  static get<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      console.warn(`LocalStorage: Failed to read key "${key}"`, error);
      return null;
    }
  }

  static set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('LocalStorage: Storage quota exceeded.');
      } else {
        console.warn(`LocalStorage: Failed to write key "${key}"`, error);
      }
      return false;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`LocalStorage: Failed to remove key "${key}"`, error);
    }
  }

  static isAvailable(): boolean {
    try {
      const test = '__omniroute_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
