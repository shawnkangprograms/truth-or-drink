import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/tokens';

const DECK_LIST = ['Friends', 'Couples', 'Bachelorette', 'Office Safe', 'Sober Dare'];
const INTENSITIES = ['Mild', 'Spicy', 'Wild', 'Mix All'];
const PENALTY_LABELS = ['Drink', 'Shot', 'Sip', 'Dare'];
const TIMER_OPTIONS = [10, 20, 30, 60];
const CARDS_PER_ROUND_OPTIONS = [10, 15, 20, 30, 50];

export default function SetupScreen({ navigation }: any) {
  const [players, setPlayers] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [intensity, setIntensity] = useState('Mix All');
  const [soberMode, setSoberMode] = useState(false);
  const [penaltyLabel, setPenaltyLabel] = useState('Drink');
  const [cardsPerRound, setCardsPerRound] = useState(20);
  const [timer, setTimer] = useState(20);
  const [skipEnabled, setSkipEnabled] = useState(true);
  const [randomOrder, setRandomOrder] = useState(false);

  const addPlayer = () => {
    const name = playerInput.trim();
    if (!name || players.includes(name)) return;
    if (players.length >= 8) return;
    setPlayers([...players, name]);
    setPlayerInput('');
  };

  const removePlayer = (name: string) => {
    setPlayers(players.filter(p => p !== name));
  };

  const canStart = players.length >= 2 && selectedDeck !== null;

  const handleStartGame = () => {
    if (!canStart) return;
    navigation.navigate('Game', {
      players,
      deck: selectedDeck,
      intensity,
      soberMode,
      penaltyLabel,
      cardsPerRound,
      timer,
      skipEnabled,
      randomOrder,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Player Entry */}
      <Text style={styles.sectionTitle}>Players</Text>
      <View style={styles.playerInputRow}>
        <TextInput
          style={styles.input}
          placeholder="Player name"
          value={playerInput}
          onChangeText={setPlayerInput}
          maxLength={20}
        />
        <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {players.map((name, i) => (
          <TouchableOpacity key={i} style={styles.chip} onPress={() => removePlayer(name)}>
            <Text style={styles.chipText}>{name.charAt(0).toUpperCase()}</Text>
            <Text style={styles.chipClose}>✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      {players.length > 0 && <Text style={styles.hint}>{players.length} player{players.length>1?'s':''} added</Text>}

      {/* Deck Selection */}
      <Text style={styles.sectionTitle}>Choose Deck</Text>
      <View style={styles.pillRow}>
        {DECK_LIST.map(deck => (
          <TouchableOpacity
            key={deck}
            style={[styles.pill, selectedDeck === deck && styles.pillSelected]}
            onPress={() => setSelectedDeck(deck)}
          >
            <Text style={[styles.pillText, selectedDeck === deck && styles.pillTextSelected]}>{deck}</Text>
          </TouchableOpacity>
        ))}
      </View>

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

      {/* Sober Mode & Penalty */}
      <Text style={styles.sectionTitle}>Options</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Sober Mode</Text>
        <TouchableOpacity
          style={[styles.toggle, soberMode && styles.toggleActive]}
          onPress={() => { setSoberMode(!soberMode); if (!soberMode) setPenaltyLabel('Dare'); }}
        >
          <View style={[styles.toggleThumb, soberMode && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>
      {!soberMode && (
        <View style={styles.pillRow}>
          {PENALTY_LABELS.map(label => (
            <TouchableOpacity
              key={label}
              style={[styles.pill, penaltyLabel === label && styles.pillSelected]}
              onPress={() => setPenaltyLabel(label)}
            >
              <Text style={[styles.pillText, penaltyLabel === label && styles.pillTextSelected]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Skip & Random */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Skip Card</Text>
        <TouchableOpacity
          style={[styles.toggle, skipEnabled && styles.toggleActive]}
          onPress={() => setSkipEnabled(!skipEnabled)}
        >
          <View style={[styles.toggleThumb, skipEnabled && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Random Order</Text>
        <TouchableOpacity
          style={[styles.toggle, randomOrder && styles.toggleActive]}
          onPress={() => setRandomOrder(!randomOrder)}
        >
          <View style={[styles.toggleThumb, randomOrder && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>

      {/* Steppers */}
      <Text style={styles.sectionTitle}>Cards per Round</Text>
      <View style={styles.pillRow}>
        {CARDS_PER_ROUND_OPTIONS.map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.pill, cardsPerRound === n && styles.pillSelected]}
            onPress={() => setCardsPerRound(n)}
          >
            <Text style={[styles.pillText, cardsPerRound === n && styles.pillTextSelected]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Timer</Text>
      <View style={styles.pillRow}>
        {TIMER_OPTIONS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.pill, timer === t && styles.pillSelected]}
            onPress={() => setTimer(t)}
          >
            <Text style={[styles.pillText, timer === t && styles.pillTextSelected]}>{t}s</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        onPress={handleStartGame}
        disabled={!canStart}
      >
        <Text style={styles.startButtonText}>Start Game</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundWhite },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  sectionTitle: {
    fontSize: FONTS.h2.size, fontWeight: 'bold', color: COLORS.purplePrimary,
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  playerInputRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  input: {
    flex: 1, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md, fontSize: FONTS.body.size, marginRight: SPACING.sm,
    color: COLORS.textPrimary,
  },
  addButton: {
    backgroundColor: COLORS.purplePrimary, paddingHorizontal: SPACING.lg,
    justifyContent: 'center', borderRadius: BORDER_RADIUS.sm,
  },
  addButtonText: { color: COLORS.backgroundWhite, fontWeight: 'bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.purpleLight,
    borderRadius: BORDER_RADIUS.full, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm, marginBottom: SPACING.sm,
  },
  chipText: {
    fontWeight: 'bold', fontSize: FONTS.body.size, color: COLORS.purpleDark,
    marginRight: SPACING.sm,
  },
  chipClose: { fontSize: 14, color: COLORS.purpleDark },
  hint: { fontSize: FONTS.caption.size, color: COLORS.textMuted, marginBottom: SPACING.md },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md },
  pill: {
    borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pillSelected: { backgroundColor: COLORS.purplePrimary, borderColor: COLORS.purplePrimary },
  pillText: { fontSize: FONTS.body.size, color: COLORS.textPrimary },
  pillTextSelected: { color: COLORS.backgroundWhite },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  toggleLabel: { fontSize: FONTS.body.size, color: COLORS.textPrimary },
  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: COLORS.borderLight,
    justifyContent: 'center', padding: 2,
  },
  toggleActive: { backgroundColor: COLORS.purplePrimary },
  toggleThumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.backgroundWhite,
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
  startButton: {
    backgroundColor: COLORS.yellowAccent, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full, marginTop: SPACING.xl, alignItems: 'center',
  },
  startButtonDisabled: { opacity: 0.4 },
  startButtonText: { fontSize: FONTS.h2.size, fontWeight: 'bold', color: COLORS.textPrimary },
});