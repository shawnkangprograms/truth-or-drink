import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack';
import { initDatabase } from './src/services/initDatabase';
import { SessionProvider } from './src/context/SessionContext';

ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('GLOBAL ERROR:', isFatal ? '[FATAL]' : '[NON-FATAL]', error);
});

export default function App() {
  useEffect(() => {
    initDatabase()
      .then(() => console.log('Database ready'))
      .catch(err => console.error('Database init failed:', err));
  }, []);

  return (
    <SessionProvider>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </SessionProvider>
  );
}