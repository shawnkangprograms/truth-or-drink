import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/tokens';

const OFFICIAL_DECKS = [
  { name: 'Friends', free: true },
  { name: 'Couples', free: false },
  { name: 'Bachelorette', free: false },
  { name: 'Office Safe', free: false },
  { name: 'Sober Dare', free: false },
];

const CUSTOM_DECKS = []; // empty for now

export default function BrowseScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Official Decks</Text>
      <View style={styles.grid}>
        {OFFICIAL_DECKS.map((deck, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.deckCard, !deck.free && styles.lockedCard]}
            onPress={() => {
              // Future: open upgrade modal for locked decks
            }}
          >
            <Text style={styles.deckName}>{deck.name}</Text>
            {!deck.free && <Text style={styles.lockIcon}>🔒</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>My Custom Decks</Text>
      {CUSTOM_DECKS.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No custom decks yet.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {/* Custom deck cards would go here */}
        </View>
      )}

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          // Future: navigate to DeckEditor
        }}
      >
        <Text style={styles.createButtonText}>+ Create Deck</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundWhite,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  sectionTitle: {
    fontSize: FONTS.h2.size,
    fontWeight: 'bold',
    color: COLORS.purplePrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deckCard: {
    width: '48%',
    backgroundColor: COLORS.purpleLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  lockedCard: {
    opacity: 0.6,
  },
  deckName: {
    fontSize: FONTS.body.size,
    fontWeight: 'bold',
    color: COLORS.purpleDark,
    textAlign: 'center',
  },
  lockIcon: {
    marginTop: SPACING.sm,
    fontSize: 16,
  },
  emptyState: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.body.size,
    color: COLORS.textMuted,
  },
  createButton: {
    backgroundColor: COLORS.yellowAccent,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    alignSelf: 'center',
  },
  createButtonText: {
    fontSize: FONTS.body.size,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});