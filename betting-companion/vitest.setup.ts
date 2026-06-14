import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

// jsdom lacks parts of Web Crypto (randomUUID, subtle for SHA-256 hashing);
// use Node's implementation when anything is missing
if (
  typeof crypto === 'undefined' ||
  !crypto.randomUUID ||
  !globalThis.crypto?.subtle
) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

// Mock localStorage for Zustand persist
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: function (key: string) {
    return this.store[key] || null;
  },
  setItem: function (key: string, value: string) {
    this.store[key] = value;
  },
  removeItem: function (key: string) {
    delete this.store[key];
  },
  clear: function () {
    this.store = {};
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});
