import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';
import SignInScreen from '../screens/Auth/SignInScreen';
import ConfirmEmailScreen from '../screens/Auth/ConfirmEmailScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import SchoolPickerScreen from '../screens/Onboarding/SchoolPickerScreen';
import ClassesScreen from '../screens/Onboarding/ClassesScreen';
import ParentPairScreen from '../screens/Onboarding/ParentPairScreen';
import TimetableScreen from '../screens/Onboarding/TimetableScreen';
import MainTabNavigator from './MainTabNavigator';
import ParentDashboardScreen from '../screens/Parent/ParentDashboardScreen';
import ParentKidScreen from '../screens/Parent/ParentKidScreen';
import ParentActivityScreen from '../screens/Parent/ParentActivityScreen';
import ParentSettingsScreen from '../screens/Parent/ParentSettingsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const phase = useStore((s) => s.phase);
  const passwordRecovery = useStore((s) => s.passwordRecovery);
  const onboardingStart = useStore((s) => s.onboardingStart);
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
          passwordRecovery ? (
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          ) : (
            <>
              <Stack.Screen name="SignIn" component={SignInScreen} />
              <Stack.Screen name="ConfirmEmail" component={ConfirmEmailScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          )
        )}
        {phase === 'onboarding' && (
          onboardingStart === 'Classes' ? (
            <>
              <Stack.Screen name="Classes" component={ClassesScreen} />
              <Stack.Screen name="Timetable" component={TimetableScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="SchoolPicker" component={SchoolPickerScreen} />
              <Stack.Screen name="Classes" component={ClassesScreen} />
              <Stack.Screen name="Timetable" component={TimetableScreen} />
              <Stack.Screen name="ParentPair" component={ParentPairScreen} />
            </>
          )
        )}
        {phase === 'main' && (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
        {phase === 'parent' && (
          <>
            <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
            <Stack.Screen name="ParentKid" component={ParentKidScreen} />
            <Stack.Screen name="ParentActivity" component={ParentActivityScreen} />
            <Stack.Screen name="ParentSettings" component={ParentSettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
