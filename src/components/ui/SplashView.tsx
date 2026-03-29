import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_FAMILIES } from '@/constants/fonts';
import { t } from '@/i18n';

export const SplashView = () => (
  <View style={styles.container}>
    <View style={styles.logoBox}>
      <Ionicons name="location" size={56} color="#FFFFFF" />
    </View>
    <Text style={styles.appName}>WildSpotter</Text>
    <Text style={styles.tagline}>{t('splash.tagline')}</Text>
    <Text style={styles.version}>v0.2.0</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#F7F3EE',
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 32,
    color: '#1C1410',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    color: '#6B5D4F',
    textAlign: 'center',
  },
  version: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    color: '#9C8E7E',
    position: 'absolute',
    bottom: 44,
  },
});
