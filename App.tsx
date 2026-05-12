import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack';
import { initDatabase } from './src/services/initDatabase';

export default function App() {
  useEffect(() => {  
    initDatabase()
      .then(() => console.log('Database ready'))
      .catch(err => console.error('Database init failed:', err));
  }, []);

  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
