import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../services/initDatabase';
import { storage } from '../services/storage';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../utils/tokens';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  gamesPlayed: number;
  totalCards: number;
  totalDrinks: number;
  soberGames: number;
  favouriteDeck: string | null;
  longestGame: number;       // card count
  avgCardsPerGame: number;
}

interface RecentSession {
  session_id: string;
  deck_id: string;
  intensity: string;
  sober_mode: number;
  penalty_label: string;
  completed_at: number;
  card_count: number;
  player_names: string;
  total_drinks: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function deckDisplayName(id: string): string {
  const map: Record<string, string> = {
    friends: 'Friends', couples: 'Couples',
    bachelorette: 'Bachelorette', bachelor: 'Bachelor',
    office_safe: 'Office', sober_dare: 'Sober Dare',
  };
  return map[id] ?? id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'Just now';
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, color = COLORS.purplePrimary,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string | number; color?: string;
}) {
  return (
    <View style={sc.card}>
      <View style={[sc.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    minWidth: 90,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  value: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: 2, textAlign: 'center' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [recent, setRecent]   = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const db = await getDatabase();

      // ── Aggregate stats ──────────────────────────────────────────────────
      const totals = await db.getFirstAsync<{
        games: number; cards: number; sober: number;
      }>(`
        SELECT
          COUNT(*)                          AS games,
          COALESCE(SUM(card_count), 0)      AS cards,
          COALESCE(SUM(sober_mode), 0)      AS sober
        FROM sessions
      `);

      const drinkTotals = await db.getFirstAsync<{ drinks: number }>(`
        SELECT COALESCE(SUM(drink_count), 0) AS drinks
        FROM session_players
      `);

      const favRow = await db.getFirstAsync<{ deck_id: string; cnt: number }>(`
        SELECT deck_id, COUNT(*) AS cnt
        FROM sessions
        GROUP BY deck_id
        ORDER BY cnt DESC
        LIMIT 1
      `);

      const longestRow = await db.getFirstAsync<{ longest: number }>(`
        SELECT COALESCE(MAX(card_count), 0) AS longest FROM sessions
      `);

      const games = totals?.games ?? 0;
      const cards = totals?.cards ?? 0;

      setStats({
        gamesPlayed:    games,
        totalCards:     cards,
        totalDrinks:    drinkTotals?.drinks ?? 0,
        soberGames:     totals?.sober ?? 0,
        favouriteDeck:  favRow ? deckDisplayName(favRow.deck_id) : null,
        longestGame:    longestRow?.longest ?? 0,
        avgCardsPerGame: games > 0 ? Math.round(cards / games) : 0,
      });

      // ── Recent sessions (last 10) ─────────────────────────────────────────
      const rows = await db.getAllAsync<RecentSession>(`
        SELECT
          s.session_id, s.deck_id, s.intensity, s.sober_mode,
          s.penalty_label, s.completed_at, s.card_count,
          GROUP_CONCAT(sp.player_name, ', ') AS player_names,
          COALESCE(SUM(sp.drink_count), 0)   AS total_drinks
        FROM sessions s
        LEFT JOIN session_players sp ON sp.session_id = s.session_id
        GROUP BY s.session_id
        ORDER BY s.completed_at DESC
        LIMIT 10
      `);
      setRecent(rows);
    } catch (err: any) {
      // Sessions table empty on first run — that's fine
      setStats({
        gamesPlayed: 0, totalCards: 0, totalDrinks: 0,
        soberGames: 0, favouriteDeck: null,
        longestGame: 0, avgCardsPerGame: 0,
      });
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time the tab is focused so new sessions appear immediately
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will delete all your session history and stats. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.execAsync('DELETE FROM session_players; DELETE FROM sessions;');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleResetAge = () => {
    Alert.alert(
      'Reset Age Verification',
      'You will be shown the age verification screen next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: () => {
            try { storage.delete('age_verified'); } catch (_) {}
            Alert.alert('Done', 'Age verification will appear on next launch.');
          },
        },
      ]
    );
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!loading && stats?.gamesPlayed === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.lg }]}>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.emptyState}>
          <Ionicons name="game-controller-outline" size={64} color={COLORS.borderLight} />
          <Text style={styles.emptyTitle}>No games yet</Text>
          <Text style={styles.emptySubtitle}>
            Play your first game and your stats will appear here.
          </Text>
        </View>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleResetAge}>
          <Ionicons name="refresh" size={16} color="#E53935" />
          <Text style={styles.dangerBtnText}>  Reset Age Verification</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Profile</Text>

      {/* ── Stats grid ── */}
      {stats && (
        <>
          <Text style={styles.sectionLabel}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="game-controller" label="Games" value={stats.gamesPlayed} />
            <StatCard icon="layers"          label="Cards"  value={stats.totalCards} />
            <StatCard icon="wine"            label="Drinks" value={stats.totalDrinks} color="#E53935" />
          </View>
          <View style={[styles.statsGrid, { marginTop: SPACING.sm }]}>
            <StatCard
              icon="leaf" label="Sober Games"
              value={stats.soberGames} color="#4CAF50"
            />
            <StatCard
              icon="trophy" label="Longest Game"
              value={`${stats.longestGame} cards`} color="#FF9800"
            />
            <StatCard
              icon="bar-chart" label="Avg / Game"
              value={`${stats.avgCardsPerGame} cards`}
            />
          </View>

          {stats.favouriteDeck && (
            <View style={styles.favDeck}>
              <Ionicons name="heart" size={16} color={COLORS.purplePrimary} />
              <Text style={styles.favDeckText}>
                {'  '}Favourite deck: <Text style={styles.favDeckName}>{stats.favouriteDeck}</Text>
              </Text>
            </View>
          )}
        </>
      )}

      {/* ── Recent sessions ── */}
      {recent.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Recent Games</Text>
          {recent.map(s => (
            <View key={s.session_id} style={styles.sessionRow}>
              <View style={styles.sessionIcon}>
                <Ionicons
                  name={s.sober_mode ? 'leaf' : 'wine'}
                  size={18}
                  color={s.sober_mode ? '#4CAF50' : COLORS.purplePrimary}
                />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDeck}>{deckDisplayName(s.deck_id)}</Text>
                <Text style={styles.sessionMeta}>
                  {s.player_names} · {s.card_count} cards
                  {!s.sober_mode ? ` · ${s.total_drinks} drinks` : ''}
                </Text>
              </View>
              <Text style={styles.sessionTime}>{timeAgo(s.completed_at)}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
            <Ionicons name="trash-outline" size={15} color={COLORS.textMuted} />
            <Text style={styles.clearBtnText}>  Clear history</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ── Settings ── */}
      <Text style={styles.sectionLabel}>Settings</Text>
      <TouchableOpacity style={styles.settingRow} onPress={handleResetAge}>
        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textPrimary} />
        <Text style={styles.settingText}>  Reset Age Verification</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <View style={styles.versionRow}>
        <Text style={styles.versionText}>Bambika v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundWhite },
  content:   { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  pageTitle: {
    fontSize: 32, fontWeight: '800', color: COLORS.purplePrimary,
    letterSpacing: -0.8, marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: SPACING.sm, marginTop: SPACING.lg,
  },
  statsGrid: { flexDirection: 'row', gap: SPACING.sm },
  favDeck: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(107,78,255,0.06)',
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full, marginTop: SPACING.md,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(107,78,255,0.15)',
  },
  favDeckText: { fontSize: 14, color: COLORS.textSecondary },
  favDeckName: { fontWeight: '700', color: COLORS.purplePrimary },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
    gap: SPACING.md,
  },
  sessionIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(107,78,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  sessionInfo: { flex: 1 },
  sessionDeck: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  sessionMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sessionTime: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, marginTop: SPACING.sm,
  },
  clearBtnText: { fontSize: 14, color: COLORS.textMuted },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  settingText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  versionRow: { alignItems: 'center', marginTop: SPACING.xl },
  versionText: { fontSize: 13, color: COLORS.textMuted },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xxxl, gap: SPACING.md,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  emptySubtitle: {
    fontSize: 15, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 22, maxWidth: 280,
  },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5, borderColor: '#FFCDD2',
    backgroundColor: '#FFF3F3',
  },
  dangerBtnText: { fontSize: 14, fontWeight: '700', color: '#E53935' },
});