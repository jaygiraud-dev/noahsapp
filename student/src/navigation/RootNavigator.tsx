import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';
import SignInScreen from '../screens/Auth/SignInScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import SchoolPickerScreen from '../screens/Onboarding/SchoolPickerScreen';
import ClassesScreen from '../screens/Onboarding/ClassesScreen';
import ParentPairScreen from '../screens/Onboarding/ParentPairScreen';
import MainTabNavigator from './MainTabNavigator';
import ParentDashboardScreen from '../screens/Parent/ParentDashboardScreen';
import ParentActivityScreen from '../screens/Parent/ParentActivityScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const phase = useStore((s) => s.phase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

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
        {phase === 'auth' && (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
        {phase === 'onboarding' && (
          <>
            <Stack.Screen name="Classes" component={ClassesScreen} />
            <Stack.Screen name="ParentPair" component={ParentPairScreen} />
            <Stack.Screen name="SchoolPicker" component={SchoolPickerScreen} />
          </>
        )}
        {phase === 'main' && (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
        {phase === 'parent' && (
          <>
            <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
            <Stack.Screen name="ParentActivity" component={ParentActivityScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
