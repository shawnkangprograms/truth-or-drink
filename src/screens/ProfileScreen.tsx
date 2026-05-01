import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/tokens';

export default function ProfileScreen({ navigation }: any) {
  const isSignedIn = false; // placeholder; will come from AuthContext

  return (
    <View style={styles.container}>
      {isSignedIn ? (
        <View style={styles.signedIn}>
          <Text style={styles.heading}>Your Sessions</Text>
          <View style={styles.historyPlaceholder}>
            <Text style={styles.historyText}>No sessions yet. Play a game to see your history.</Text>
          </View>
          <TouchableOpacity style={styles.restoreButton}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.guest}>
          <Text style={styles.heading}>Profile</Text>
          <Text style={styles.guestMessage}>Sign in to save your session history across devices.</Text>
          <TouchableOpacity style={styles.signInButton}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundWhite,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  guest: {
    alignItems: 'center',
  },
  signedIn: {
    flex: 1,
  },
  heading: {
    fontSize: FONTS.h1.size,
    fontWeight: 'bold',
    color: COLORS.purplePrimary,
    marginBottom: SPACING.md,
  },
  guestMessage: {
    fontSize: FONTS.body.size,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  signInButton: {
    backgroundColor: COLORS.purplePrimary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  signInText: {
    color: COLORS.backgroundWhite,
    fontWeight: 'bold',
    fontSize: FONTS.body.size,
  },
  continueButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
  },
  continueText: {
    color: COLORS.purplePrimary,
    fontWeight: 'bold',
    fontSize: FONTS.body.size,
  },
  historyPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.body.size,
  },
  restoreButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  restoreText: {
    color: COLORS.purplePrimary,
    fontSize: FONTS.body.size,
    fontWeight: 'bold',
  },
});