import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import MainTabs from './MainTabs';
import GameStack from './GameStack';

const Stack = createStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Main" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="GameStack" 
        component={GameStack} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}