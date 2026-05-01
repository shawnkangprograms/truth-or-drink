import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/tokens';

export default function HomeScreen({ navigation }: any) {
  const handleQuickStart = () => {
    // For now, navigate to Setup with default config
    navigation.navigate('Setup');
  };

  const decks = [
    { name: 'Friends', free: true },
    { name: 'Couples', free: false },
    { name: 'Bachelorette', free: false },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Polka-dot decoration placeholder – we'll add actual pattern later */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <Text style={styles.appName}>Bambika</Text>
      <Text style={styles.tagline}>The Party Game for Everyone</Text>

      <TouchableOpacity style={styles.quickStart} onPress={handleQuickStart}>
        <Text style={styles.quickStartText}>Quick Start</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Featured Decks</Text>
      <View style={styles.deckRow}>
        {decks.map((deck, index) => (
          <View key={index} style={styles.deckCard}>
            <Text style={styles.deckName}>{deck.name}</Text>
            {!deck.free && <Text style={styles.lock}>🔒</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.purplePrimary,
  },
  content: {
    paddingTop: SPACING.xxl + 40,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    paddingBottom: SPACING.xxl,
  },
  decorCircle1: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 40,
    height: 40,
    backgroundColor: COLORS.purpleLight,
    borderRadius: 20,
    opacity: 0.3,
  },
  decorCircle2: {
    position: 'absolute',
    top: 200,
    left: 50,
    width: 60,
    height: 60,
    backgroundColor: COLORS.purpleLight,
    borderRadius: 30,
    opacity: 0.2,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.backgroundWhite,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONTS.body.size,
    color: COLORS.purpleLight,
    marginBottom: SPACING.xl,
  },
  quickStart: {
    backgroundColor: COLORS.yellowAccent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.xxl,
  },
  quickStartText: {
    fontSize: FONTS.h2.size,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: FONTS.h2.size,
    fontWeight: 'bold',
    color: COLORS.backgroundWhite,
    marginBottom: SPACING.md,
  },
  deckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deckCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  deckName: {
    fontSize: FONTS.body.size,
    fontWeight: 'bold',
    color: COLORS.purplePrimary,
  },
  lock: {
    fontSize: 12,
  },
});