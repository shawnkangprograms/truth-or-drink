import { createStackNavigator } from '@react-navigation/stack';
import SetupScreen from '../screens/SetupScreen';
import GameScreen from '../screens/GameScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createStackNavigator();

export default function GameStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Setup" component={SetupScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
}