import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { openNavigate, openInspect } from '@/services/navigation';
import { trackEvent } from '@/services/analytics';
import { t } from '@/i18n';

type GoogleMapsModalProps = {
  visible: boolean;
  lat: number;
  lon: number;
  onClose: () => void;
};

export const GoogleMapsModal = ({ visible, lat, lon, onClose }: GoogleMapsModalProps) => {
  const colors = useThemeColors();

  const handleInspect = () => {
    onClose();
    trackEvent('spot_inspected', { lat, lon });
    openInspect(lat, lon);
  };

  const handleNavigate = () => {
    onClose();
    trackEvent('spot_navigated', { lat, lon });
    openNavigate(lat, lon);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[styles.content, { backgroundColor: colors.CARD }]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
            Google Maps
          </Text>

          <Pressable
            style={[styles.option, { borderColor: colors.BORDER }]}
            onPress={handleInspect}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${colors.ACCENT}15` }]}>
              <Ionicons name="eye-outline" size={22} color={colors.ACCENT} />
            </View>
            <View style={styles.optionTextCol}>
              <Text style={[styles.optionTitle, { color: colors.TEXT_PRIMARY }]}>
                {t('spotDetail.inspect')}
              </Text>
              <Text style={[styles.optionDesc, { color: colors.TEXT_SECONDARY }]}>
                {t('spotDetail.inspectDesc')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
          </Pressable>

          <Pressable
            style={[styles.option, { borderColor: colors.BORDER }]}
            onPress={handleNavigate}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${colors.ACCENT}15` }]}>
              <Ionicons name="navigate-outline" size={22} color={colors.ACCENT} />
            </View>
            <View style={styles.optionTextCol}>
              <Text style={[styles.optionTitle, { color: colors.TEXT_PRIMARY }]}>
                {t('spotDetail.navigate')}
              </Text>
              <Text style={[styles.optionDesc, { color: colors.TEXT_SECONDARY }]}>
                {t('spotDetail.navigateDesc')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  content: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: SPACING.LG,
    gap: 12,
  },
  title: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 14,
  },
  optionDesc: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
  },
});
