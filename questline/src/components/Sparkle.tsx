import React from 'react';
import { Text, TextStyle } from 'react-native';
import { T } from '../theme';

// The four-point sparkle mark — warm glow on black.
export default function Sparkle({
  size = 22,
  color = T.accent,
  glow = true,
  style,
}: {
  size?: number;
  color?: string;
  glow?: boolean;
  style?: TextStyle;
}) {
  return (
    <Text
      style={[
        {
          fontSize: size,
          color,
          lineHeight: size * 1.1,
          ...(glow
            ? {
                textShadowColor: color,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: size * 0.6,
              }
            : {}),
        },
        style,
      ]}
    >
      ✦
    </Text>
  );
}
