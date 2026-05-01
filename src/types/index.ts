// src/types/index.ts

export interface QuestionCard {
  id: string;
  deckId: string;
  textEn: string;
  intensity: 'mild' | 'spicy' | 'wild';
  soberText?: string;
  sortOrder: number;
}

export interface SessionConfig {
  players: string[];
  deckId: string;
  intensity: string;
  soberMode: boolean;
  penaltyLabel: string;
  cardsPerRound: number;
  timer: number;
  skipEnabled: boolean;
  randomOrder: boolean;
}

export interface Player {
  name: string;
  color: string; // assigned from palette
}

export interface SessionState {
  questionQueue: QuestionCard[];
  cardHistory: QuestionCard[];
  currentPlayerIndex: number;
  drinkCounters: Record<string, number>;
  skipUsed: Record<string, boolean>;
  isComplete: boolean;
  turnCount: number;
}