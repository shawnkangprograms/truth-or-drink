// src/context/SessionContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SessionState, SessionConfig, QuestionCard } from '../types';
import { fisherYatesShuffle } from '../utils/shuffle';

// ── Types ─────────────────────────────────────────────────────────────────────

/** One entry in the card history stack — enough to fully reverse any turn. */
export interface HistoryEntry {
  card: QuestionCard;
  cardIndex: number;       // position in the original question array
  shotsBefore: number;     // player's totalShots BEFORE this turn
  playerIndex: number;     // who played this turn
  wasDisqualified: boolean;// did this turn cause a disqualification?
}

export type SessionAction =
  | { type: 'INIT_SESSION'; config: SessionConfig }
  | { type: 'RECORD_DRINK'; playerIndex: number; shots: number; maxShots: number; nextPlayerIndex: number; card: QuestionCard; cardIndex: number }
  | { type: 'RECORD_NEXT';  playerIndex: number; nextPlayerIndex: number; card: QuestionCard; cardIndex: number }
  | { type: 'UNDO_LAST' }
  | { type: 'RESET' };

// ── Initial state ─────────────────────────────────────────────────────────────

const EMPTY_STATE: SessionState = {
  questionQueue: [],
  cardHistory: [],
  currentPlayerIndex: 0,
  drinkCounters: {},
  skipUsed: {},
  isComplete: false,
  turnCount: 0,
};

// ── Reducer ───────────────────────────────────────────────────────────────────

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {

    case 'INIT_SESSION': {
      const { players, questions, randomOrder, cardsPerRound } = action.config;
      const ordered = randomOrder ? fisherYatesShuffle(questions) : [...questions];
      const queue   = ordered.slice(0, cardsPerRound);

      const drinkCounters: Record<string, number> = {};
      players.forEach(p => { drinkCounters[p] = 0; });

      return {
        ...EMPTY_STATE,
        questionQueue: queue,
        drinkCounters,
      };
    }

    case 'RECORD_DRINK': {
      const { playerIndex, shots, maxShots, nextPlayerIndex, card, cardIndex } = action;
      const players    = Object.keys(state.drinkCounters);
      const playerName = players[playerIndex];
      const newTotal   = (state.drinkCounters[playerName] ?? 0) + shots;
      const dq         = newTotal >= maxShots;

      const entry: HistoryEntry = {
        card,
        cardIndex,
        shotsBefore: state.drinkCounters[playerName] ?? 0,
        playerIndex,
        wasDisqualified: dq,
      };

      return {
        ...state,
        drinkCounters: { ...state.drinkCounters, [playerName]: newTotal },
        cardHistory: [...(state.cardHistory as HistoryEntry[]), entry],
        currentPlayerIndex: nextPlayerIndex,
        turnCount: state.turnCount + 1,
      };
    }

    case 'RECORD_NEXT': {
      const { playerIndex, nextPlayerIndex, card, cardIndex } = action;
      const players    = Object.keys(state.drinkCounters);
      const playerName = players[playerIndex];

      const entry: HistoryEntry = {
        card,
        cardIndex,
        shotsBefore: state.drinkCounters[playerName] ?? 0,
        playerIndex,
        wasDisqualified: false,
      };

      return {
        ...state,
        cardHistory: [...(state.cardHistory as HistoryEntry[]), entry],
        currentPlayerIndex: nextPlayerIndex,
        turnCount: state.turnCount + 1,
      };
    }

    case 'UNDO_LAST': {
      const history = state.cardHistory as HistoryEntry[];
      if (history.length === 0) return state;

      const last       = history[history.length - 1];
      const players    = Object.keys(state.drinkCounters);
      const playerName = players[last.playerIndex];

      // Restore drink counter to what it was before this turn
      const restoredCounters = {
        ...state.drinkCounters,
        [playerName]: last.shotsBefore,
      };

      return {
        ...state,
        drinkCounters: restoredCounters,
        cardHistory: history.slice(0, -1),
        currentPlayerIndex: last.playerIndex,
        turnCount: Math.max(0, state.turnCount - 1),
        isComplete: false,
      };
    }

    case 'RESET':
      return EMPTY_STATE;

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const SessionContext = createContext<{
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
} | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, EMPTY_STATE);
  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}