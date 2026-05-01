import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/tokens';

export default function WelcomeScreen({ navigation }: any) {
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // Basic age validation – we'll replace with real date picker later
    if (!dob.trim()) {
      setError('Please enter your date of birth.');
      return;
    }
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (isNaN(age) || age < 18) {
      setError('You must be at least 18 years old to play.');
      return;
    }

    // Age verified – navigate to Home
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Age Verification</Text>
        <Text style={styles.subtitle}>
          You must be 18 or older to play. Please enter your date of birth.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={dob}
          onChangeText={setDob}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>I am 18 or older</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.purplePrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 360,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  heading: {
    fontSize: FONTS.h1.size,
    fontWeight: 'bold',
    color: COLORS.purplePrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.body.size,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONTS.body.size,
    marginBottom: SPACING.md,
    color: COLORS.textPrimary,
  },
  error: {
    color: COLORS.errorRed,
    fontSize: FONTS.caption.size,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.yellowAccent,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FONTS.body.size,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});