import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Easing, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../utils/tokens';
import { getQuestionsForDeck } from '../services/contentCache';
import { QuestionCard } from '../types';
import { useSession } from '../context/SessionContext';

// ── Sounds ────────────────────────────────────────────────────────────────────
async function playSound(_name: 'card' | 'button' | 'timer' | 'disqualify' | 'finish' | 'undo') {
  // expo-audio requires a dev build — silently skip in Expo Go
  return;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DECK_ID_MAP: Record<string, string> = {
  'Friends': 'friends', 'Couples': 'couples',
  'Bachelorette': 'bachelorette', 'Bachelor': 'bachelor',
  'Office': 'office_safe', 'Sober Dare': 'sober_dare',
};

function intensityColor(i: string) {
  return i === 'mild' ? '#4CAF50' : i === 'spicy' ? '#FF9800' : '#F44336';
}

function shotsForCard(intensity: string): number {
  const r = Math.random();
  if (intensity === 'mild')  return 1;
  if (intensity === 'spicy') return r < 0.8 ? 1 : 2;
  return r < 0.10 ? 1 : r < 0.70 ? 2 : 3;
}

interface PlayerState {
  name: string;
  totalShots: number;    // drinks in non-sober; refusals in sober
  disqualified: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GameScreen({ route, navigation }: any) {
  const {
    players: playerNames = [], deck = 'Friends', intensity = 'Mix All',
    soberMode = false, penaltyLabel = 'Drink', cardsPerRound = 20,
    timer = 20, randomOrder = false, maxShots = 7,
  } = route.params ?? {};

  const { state, dispatch } = useSession();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions]         = useState<QuestionCard[]>([]);
  const [shotCounts, setShotCounts]       = useState<number[]>([]);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [playerIndex, setPlayerIndex]     = useState(0);
  const [playerStates, setPlayerStates]   = useState<PlayerState[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [timeLeft, setTimeLeft]           = useState(timer);
  const [timerRunning, setTimerRunning]   = useState(false);
  const [timerExpired, setTimerExpired]   = useState(false);
  const [tapOutVisible, setTapOutVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.questionQueue.length > 0) {
      const q = state.questionQueue as QuestionCard[];
      setQuestions(q);
      setShotCounts(q.map((card: QuestionCard) => shotsForCard(card.intensity)));
      setPlayerStates(playerNames.map((name: string) => ({
        name,
        totalShots: state.drinkCounters[name] ?? 0,
        disqualified: false,
      })));
      setLoading(false);
    } else {
      async function load() {
        try {
          const { fisherYatesShuffle } = await import('../utils/shuffle');
          const deckId = DECK_ID_MAP[deck] ?? deck.toLowerCase().replace(/ /g, '_');
          const raw = await getQuestionsForDeck(deckId, intensity, soberMode);
          if (!raw || raw.length === 0) {
            setError(`No questions found for "${deck}" deck.`);
            setLoading(false);
            return;
          }
          const ordered = randomOrder ? fisherYatesShuffle(raw) : raw;
          const sliced  = ordered.slice(0, cardsPerRound);
          setQuestions(sliced);
          setShotCounts(sliced.map((q: QuestionCard) => shotsForCard(q.intensity)));
          setPlayerStates(playerNames.map((name: string) => ({ name, totalShots: 0, disqualified: false })));
          setLoading(false);
        } catch (e: any) {
          setError('Failed to load questions: ' + (e?.message ?? 'Unknown error'));
          setLoading(false);
        }
      }
      load();
    }
  }, []);

  // Sync drink counters from context (needed for undo to reflect in UI)
  useEffect(() => {
    if (loading || playerNames.length === 0) return;
    setPlayerStates(prev =>
      prev.map(p => ({
        ...p,
        totalShots: state.drinkCounters[p.name] ?? p.totalShots,
      }))
    );
  }, [state.drinkCounters]);

  // Auto-start timer
  useEffect(() => {
    if (loading || questions.length === 0 || timer === 0) return;
    setTimeLeft(timer);
    setTimerExpired(false);
    setTimerRunning(true);
    playSound('card');
  }, [currentIndex, loading]);

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t: number) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          setTimerExpired(true);
          playSound('timer');
          // In both modes, show the action modal when timer expires
          setTapOutVisible(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timerRunning]);

  const activePlayers = playerStates.filter(p => !p.disqualified);

  const nextActiveIndex = useCallback((cur: number, states: PlayerState[]): number => {
    let next = (cur + 1) % states.length;
    let tries = 0;
    while (states[next]?.disqualified && tries < states.length) {
      next = (next + 1) % states.length; tries++;
    }
    return next;
  }, []);

  const animateCard = useCallback((next: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
    ]).start();
    setTimeout(next, 120);
  }, [fadeAnim]);

  // ── Advance card ───────────────────────────────────────────────────────────
  const advanceCard = useCallback((states?: PlayerState[], curIndex?: number, curPlayerIndex?: number) => {
    clearInterval(timerRef.current!);
    setTimerRunning(false);
    setTapOutVisible(false);
    playSound('button');

    const currentStates    = states          ?? playerStates;
    const currentCardIndex = curIndex        ?? currentIndex;
    const currentPlayerIdx = curPlayerIndex  ?? playerIndex;
    const stillActive      = currentStates.filter(p => !p.disqualified);
    const nextCardIndex    = currentCardIndex + 1;

    if (nextCardIndex >= questions.length || stillActive.length <= 1) {
      playSound('finish');
      navigation.navigate('Results', {
        playerStates: currentStates,
        deck,
        totalCards: currentCardIndex + 1,
        maxShots,
        soberMode,
        penaltyLabel,
      });
      return;
    }

    const nextPlayer = nextActiveIndex(currentPlayerIdx, currentStates);
    animateCard(() => {
      setCurrentIndex(nextCardIndex);
      setPlayerIndex(nextPlayer);
      setTimeLeft(timer);
      setTimerExpired(false);
    });
  }, [currentIndex, playerIndex, questions.length, playerStates, deck, maxShots, timer, soberMode, nextActiveIndex]);

  // ── Core penalty handler — used for Drink (non-sober) and Refuse (sober) ──
  const handlePenalty = useCallback(() => {
    const shots = soberMode ? 1 : (shotCounts[currentIndex] ?? 1);
    const card  = questions[currentIndex];
    playSound('button');

    let updatedStates: PlayerState[] = [];
    let disqualifiedName = '';
    let nextPlayer = 0;

    setPlayerStates(prev => {
      const next = prev.map((p, i) => {
        if (i !== playerIndex) return p;
        const newTotal = p.totalShots + shots;
        const dq = newTotal >= maxShots;
        if (dq) disqualifiedName = p.name;
        return { ...p, totalShots: newTotal, disqualified: dq };
      });
      updatedStates = next;
      nextPlayer = nextActiveIndex(playerIndex, next);
      return next;
    });

    dispatch({
      type: 'RECORD_DRINK',
      playerIndex,
      shots,
      maxShots,
      nextPlayerIndex: nextPlayer,
      card,
      cardIndex: currentIndex,
    });

    setTimeout(() => {
      if (disqualifiedName) {
        playSound('disqualify');
        const limitLabel = soberMode ? 'refusal limit' : 'drink limit';
        Alert.alert(
          'Eliminated!',
          `${disqualifiedName} has reached the ${limitLabel} and is out!`,
          [{ text: 'OK', onPress: () => advanceCard(updatedStates, currentIndex, playerIndex) }]
        );
      } else {
        advanceCard(updatedStates, currentIndex, playerIndex);
      }
    }, 50);
  }, [currentIndex, playerIndex, shotCounts, questions, maxShots, soberMode, advanceCard, dispatch, nextActiveIndex]);

  // ── Next (no penalty) ──────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    const card     = questions[currentIndex];
    const nextPIdx = nextActiveIndex(playerIndex, playerStates);
    dispatch({
      type: 'RECORD_NEXT',
      playerIndex,
      nextPlayerIndex: nextPIdx,
      card,
      cardIndex: currentIndex,
    });
    advanceCard(playerStates, currentIndex, playerIndex);
  }, [currentIndex, playerIndex, playerStates, questions, advanceCard, dispatch, nextActiveIndex]);

  // ── Tap Out (timer expired modal — "Done" or "Refuse/Tap Out") ─────────────
  const handleTapOut = useCallback(() => {
    const name = playerStates[playerIndex]?.name;
    playSound('disqualify');
    const updated = playerStates.map((p, i) =>
      i === playerIndex ? { ...p, disqualified: true } : p
    );
    setPlayerStates(updated);
    setTapOutVisible(false);
    const msg = soberMode
      ? `${name} refused to do the dare and is eliminated!`
      : `${name} refused to drink and is eliminated!`;
    Alert.alert('Eliminated!', msg, [
      { text: 'OK', onPress: () => advanceCard(updated, currentIndex, playerIndex) }
    ]);
  }, [playerIndex, playerStates, currentIndex, advanceCard, soberMode]);

  // ── Undo ───────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const history = state.cardHistory;
    if (history.length === 0) return;
    playSound('undo');
    const last = history[history.length - 1] as any;
    dispatch({ type: 'UNDO_LAST' });
    clearInterval(timerRef.current!);
    setTimerRunning(false);
    setTimerExpired(false);
    setTapOutVisible(false);
    animateCard(() => {
      setCurrentIndex(last.cardIndex);
      setPlayerIndex(last.playerIndex);
      setTimeLeft(timer);
    });
  }, [state.cardHistory, dispatch, animateCard, timer]);

  // ── Render guards ──────────────────────────────────────────────────────────
  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.purplePrimary} />
      <Text style={styles.loadingText}>Loading questions…</Text>
    </View>
  );

  if (error) return (
    <View style={styles.centered}>
      <Ionicons name="warning" size={48} color="#FF9800" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const question      = questions[currentIndex];
  if (!question) return null;

  const cardText      = soberMode && question.soberText ? question.soberText : question.textEn;
  const currentPlayer = playerStates[playerIndex]?.name ?? 'Player';
  const progress      = (currentIndex + 1) / questions.length;
  const iColor        = intensityColor(question.intensity);
  const shots         = soberMode ? 1 : (shotCounts[currentIndex] ?? 1);
  const timerPct      = timer > 0 ? timeLeft / timer : 1;
  const isLastCard    = currentIndex + 1 >= questions.length;
  const currentShots  = playerStates[playerIndex]?.totalShots ?? 0;
  const canUndo       = state.cardHistory.length > 0;

  // Labels that adapt to sober mode
  const penaltyBtnLabel = soberMode ? 'Refuse' : `Drink (${shots})`;
  const tallyLabel      = soberMode ? 'Refusals' : 'Drinks';
  const limitLabel      = soberMode ? 'Max Refusals' : 'Limit';

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.lg }]}>

      {/* Header — sits below status bar via safe area insets */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            playSound('button');
            Alert.alert('Quit Game?', 'Progress will be lost.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Quit', style: 'destructive', onPress: () => {
                dispatch({ type: 'RESET' });
                navigation.goBack();
              }},
            ]);
          }}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.progress}>{currentIndex + 1} / {questions.length}</Text>

        <TouchableOpacity
          style={[styles.iconBtn, !canUndo && styles.iconBtnDisabled]}
          onPress={handleUndo}
          disabled={!canUndo}
        >
          <Ionicons name="arrow-undo" size={18} color={canUndo ? '#FFFFFF' : 'rgba(255,255,255,0.25)'} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Player + tally */}
      <View style={styles.playerRow}>
        <View style={styles.playerBadge}>
          <Ionicons name="person" size={14} color="#FFFFFF" />
          <Text style={styles.playerBadgeText}>  {currentPlayer}'s turn</Text>
        </View>
        <View style={styles.tallyBadge}>
          <Ionicons name={soberMode ? 'hand-left' : 'wine'} size={13} color="rgba(255,255,255,0.85)" />
          <Text style={styles.tallyText}>  {currentShots} / {maxShots}</Text>
        </View>
      </View>

      {/* Card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={[styles.intensityBadge, { backgroundColor: iColor }]}>
          <Text style={styles.intensityText}>{question.intensity.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardText}>{cardText}</Text>
        {!soberMode && (
          <View style={styles.penaltyRow}>
            <Ionicons name="wine" size={16} color="rgba(0,0,0,0.4)" />
            <Text style={styles.penaltyText}>
              {'  '}Penalty: {shots} {shots === 1 ? penaltyLabel : `${penaltyLabel}s`}
            </Text>
          </View>
        )}
        {soberMode && (
          <View style={styles.penaltyRow}>
            <Ionicons name="hand-left" size={16} color="rgba(0,0,0,0.4)" />
            <Text style={styles.penaltyText}>
              {'  '}Refuse = 1 refusal counted
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Timer */}
      {timer > 0 && (
        <View style={styles.timerSection}>
          <View style={styles.timerRow}>
            <View style={styles.timerTrack}>
              <View style={[styles.timerFill, {
                width: `${timerPct * 100}%`,
                backgroundColor: timerPct > 0.5 ? '#4CAF50' : timerPct > 0.25 ? '#FF9800' : '#F44336',
              }]} />
            </View>
            <Text style={[styles.timerCount, timerExpired && styles.timerExpiredText]}>
              {timerExpired ? '00s' : `${timeLeft}s`}
            </Text>
          </View>
          {timerExpired && (
            <Text style={styles.timerExpiredLabel}>
              {soberMode
                ? `Time's up! ${currentPlayer} must do the dare or refuse!`
                : `Time's up! ${currentPlayer} must drink!`}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Penalty button — Drink (non-sober) or Refuse (sober) */}
        <TouchableOpacity
          style={[styles.penaltyButton, soberMode && styles.refuseButton]}
          onPress={handlePenalty}
        >
          <Ionicons name={soberMode ? 'hand-left' : 'wine'} size={18} color="#FFFFFF" />
          <Text style={styles.penaltyBtnText}>  {penaltyBtnLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>{isLastCard ? 'Finish' : 'Next'}</Text>
          <Ionicons
            name={isLastCard ? 'flag' : 'arrow-forward'}
            size={16} color={COLORS.purplePrimary}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>

      {/* Modal — shown when timer expires */}
      <Modal transparent visible={tapOutVisible} animationType="fade">
        <View style={modal.overlay}>
          <View style={modal.box}>
            <Ionicons name="time" size={40} color={COLORS.purplePrimary} />
            <Text style={modal.title}>Time's Up!</Text>

            {soberMode ? (
              <>
                <Text style={modal.subtitle}>
                  {currentPlayer} must complete the dare or take a refusal.
                </Text>
                <TouchableOpacity style={modal.doneButton} onPress={handleNext}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={modal.doneText}>  Done the dare!</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modal.refuseModalButton} onPress={handlePenalty}>
                  <Ionicons name="hand-left" size={16} color="#E53935" />
                  <Text style={modal.refuseModalText}>  Refuse (+1 refusal)</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={modal.subtitle}>
                  {currentPlayer} must{' '}
                  <Text style={modal.highlight}>
                    {shots} {shots === 1 ? penaltyLabel : `${penaltyLabel}s`}
                  </Text>
                </Text>
                <TouchableOpacity style={modal.doneButton} onPress={handlePenalty}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={modal.doneText}>  Done!</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modal.tapOutModalButton} onPress={handleTapOut}>
                  <Ionicons name="ban" size={16} color="#E53935" />
                  <Text style={modal.tapOutText}>  Tap Out (refuse and leave game)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.purplePrimary,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl,
  },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.purplePrimary, padding: SPACING.xl,
  },
  loadingText: { marginTop: SPACING.md, color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  errorText:   { color: '#FFFFFF', fontSize: 16, textAlign: 'center', marginVertical: SPACING.xl },
  backButton: {
    backgroundColor: '#FFFFFF', paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.full,
  },
  backButtonText: { color: COLORS.purplePrimary, fontWeight: '700', fontSize: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.md,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  progress: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  progressTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, marginBottom: SPACING.lg,
  },
  progressFill: { height: 4, backgroundColor: '#FFFFFF', borderRadius: 2 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  playerBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
  },
  playerBadgeText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  tallyBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  tallyText: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 14 },
  card: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, justifyContent: 'center', marginBottom: SPACING.lg,
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
  },
  intensityBadge: {
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.full, marginBottom: SPACING.lg,
  },
  intensityText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  cardText: { fontSize: 22, fontWeight: '600', color: '#1A1A2E', lineHeight: 32 },
  penaltyRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: SPACING.xl, paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)',
  },
  penaltyText: { fontSize: 14, color: 'rgba(0,0,0,0.45)', fontWeight: '600' },
  timerSection: { marginBottom: SPACING.md },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  timerTrack: {
    flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4, overflow: 'hidden',
  },
  timerFill:         { height: 8, borderRadius: 4 },
  timerCount:        { color: '#FFFFFF', fontWeight: '700', fontSize: 16, minWidth: 36, textAlign: 'right' },
  timerExpiredText:  { color: '#FF5252' },
  timerExpiredLabel: { color: '#FF5252', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  actions: { flexDirection: 'row', gap: SPACING.md },
  penaltyButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#E53935',
  },
  refuseButton: { backgroundColor: '#7B1FA2' },
  penaltyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  nextButton: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#FFFFFF',
  },
  nextText: { color: COLORS.purplePrimary, fontWeight: '700', fontSize: 16 },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xl,
  },
  box: {
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, width: '100%', maxWidth: 360, alignItems: 'center', gap: SPACING.md,
  },
  title:     { fontSize: 26, fontWeight: '800', color: '#1A1A2E' },
  subtitle:  { fontSize: 17, textAlign: 'center', color: '#333' },
  highlight: { fontWeight: '800', color: COLORS.purplePrimary },
  doneButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.purplePrimary, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full, width: '100%',
  },
  doneText: { color: '#FFFFFF', fontWeight: '800', fontSize: 17 },
  refuseModalButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5, borderColor: '#7B1FA2', width: '100%',
  },
  refuseModalText: { color: '#7B1FA2', fontWeight: '700', fontSize: 14 },
  tapOutModalButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5, borderColor: '#E53935', width: '100%',
  },
  tapOutText: { color: '#E53935', fontWeight: '700', fontSize: 14 },
});