import React from 'react';
import { Text, StyleSheet, Platform, Linking, TextStyle } from 'react-native';

const SITE = 'https://xaziss.netlify.app';

export function openLegal(page: 'privacy' | 'terms') {
  const path = `/${page}.html`;
  // Same window: in the Home Screen app a new window opens a separate browser,
  // where "Back to my agenda" would start a second copy of the app
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign(path);
  else Linking.openURL(`${SITE}${path}`);
}

/** "Privacy Policy · Terms of Use", or "By continuing you agree to…" when `agree` is set. */
export default function LegalLinks({ color, linkColor, font, agree, style }: {
  color: string; linkColor: string; font: string; agree?: boolean; style?: TextStyle;
}) {
  const link = (label: string, page: 'privacy' | 'terms') => (
    <Text style={[styles.link, { color: linkColor }]} onPress={() => openLegal(page)} accessibilityRole="link">{label}</Text>
  );
  return (
    <Text style={[styles.text, { color, fontFamily: font }, style]}>
      {agree ? <>By continuing you agree to the {link('Terms of Use', 'terms')} and {link('Privacy Policy', 'privacy')}.</>
        : <>{link('Privacy Policy', 'privacy')}  ·  {link('Terms of Use', 'terms')}</>}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  link: { textDecorationLine: 'underline' },
});
