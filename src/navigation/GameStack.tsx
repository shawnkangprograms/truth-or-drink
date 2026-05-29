import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SetupScreen   from '../screens/SetupScreen';
import GameScreen    from '../screens/GameScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createStackNavigator();

// All three screens live in ONE stack so navigation.replace('Results') always works.
export default function GameStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Setup"   component={SetupScreen} />
      <Stack.Screen name="Game"    component={GameScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
}