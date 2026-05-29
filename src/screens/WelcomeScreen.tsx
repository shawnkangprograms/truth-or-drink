import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../utils/tokens';

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 100;
const MAX_YEAR = CURRENT_YEAR - 18;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function Stepper({
  label, value, display, onInc, onDec,
}: {
  label: string; value: number; display: string;
  onInc: () => void; onDec: () => void;
}) {
  return (
    <View style={step.col}>
      <Text style={step.label}>{label}</Text>
      <TouchableOpacity style={step.btn} onPress={onInc} activeOpacity={0.7}>
        <Ionicons name="chevron-up" size={20} color={COLORS.purplePrimary} />
      </TouchableOpacity>
      <View style={step.valueBox}>
        <Text style={step.value}>{display}</Text>
      </View>
      <TouchableOpacity style={step.btn} onPress={onDec} activeOpacity={0.7}>
        <Ionicons name="chevron-down" size={20} color={COLORS.purplePrimary} />
      </TouchableOpacity>
    </View>
  );
}

const step = StyleSheet.create({
  col: { alignItems: 'center', flex: 1 },
  label: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
  },
  btn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(107,78,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  valueBox: {
    paddingVertical: 10, paddingHorizontal: 6,
    minWidth: 64, alignItems: 'center',
  },
  value: {
    fontSize: 18, fontWeight: '700', color: COLORS.purplePrimary,
  },
});

export default function WelcomeScreen({ navigation }: any) {
  const [day, setDay]     = useState(1);
  const [month, setMonth] = useState(1);
  const [year, setYear]   = useState(MAX_YEAR);
  const [error, setError] = useState('');

  const maxDay = daysInMonth(month, year);
  const clampedDay = Math.min(day, maxDay);

  const incDay   = () => setDay(d => d >= maxDay ? 1 : d + 1);
  const decDay   = () => setDay(d => d <= 1 ? maxDay : d - 1);
  const incMonth = () => setMonth(m => m >= 12 ? 1 : m + 1);
  const decMonth = () => setMonth(m => m <= 1 ? 12 : m - 1);
  const incYear  = () => setYear(y => Math.min(y + 1, MAX_YEAR));
  const decYear  = () => setYear(y => Math.max(y - 1, MIN_YEAR));

  const handleConfirm = () => {
    setError('');
    const dob = new Date(year, month - 1, clampedDay);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

    if (age < 18) {
      setError('You must be at least 18 years old to play.');
      return;
    }

    try {
      const { storage } = require('../services/storage');
      storage.set('age_verified', true);
    } catch (_) {}

    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconRow}>
          <Ionicons name="shield-checkmark" size={48} color={COLORS.purplePrimary} />
        </View>

        <Text style={styles.heading}>Age Verification</Text>
        <Text style={styles.subtitle}>
          You must be 18 or older to play. Select your date of birth.
        </Text>

        <View style={styles.stepperRow}>
          <Stepper
            label="Day"
            value={clampedDay}
            display={String(clampedDay).padStart(2, '0')}
            onInc={incDay}
            onDec={decDay}
          />
          <View style={styles.divider} />
          <Stepper
            label="Month"
            value={month}
            display={MONTHS[month - 1].slice(0, 3)}
            onInc={incMonth}
            onDec={decMonth}
          />
          <View style={styles.divider} />
          <Stepper
            label="Year"
            value={year}
            display={String(year)}
            onInc={incYear}
            onDec={decYear}
          />
        </View>

        <Text style={styles.preview}>
          {`${MONTHS[month - 1]} ${clampedDay}, ${year}`}
        </Text>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={COLORS.errorRed} />
            <Text style={styles.error}> {error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Confirm — I am 18 or older</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.purplePrimary,
    justifyContent: 'center', alignItems: 'center', padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.backgroundWhite, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, width: '100%', maxWidth: 380,
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16,
    alignItems: 'center',
  },
  iconRow: { marginBottom: SPACING.md },
  heading: {
    fontSize: FONTS.h1.size, fontWeight: '800', color: COLORS.purplePrimary,
    marginBottom: SPACING.sm, textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.body.size, color: COLORS.textSecondary,
    marginBottom: SPACING.xl, textAlign: 'center', lineHeight: 22,
  },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', marginBottom: SPACING.lg,
  },
  divider: { width: 1, height: 80, backgroundColor: COLORS.borderLight, marginHorizontal: 4 },
  preview: {
    fontSize: 15, fontWeight: '600', color: COLORS.purplePrimary, marginBottom: SPACING.lg,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  error: { color: COLORS.errorRed, fontSize: FONTS.caption.size },
  button: {
    backgroundColor: COLORS.yellowAccent, paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.full,
    width: '100%', alignItems: 'center',
  },
  buttonText: { fontSize: FONTS.body.size, fontWeight: '800', color: COLORS.textPrimary },
});