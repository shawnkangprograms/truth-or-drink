// src/config/limits.ts

export const FREE_LIMITS = {
  maxDecks: 4,
  maxCardsPerDeck: 12,
  allowedIntensities: ['mild'],
  maxCategories: 1,
  canGenerateQR: false,
  hasAds: true,
  hasUpgradePrompt: true,
};

export const PRO_LIMITS = {
  maxDecks: Infinity,
  maxCardsPerDeck: Infinity,
  allowedIntensities: ['mild', 'spicy', 'wild'],
  maxCategories: Infinity,
  canGenerateQR: true,
  hasAds: false,
  hasUpgradePrompt: false,
};