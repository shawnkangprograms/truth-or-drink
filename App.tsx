import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack';

import { isPro } from './src/services/proGate';
import { FREE_LIMITS, PRO_LIMITS } from './src/config/limits';

// inside your component (e.g., before return)
console.log('Is Pro?', isPro());
console.log('Free limits:', FREE_LIMITS);

export default function App() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
