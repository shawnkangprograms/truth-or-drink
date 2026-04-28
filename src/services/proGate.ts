// src/services/proGate.ts
import { storage } from './storage';

const PRO_STATUS_KEY = 'bambika_pro_status';

export function getCachedProStatus(): boolean {
  return storage.getBoolean(PRO_STATUS_KEY) ?? false;
}

export function setCachedProStatus(isPro: boolean): void {
  storage.set(PRO_STATUS_KEY, isPro);
}

export function isPro(): boolean {
  return getCachedProStatus();
}