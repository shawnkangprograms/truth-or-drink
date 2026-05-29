import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDatabase } from '../services/initDatabase';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../utils/tokens';

interface PlayerState { name: string; totalShots: number; disqualified: boolean; }

export default function ResultsScreen({ route, navigation }: any) {
  const {
    playerStates = [] as PlayerState[],
    deck         = '',
    totalCards   = 0,
    maxShots     = 7,
    soberMode    = false,
    penaltyLabel = 'Drink',
  } = route.params ?? {};

  const insets    = useSafeAreaInsets();
  const savedRef  = useRef(false);   // prevent double-save on re-renders

  // ── Persist session to SQLite ─────────────────────────────────────────────
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    async function saveSession() {
      try {
        const db        = await getDatabase();
        const sessionId = 'session_' + Date.now();
        const deckId    = deck.toLowerCase().replace(/\s+/g, '_');
        const now       = Date.now();

        await db.runAsync(
          `INSERT INTO sessions
             (session_id, deck_id, intensity, sober_mode, penalty_label,
              completed_at, duration_sec, card_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [sessionId, deckId, 'mixed', soberMode ? 1 : 0,
           penaltyLabel, now, 0, totalCards]
        );

        for (const p of playerStates as PlayerState[]) {
          await db.runAsync(
            `INSERT INTO session_players (session_id, player_name, drink_count)
             VALUES (?, ?, ?)`,
            [sessionId, p.name, p.totalShots]
          );
        }
      } catch (_) {
        // Non-fatal — profile will just show 0 games if this fails
      }
    }
    saveSession();
  }, []);

  // ── Ranking ───────────────────────────────────────────────────────────────
  const active       = (playerStates as PlayerState[]).filter(p => !p.disqualified);
  const disqualified = (playerStates as PlayerState[]).filter(p => p.disqualified);

  const ranked = [...(playerStates as PlayerState[])].sort((a, b) => {
    if (a.disqualified && !b.disqualified) return 1;
    if (!a.disqualified && b.disqualified) return -1;
    return a.disqualified
      ? b.totalShots - a.totalShots
      : a.totalShots - b.totalShots;
  });

  const winner: PlayerState | undefined = ranked[0];

  const penaltyNoun   = soberMode ? 'refusal' : penaltyLabel.toLowerCase();
  const penaltyPlural = soberMode ? 'refusals' : `${penaltyLabel.toLowerCase()}s`;
  const limitLabel    = soberMode ? 'Refusal limit' : 'Drink limit';
  const winnerReason  = `${winner?.totalShots ?? 0} ${
    (winner?.totalShots ?? 0) === 1 ? penaltyNoun : penaltyPlural
  }${soberMode ? '' : ' consumed'}`;
  const trophyColor   = soberMode ? '#4CAF50' : COLORS.yellowAccent;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Setup')}>
        <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
        <Text style={styles.backText}>Setup</Text>
      </TouchableOpacity>

      {/* Sober banner */}
      {soberMode && (
        <View style={styles.soberBanner}>
          <Ionicons name="leaf" size={14} color="#4CAF50" />
          <Text style={styles.soberBannerText}>  Sober Mode — fewest refusals wins</Text>
        </View>
      )}

      {/* Hero */}
      <View style={styles.hero}>
        <Ionicons name="trophy" size={64} color={trophyColor} />
        <Text style={styles.winnerLabel}>WINNER</Text>
        <Text style={styles.winnerName}>{winner?.name ?? '—'}</Text>
        <Text style={styles.winnerStat}>{winnerReason}</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalCards}</Text>
          <Text style={styles.summaryLabel}>Cards played</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{active.length}</Text>
          <Text style={styles.summaryLabel}>Still standing</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{disqualified.length}</Text>
          <Text style={styles.summaryLabel}>Eliminated</Text>
        </View>
      </View>

      {/* Leaderboard */}
      <Text style={styles.sectionTitle}>Leaderboard</Text>
      {ranked.map((p: PlayerState, i: number) => {
        const isWinner = i === 0 && !p.disqualified;
        const pct      = maxShots > 0 ? Math.min(p.totalShots / maxShots, 1) : 0;
        const barColor = p.disqualified ? '#E53935'
          : soberMode ? '#4CAF50' : COLORS.purplePrimary;

        return (
          <View key={p.name} style={[styles.row, p.disqualified && styles.rowDq]}>
            <Text style={[styles.rank, p.disqualified && styles.rankDq]}>#{i + 1}</Text>
            <View style={styles.rowMid}>
              <View style={styles.nameRow}>
                <Text style={[styles.rowName, p.disqualified && styles.rowNameDq]}>
                  {p.name}
                </Text>
                {isWinner && (
                  <Ionicons name="trophy" size={14} color={trophyColor} style={{ marginLeft: 6 }} />
                )}
                {p.disqualified && (
                  <Ionicons name="ban" size={14} color="#E53935" style={{ marginLeft: 6 }} />
                )}
              </View>
              <View style={styles.drinkTrack}>
                <View style={[styles.drinkFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
              </View>
              {p.disqualified && (
                <Text style={styles.dqLabel}>
                  {soberMode ? 'Too many refusals — eliminated' : 'Drink limit reached — eliminated'}
                </Text>
              )}
            </View>
            <View style={styles.shotCount}>
              <Ionicons
                name={soberMode ? 'hand-left' : 'wine'}
                size={14}
                color={p.disqualified ? '#E53935' : (soberMode ? '#4CAF50' : COLORS.purplePrimary)}
              />
              <Text style={[styles.shotNumber, p.disqualified && styles.shotNumberDq]}>
                {' '}{p.totalShots}
              </Text>
            </View>
          </View>
        );
      })}

      <Text style={styles.limitNote}>{limitLabel}: {maxShots}</Text>

      {/* Actions */}
      <TouchableOpacity
        style={styles.playAgainButton}
        onPress={() => navigation.navigate('Setup')}
        activeOpacity={0.85}
      >
        <Ionicons name="refresh" size={18} color={COLORS.textPrimary} />
        <Text style={styles.playAgainText}>  Play Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.getParent()?.navigate('Main')}
        activeOpacity={0.85}
      >
        <Ionicons name="home" size={16} color="rgba(255,255,255,0.8)" />
        <Text style={styles.homeText}>  Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.purplePrimary },
  content:   { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: SPACING.md, alignSelf: 'flex-start',
  },
  backText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  soberBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)',
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full, alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  soberBannerText: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  hero: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  winnerLabel: {
    fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2, textTransform: 'uppercase', marginTop: SPACING.md,
  },
  winnerName: {
    fontSize: 40, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -1, marginTop: 4,
  },
  winnerStat: {
    marginTop: SPACING.sm, fontSize: 14,
    color: 'rgba(255,255,255,0.65)', textAlign: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  summaryCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center',
  },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  summaryLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)',
    marginTop: 2, textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: '#FFFFFF',
    marginBottom: SPACING.md, letterSpacing: -0.3,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.md,
  },
  rowDq: { backgroundColor: 'rgba(255,255,255,0.3)' },
  rank:   { fontSize: 16, fontWeight: '800', color: COLORS.purplePrimary, minWidth: 28 },
  rankDq: { color: 'rgba(107,78,255,0.4)' },
  rowMid: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rowName:   { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  rowNameDq: { color: 'rgba(0,0,0,0.35)' },
  drinkTrack: {
    height: 5, backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 4,
  },
  drinkFill:     { height: 5, borderRadius: 3 },
  dqLabel:       { fontSize: 11, color: '#E53935', fontWeight: '600' },
  shotCount:     { flexDirection: 'row', alignItems: 'center' },
  shotNumber:    { fontSize: 18, fontWeight: '800', color: COLORS.purplePrimary },
  shotNumberDq:  { color: '#E53935' },
  limitNote: {
    fontSize: 12, color: 'rgba(255,255,255,0.5)',
    textAlign: 'right', marginBottom: SPACING.xl, marginTop: -SPACING.sm,
  },
  playAgainButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.yellowAccent, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full, marginBottom: SPACING.md,
  },
  playAgainText: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  homeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.full,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  homeText: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
});