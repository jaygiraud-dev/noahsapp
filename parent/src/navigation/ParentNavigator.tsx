import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useParentStore } from '../store/useParentStore';
import { makeTheme } from '../theme';
import PairScreen from '../screens/PairScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ActivityScreen from '../screens/ActivityScreen';

const Stack = createNativeStackNavigator();

export default function ParentNavigator() {
  const phase = useParentStore((s) => s.phase);
  const theme = makeTheme('twilight', true);

  return (
    <NavigationContainer
      theme={{
        dark: theme.dark,
        colors: {
          primary: theme.accent,
          background: theme.bg,
          card: theme.surface,
          text: theme.ink,
          border: theme.line,
          notification: theme.magenta,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {phase === 'pair' ? (
          <Stack.Screen name="Pair" component={PairScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Activity" component={ActivityScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
