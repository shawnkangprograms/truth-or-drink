import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../utils/tokens';
import { getDatabase } from '../services/initDatabase';

interface Deck {
  name: string;
  deckId: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  intensity: string;
  free: boolean;
  cardCount: number;
  tags: string[];
  custom?: boolean;
}

interface CustomCard { id: string; text: string; intensity: 'mild' | 'spicy' | 'wild'; }

const OFFICIAL_DECKS: Deck[] = [
  {
    name: 'Friends', deckId: 'friends',
    description: 'Party-friendly questions for a fun night with your crew.',
    icon: 'people', intensity: 'Mild – Spicy', free: true, cardCount: 60,
    tags: ['Party', 'Social', 'Mixed'],
  },
  {
    name: 'Couples', deckId: 'couples',
    description: 'Deepen your connection or spice up date night.',
    icon: 'heart', intensity: 'Mild – Wild', free: false, cardCount: 50,
    tags: ['Romantic', 'Intimate'],
  },
  {
    name: 'Bachelorette', deckId: 'bachelorette',
    description: 'Unfiltered celebration for the bride-to-be.',
    icon: 'star', intensity: 'Spicy – Wild', free: false, cardCount: 45,
    tags: ['Adults', 'Party'],
  },
  {
    name: 'Bachelor', deckId: 'bachelor',
    description: "Last night of freedom — don't hold back.",
    icon: 'flame', intensity: 'Spicy – Wild', free: false, cardCount: 45,
    tags: ['Adults', 'Party'],
  },
  {
    name: 'Office', deckId: 'office_safe',
    description: 'Keep it professional — perfect for work events.',
    icon: 'briefcase', intensity: 'Mild', free: true, cardCount: 40,
    tags: ['Family Friendly', 'Work'],
  },
];

const INTENSITIES: Array<'mild' | 'spicy' | 'wild'> = ['mild', 'spicy', 'wild'];

// ── Custom Deck Creator Modal ─────────────────────────────────────────────────
function CustomDeckModal({
  visible, onClose, onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, cards: CustomCard[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const [deckName, setDeckName]     = useState('');
  const [cardText, setCardText]     = useState('');
  const [cardIntensity, setCardIntensity] = useState<'mild' | 'spicy' | 'wild'>('mild');
  const [cards, setCards]           = useState<CustomCard[]>([]);

  const addCard = () => {
    const text = cardText.trim();
    if (!text) return;
    setCards(prev => [...prev, { id: Date.now().toString(), text, intensity: cardIntensity }]);
    setCardText('');
  };

  const removeCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));

  const handleSave = () => {
    if (!deckName.trim()) { Alert.alert('Name required', 'Give your deck a name.'); return; }
    if (cards.length < 2)  { Alert.alert('Too few cards', 'Add at least 2 cards.'); return; }
    onSave(deckName.trim(), cards);
    setDeckName('');
    setCards([]);
    setCardText('');
  };

  const intensityColor = (i: string) =>
    i === 'mild' ? '#4CAF50' : i === 'spicy' ? '#FF9800' : '#F44336';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={cm.container} contentContainerStyle={[cm.content, { paddingTop: insets.top + SPACING.md }]}>
        <View style={cm.header}>
          <Text style={cm.title}>Create Custom Deck</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Deck name */}
        <Text style={cm.label}>Deck Name</Text>
        <TextInput
          style={cm.input}
          placeholder="e.g. Family Reunion"
          placeholderTextColor={COLORS.textMuted}
          value={deckName}
          onChangeText={setDeckName}
          maxLength={40}
        />

        {/* Add card */}
        <Text style={cm.label}>Add a Question / Dare</Text>
        <TextInput
          style={[cm.input, { minHeight: 72 }]}
          placeholder="Type a question or dare…"
          placeholderTextColor={COLORS.textMuted}
          value={cardText}
          onChangeText={setCardText}
          multiline
          maxLength={300}
        />

        {/* Intensity picker for new card */}
        <View style={cm.intensityRow}>
          {INTENSITIES.map(i => (
            <TouchableOpacity
              key={i}
              style={[cm.intensityPill, { borderColor: intensityColor(i) },
                cardIntensity === i && { backgroundColor: intensityColor(i) }]}
              onPress={() => setCardIntensity(i)}
            >
              <Text style={[cm.intensityText, cardIntensity === i && { color: '#FFF' }]}>
                {i.charAt(0).toUpperCase() + i.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={cm.addCardBtn} onPress={addCard}>
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={cm.addCardText}>  Add Card</Text>
        </TouchableOpacity>

        {/* Card list */}
        {cards.length > 0 && (
          <View style={cm.cardList}>
            <Text style={cm.cardListLabel}>{cards.length} card{cards.length !== 1 ? 's' : ''} added</Text>
            {cards.map((c, idx) => (
              <View key={c.id} style={cm.cardRow}>
                <View style={[cm.intensityDot, { backgroundColor: intensityColor(c.intensity) }]} />
                <Text style={cm.cardRowText} numberOfLines={2}>{c.text}</Text>
                <TouchableOpacity onPress={() => removeCard(c.id)}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={cm.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.textPrimary} />
          <Text style={cm.saveBtnText}>  Save Deck</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const cm = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundWhite },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.purplePrimary },
  label: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: SPACING.sm, marginTop: SPACING.md,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md, fontSize: FONTS.body.size, color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  intensityRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  intensityPill: {
    paddingVertical: 6, paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1.5,
  },
  intensityText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  addCardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.purplePrimary, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full, marginBottom: SPACING.lg,
  },
  addCardText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cardList: {
    backgroundColor: 'rgba(107,78,255,0.04)', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(107,78,255,0.1)',
  },
  cardListLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    marginBottom: SPACING.sm, textTransform: 'uppercase',
  },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  intensityDot: { width: 10, height: 10, borderRadius: 5 },
  cardRowText: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.yellowAccent, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
});

// ── Main BrowseScreen ─────────────────────────────────────────────────────────
export default function BrowseScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [customDecks, setCustomDecks] = useState<Deck[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Load saved custom decks from SQLite custom_decks table
  useEffect(() => {
    async function loadCustomDecks() {
      try {
        const db = await getDatabase();
        const rows = await db.getAllAsync<{ deck_id: string; name: string }>(
          'SELECT deck_id, name FROM custom_decks ORDER BY created_at DESC'
        );
        const loaded: Deck[] = rows.map(r => ({
          name: r.name,
          deckId: r.deck_id,
          description: 'Custom deck',
          icon: 'create' as any,
          intensity: 'Mixed',
          free: true,
          cardCount: 0,
          tags: ['Custom'],
          custom: true,
        }));
        setCustomDecks(loaded);
      } catch (_) {
        // custom_decks table may be empty — that's fine
      }
    }
    loadCustomDecks();
  }, []);

  const handleSelectDeck = (deck: Deck) => {
    navigation.navigate('GameFlow', {
      screen: 'Setup',
      params: { deck: deck.name },
    });
  };

  const handleSaveCustomDeck = async (name: string, cards: CustomCard[]) => {
    try {
      const db = await getDatabase();
      const deckId = 'custom_' + Date.now();
      const now    = Date.now();

      await db.runAsync(
        'INSERT INTO custom_decks (deck_id, name, created_at) VALUES (?, ?, ?)',
        [deckId, name, now]
      );

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        await db.runAsync(
          'INSERT INTO custom_cards (id, deck_id, text_en, intensity, sort_order) VALUES (?, ?, ?, ?, ?)',
          [c.id, deckId, c.text, c.intensity, i]
        );
      }

      const newDeck: Deck = {
        name, deckId,
        description: `${cards.length} custom cards`,
        icon: 'create', intensity: 'Mixed',
        free: true, cardCount: cards.length,
        tags: ['Custom'], custom: true,
      };
      setCustomDecks(prev => [newDeck, ...prev]);
      setModalVisible(false);
      Alert.alert('Saved!', `"${name}" deck is ready to play.`);
    } catch (err: any) {
      Alert.alert('Error', 'Could not save deck: ' + err.message);
    }
  };

  const renderDeck = (deck: Deck) => (
    <TouchableOpacity
      key={deck.deckId}
      style={styles.card}
      onPress={() => handleSelectDeck(deck)}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrap, (!deck.free || deck.custom) && styles.iconWrapAlt]}>
        <Ionicons
          name={deck.icon}
          size={26}
          color={!deck.free || deck.custom ? '#FFFFFF' : COLORS.purplePrimary}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.deckName}>{deck.name}</Text>
          {!deck.free && !deck.custom && (
            <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>
          )}
          {deck.custom && (
            <View style={styles.customBadge}><Text style={styles.customText}>CUSTOM</Text></View>
          )}
        </View>
        <Text style={styles.description}>{deck.description}</Text>
        <View style={styles.tagRow}>
          {deck.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {deck.cardCount > 0 && (
            <View style={styles.tag}>
              <Ionicons name="layers-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.tagText}> {deck.cardCount} cards</Text>
            </View>
          )}
        </View>
        <View style={styles.intensityRow}>
          <Ionicons name="flame-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.intensityText}> {deck.intensity}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.borderLight} />
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Decks</Text>
            <Text style={styles.pageSubtitle}>Choose a deck to start the game</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.createBtnText}> Create</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Official Decks</Text>
        {OFFICIAL_DECKS.map(renderDeck)}

        {customDecks.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Your Decks</Text>
            {customDecks.map(renderDeck)}
          </>
        )}

        {customDecks.length === 0 && (
          <TouchableOpacity style={styles.emptyCustom} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Create your own deck</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <CustomDeckModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveCustomDeck}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundWhite },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  pageHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: SPACING.lg,
  },
  pageTitle: { fontSize: 32, fontWeight: '800', color: COLORS.purplePrimary, letterSpacing: -0.8 },
  pageSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 2 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.purplePrimary,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.full,
  },
  createBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: SPACING.sm, marginTop: SPACING.md,
  },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, gap: SPACING.md,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(107,78,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapAlt: { backgroundColor: COLORS.purplePrimary },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  deckName: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  proBadge: {
    backgroundColor: COLORS.purplePrimary, paddingHorizontal: 7,
    paddingVertical: 2, borderRadius: BORDER_RADIUS.full,
  },
  proText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  customBadge: {
    backgroundColor: '#FF9800', paddingHorizontal: 7,
    paddingVertical: 2, borderRadius: BORDER_RADIUS.full,
  },
  customText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  description: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm, lineHeight: 18 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(107,78,255,0.07)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full,
  },
  tagText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  intensityRow: { flexDirection: 'row', alignItems: 'center' },
  intensityText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  emptyCustom: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xl, gap: SPACING.sm,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg, borderStyle: 'dashed',
    marginTop: SPACING.md,
  },
  emptyText: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },
});