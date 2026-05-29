import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/tokens';
import { getQuestionsForDeck } from '../services/contentCache';
import { useSession } from '../context/SessionContext';

const DECK_LIST      = ['Friends', 'Couples', 'Bachelorette', 'Bachelor', 'Office'];
const INTENSITIES    = ['Mild', 'Spicy', 'Wild', 'Mix All'];
// Non-sober: only Drink or Shot. Sober mode has no penalty label (uses Refuse logic).
const PENALTY_LABELS = ['Drink', 'Shot'];
const TIMER_OPTIONS  = [0, 10, 20, 30, 60];
const CARDS_OPTIONS  = [10, 15, 20, 30, 50];
const MIN_LIMIT = 1;
const MAX_LIMIT = 15;

export default function SetupScreen({ route, navigation }: any) {
  const incomingDeck: string | null = route?.params?.deck ?? null;
  const isQuickStart = incomingDeck === null;

  const [players, setPlayers]             = useState<string[]>([]);
  const [playerInput, setPlayerInput]     = useState('');
  const [selectedDeck, setSelectedDeck]   = useState<string | null>(incomingDeck);
  const [intensity, setIntensity]         = useState('Mix All');
  const [soberMode, setSoberMode]         = useState(false);
  const [penaltyLabel, setPenaltyLabel]   = useState('Drink');
  const [cardsPerRound, setCardsPerRound] = useState(20);
  const [timer, setTimer]                 = useState(20);
  const [randomOrder, setRandomOrder]     = useState(false);
  const [maxLimit, setMaxLimit]           = useState(7);

  const insets = useSafeAreaInsets();
  const { dispatch } = useSession();

  const addPlayer = () => {
    const name = playerInput.trim();
    if (!name || players.includes(name) || players.length >= 8) return;
    setPlayers([...players, name]);
    setPlayerInput('');
  };

  const removePlayer = (name: string) => setPlayers(players.filter(p => p !== name));

  const canStart = players.length >= 2 && selectedDeck !== null;

  const handleStartGame = async () => {
    if (!canStart) return;
    try {
      const deckId = selectedDeck!.toLowerCase().replace(/\s+/g, '_');
      const questions = await getQuestionsForDeck(deckId, intensity, soberMode);

      if (!questions || questions.length === 0) {
        Alert.alert('No questions found', `No cards available for the "${selectedDeck}" deck.`);
        return;
      }

      dispatch({
        type: 'INIT_SESSION',
        config: {
          players, deckId, intensity, soberMode,
          penaltyLabel: soberMode ? 'Refuse' : penaltyLabel,
          cardsPerRound, timer, randomOrder,
          maxShots: maxLimit,
          questions,
        },
      });

      navigation.navigate('Game', {
        players, deck: selectedDeck, intensity, soberMode,
        penaltyLabel: soberMode ? 'Refuse' : penaltyLabel,
        cardsPerRound, timer, randomOrder, maxShots: maxLimit,
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load questions: ' + (err?.message ?? 'Unknown error'));
    }
  };

  const limitLabel   = soberMode ? 'Max Refusals' : 'Drink Limit';
  const limitHint    = soberMode
    ? 'Player is eliminated after this many refusals.'
    : 'Player is eliminated after this many total drinks.';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color={COLORS.purplePrimary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Deck — picker for Quick Start, badge for Browse flow */}
      {isQuickStart ? (
        <>
          <Text style={styles.sectionTitle}>Choose Deck</Text>
          <View style={styles.pillRow}>
            {DECK_LIST.map(deck => (
              <TouchableOpacity
                key={deck}
                style={[styles.pill, selectedDeck === deck && styles.pillSelected]}
                onPress={() => setSelectedDeck(deck)}
              >
                <Text style={[styles.pillText, selectedDeck === deck && styles.pillTextSelected]}>
                  {deck}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.deckBadge}>
          <Ionicons name="albums" size={16} color={COLORS.purplePrimary} />
          <Text style={styles.deckBadgeText}>  {selectedDeck} Deck</Text>
        </View>
      )}

      {/* Players */}
      <Text style={styles.sectionTitle}>Players</Text>
      <View style={styles.playerInputRow}>
        <TextInput
          style={styles.input}
          placeholder="Player name"
          placeholderTextColor={COLORS.textMuted}
          value={playerInput}
          onChangeText={setPlayerInput}
          maxLength={20}
          onSubmitEditing={addPlayer}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {players.map((name, i) => (
          <TouchableOpacity key={i} style={styles.chip} onPress={() => removePlayer(name)}>
            <Text style={styles.chipText}>{name}</Text>
            <Ionicons name="close" size={14} color={COLORS.purpleDark} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ))}
      </View>
      {players.length > 0 && (
        <Text style={styles.hint}>{players.length} player{players.length > 1 ? 's' : ''} · tap to remove</Text>
      )}

      {/* Intensity */}
      <Text style={styles.sectionTitle}>Intensity</Text>
      <View style={styles.pillRow}>
        {INTENSITIES.map(i => (
          <TouchableOpacity
            key={i}
            style={[styles.pill, intensity === i && styles.pillSelected]}
            onPress={() => setIntensity(i)}
          >
            <Text style={[styles.pillText, intensity === i && styles.pillTextSelected]}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Options */}
      <Text style={styles.sectionTitle}>Options</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Sober Mode</Text>
        <TouchableOpacity
          style={[styles.toggle, soberMode && styles.toggleActive]}
          onPress={() => setSoberMode(v => !v)}
        >
          <View style={[styles.toggleThumb, soberMode && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>

      {/* Penalty type — only shown in non-sober mode, only Drink or Shot */}
      {!soberMode && (
        <>
          <Text style={styles.subLabel}>Penalty type</Text>
          <View style={styles.pillRow}>
            {PENALTY_LABELS.map(label => (
              <TouchableOpacity
                key={label}
                style={[styles.pill, penaltyLabel === label && styles.pillSelected]}
                onPress={() => setPenaltyLabel(label)}
              >
                <Text style={[styles.pillText, penaltyLabel === label && styles.pillTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Elimination limit counter — adapts label to mode */}
      <View style={[styles.limitSection, soberMode && styles.limitSectionSober]}>
        <View style={styles.limitHeader}>
          <Ionicons name="ban" size={18} color={soberMode ? '#6A1B9A' : '#C62828'} />
          <Text style={[styles.limitTitle, soberMode && styles.limitTitleSober]}>
            {'  '}{limitLabel}
            <Text style={styles.required}> *</Text>
          </Text>
        </View>
        <Text style={[styles.limitHint, soberMode && styles.limitHintSober]}>{limitHint}</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterBtn, maxLimit <= MIN_LIMIT && styles.counterBtnDisabled, soberMode && styles.counterBtnSober]}
            onPress={() => setMaxLimit(s => Math.max(MIN_LIMIT, s - 1))}
            disabled={maxLimit <= MIN_LIMIT}
          >
            <Ionicons name="remove" size={22} color={maxLimit <= MIN_LIMIT ? COLORS.textMuted : (soberMode ? '#6A1B9A' : '#C62828')} />
          </TouchableOpacity>
          <View style={styles.counterValue}>
            <Text style={[styles.counterNumber, soberMode && styles.counterNumberSober]}>{maxLimit}</Text>
            <Text style={[styles.counterSub, soberMode && styles.counterSubSober]}>
              {soberMode ? 'refusals max' : 'drinks max'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.counterBtn, maxLimit >= MAX_LIMIT && styles.counterBtnDisabled, soberMode && styles.counterBtnSober]}
            onPress={() => setMaxLimit(s => Math.min(MAX_LIMIT, s + 1))}
            disabled={maxLimit >= MAX_LIMIT}
          >
            <Ionicons name="add" size={22} color={maxLimit >= MAX_LIMIT ? COLORS.textMuted : (soberMode ? '#6A1B9A' : '#C62828')} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Random Order</Text>
        <TouchableOpacity
          style={[styles.toggle, randomOrder && styles.toggleActive]}
          onPress={() => setRandomOrder(v => !v)}
        >
          <View style={[styles.toggleThumb, randomOrder && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>

      {/* Cards per round */}
      <Text style={styles.sectionTitle}>Cards per Round</Text>
      <View style={styles.pillRow}>
        {CARDS_OPTIONS.map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.pill, cardsPerRound === n && styles.pillSelected]}
            onPress={() => setCardsPerRound(n)}
          >
            <Text style={[styles.pillText, cardsPerRound === n && styles.pillTextSelected]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timer */}
      <Text style={styles.sectionTitle}>Timer</Text>
      <View style={styles.pillRow}>
        {TIMER_OPTIONS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.pill, timer === t && styles.pillSelected]}
            onPress={() => setTimer(t)}
          >
            <Text style={[styles.pillText, timer === t && styles.pillTextSelected]}>
              {t === 0 ? 'Off' : `${t}s`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start */}
      <TouchableOpacity
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        onPress={handleStartGame}
        disabled={!canStart}
        activeOpacity={0.85}
      >
        <Text style={styles.startButtonText}>
          {players.length < 2
            ? 'Add at least 2 players'
            : selectedDeck === null
            ? 'Choose a deck'
            : 'Start Game'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundWhite },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: SPACING.md, alignSelf: 'flex-start',
  },
  backText: { fontSize: 16, color: COLORS.purplePrimary, fontWeight: '600' },
  deckBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(107,78,255,0.08)',
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full, alignSelf: 'flex-start',
    marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(107,78,255,0.2)',
  },
  deckBadgeText: { fontSize: 14, fontWeight: '700', color: COLORS.purplePrimary },
  sectionTitle: {
    fontSize: FONTS.h2.size, fontWeight: 'bold', color: COLORS.purplePrimary,
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  subLabel: { fontSize: FONTS.body.size, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  playerInputRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  input: {
    flex: 1, borderWidth: 1, borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm, padding: SPACING.md,
    fontSize: FONTS.body.size, marginRight: SPACING.sm, color: COLORS.textPrimary,
  },
  addButton: {
    backgroundColor: COLORS.purplePrimary, paddingHorizontal: SPACING.lg,
    justifyContent: 'center', borderRadius: BORDER_RADIUS.sm,
  },
  addButtonText: { color: COLORS.backgroundWhite, fontWeight: 'bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.purpleLight,
    borderRadius: BORDER_RADIUS.full, paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md, marginRight: SPACING.sm, marginBottom: SPACING.sm,
  },
  chipText: { fontWeight: 'bold', fontSize: FONTS.body.size, color: COLORS.purpleDark },
  hint: { fontSize: FONTS.caption.size, color: COLORS.textMuted, marginBottom: SPACING.md },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md },
  pill: {
    borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm, marginBottom: SPACING.sm,
  },
  pillSelected: { backgroundColor: COLORS.purplePrimary, borderColor: COLORS.purplePrimary },
  pillText: { fontSize: FONTS.body.size, color: COLORS.textPrimary },
  pillTextSelected: { color: COLORS.backgroundWhite },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  toggleLabel: { fontSize: FONTS.body.size, color: COLORS.textPrimary },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: COLORS.borderLight, justifyContent: 'center', padding: 2,
  },
  toggleActive: { backgroundColor: COLORS.purplePrimary },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.backgroundWhite },
  toggleThumbActive: { alignSelf: 'flex-end' },
  limitSection: {
    backgroundColor: '#FFF3F3', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  limitSectionSober: { backgroundColor: '#F3E5F5', borderColor: '#CE93D8' },
  limitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  limitTitle: { fontSize: FONTS.body.size, fontWeight: '700', color: '#C62828' },
  limitTitleSober: { color: '#6A1B9A' },
  required: { color: '#E53935', fontWeight: '700' },
  limitHint: { fontSize: FONTS.caption.size, color: '#E57373', marginBottom: SPACING.md },
  limitHintSober: { color: '#AB47BC' },
  counterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl,
  },
  counterBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FFCDD2',
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnSober: { borderColor: '#CE93D8' },
  counterBtnDisabled: { borderColor: COLORS.borderLight },
  counterValue: { alignItems: 'center', minWidth: 60 },
  counterNumber: { fontSize: 36, fontWeight: '800', color: '#C62828', lineHeight: 40 },
  counterNumberSober: { color: '#6A1B9A' },
  counterSub: { fontSize: 11, color: '#E57373', fontWeight: '600' },
  counterSubSober: { color: '#AB47BC' },
  startButton: {
    backgroundColor: COLORS.yellowAccent, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full, marginTop: SPACING.xl, alignItems: 'center',
  },
  startButtonDisabled: { opacity: 0.45 },
  startButtonText: { fontSize: FONTS.h2.size, fontWeight: 'bold', color: COLORS.textPrimary },
});