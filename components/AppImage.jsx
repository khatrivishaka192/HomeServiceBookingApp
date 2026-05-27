import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/appTheme';
import { DEFAULT_SERVICE_IMAGE } from '../constants/images';

export default function AppImage({ uri, style, contentFit = 'cover', fallbackUri = DEFAULT_SERVICE_IMAGE }) {
  const [sourceUri, setSourceUri] = useState(uri || fallbackUri);

  useEffect(() => {
    setSourceUri(uri || fallbackUri);
  }, [uri, fallbackUri]);

  // If uri is a string (remote URL), wrap it in an object with a uri key. Otherwise, pass it directly (for local required assets).
  const imageSource = typeof sourceUri === 'string' ? { uri: sourceUri } : sourceUri;

  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={250}
        placeholder={{ color: COLORS.primaryLight }}
        onError={() => {
          if (sourceUri !== fallbackUri) {
            setSourceUri(fallbackUri);
          }
        }}
      />
      {!sourceUri ? (
        <View style={styles.iconFallback}>
          <Ionicons name="image-outline" size={28} color={COLORS.mutedIcon} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: COLORS.primaryLight,
  },
  iconFallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
