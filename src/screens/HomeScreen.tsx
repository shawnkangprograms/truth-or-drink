import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../utils/tokens';

const decks = [
  { name: 'Friends',      description: 'Party-friendly chaos',    free: true,  icon: 'people' },
  { name: 'Couples',      description: 'Date night energy',       free: false, icon: 'heart' },
  { name: 'Bachelorette', description: 'Unfiltered celebration',  free: false, icon: 'star' },
];

export default function HomeScreen({ navigation }: any) {
  const handleQuickStart = () => {
    navigation.navigate('GameFlow', {
      screen: 'Setup',
      params: { deck: null },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.appName}>Bambika</Text>
        <Text style={styles.tagline}>
          The party game built for unforgettable nights.
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.quickStart}
          onPress={handleQuickStart}
        >
          <Ionicons name="play" size={18} color={COLORS.purplePrimary} style={{ marginRight: 8 }} />
          <Text style={styles.quickStartText}>Quick Start</Text>
        </TouchableOpacity>
      </View>

      {/* Featured decks */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Decks</Text>
        <Text style={styles.sectionMeta}>Start with the classics</Text>
      </View>

      {decks.map((deck, index) => (
        <TouchableOpacity
          key={index}
          style={styles.deckCard}
          onPress={() => navigation.navigate('GameFlow', {
            screen: 'Setup',
            params: { deck: deck.name },
          })}
          activeOpacity={0.85}
        >
          <View style={styles.deckIcon}>
            <Ionicons name={deck.icon as any} size={22} color="#FFFFFF" />
          </View>
          <View style={styles.deckInfo}>
            <Text style={styles.deckName}>{deck.name}</Text>
            <Text style={styles.deckDescription}>{deck.description}</Text>
          </View>
          {!deck.free ? (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.purplePrimary },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxxl, paddingBottom: SPACING.xxxl },
  glow1: {
    position: 'absolute', top: 80, right: -30,
    width: 180, height: 180, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  glow2: {
    position: 'absolute', top: 280, left: -50,
    width: 220, height: 220, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  hero: { paddingTop: SPACING.xl, marginBottom: SPACING.xxxl },
  appName: { fontSize: 52, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 },
  tagline: {
    marginTop: SPACING.md, fontSize: 17, lineHeight: 26,
    color: 'rgba(255,255,255,0.72)', maxWidth: '85%',
  },
  quickStart: {
    marginTop: SPACING.xl, backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start', paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row', alignItems: 'center',
  },
  quickStartText: { fontSize: 16, fontWeight: '700', color: COLORS.purplePrimary },
  sectionHeader: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.4 },
  sectionMeta: { marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.65)' },
  deckCard: {
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
  },
  deckIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  deckInfo: { flex: 1 },
  deckName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  deckDescription: { marginTop: 3, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  proBadge: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: BORDER_RADIUS.full,
  },
  proBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.purplePrimary, letterSpacing: 0.5 },
});