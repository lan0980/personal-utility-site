import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
if (!crypto.randomUUID) {
  Object.defineProperty(crypto, 'randomUUID', {
    value: () => 'mock-uuid-' + Math.random().toString(36).substring(2, 11),
  });
}

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

// Mock window.dispatchEvent and CustomEvent for sync events
class MockCustomEvent extends Event {
  detail: Record<string, unknown>;
  constructor(type: string, options?: CustomEventInit) {
    super(type, options);
    this.detail = (options?.detail as Record<string, unknown>) ?? {};
  }
}
Object.defineProperty(window, 'CustomEvent', { value: MockCustomEvent });
