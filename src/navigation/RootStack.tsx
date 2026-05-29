import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import MainTabs from './MainTabs';
import GameStack from './GameStack';
import { COLORS } from '../utils/tokens';

const Stack = createStackNavigator();

function LoadingScreen() {
  const barWidth = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: 1, duration: 1400,
      easing: Easing.out(Easing.quad), useNativeDriver: false,
    }).start();
  }, []);
  return (
    <View style={s.container}>
      <Text style={s.logo}>Bambika</Text>
      <View style={s.track}>
        <Animated.View
          style={[s.bar, {
            width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.purplePrimary, alignItems: 'center', justifyContent: 'center', gap: 32 },
  logo: { fontSize: 52, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 },
  track: { width: 200, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  bar: { height: 4, backgroundColor: '#FFFFFF', borderRadius: 2 },
});

export default function RootStack() {
  const [route, setRoute] = useState<'Welcome' | 'Main' | '__loading__' | null>(null);

  useEffect(() => {
    let verified = false;
    try {
      const { storage } = require('../services/storage');
      verified = storage.getBoolean('age_verified') === true;
    } catch (_) {}

    if (verified) {
      setRoute('__loading__');
      setTimeout(() => setRoute('Main'), 1500);
    } else {
      setRoute('Welcome');
    }
  }, []);

  if (route === null) return null;
  if (route === '__loading__') return <LoadingScreen />;

  return (
    <Stack.Navigator
      initialRouteName={route}
      screenOptions={{ headerShown: false, animationEnabled: true }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      {/* GameFlow slides up over MainTabs — fullScreenModal keeps it opaque */}
      <Stack.Screen
        name="GameFlow"
        component={GameStack}
        options={{ presentation: 'fullScreenModal', animationEnabled: true }}
      />
    </Stack.Navigator>
  );
}