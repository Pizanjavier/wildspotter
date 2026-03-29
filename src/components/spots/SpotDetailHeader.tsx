import { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';
import type { AiDetails } from '@/services/api/types';

type SpotDetailHeaderProps = {
  onBack: () => void;
  onSave: () => void;
  isSaved: boolean;
  aiScore: number | null;
  aiDetails: AiDetails | null;
  satelliteImagePath: string | null;
  status: string;
};

type BadgeConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: 'SCORE_HIGH' | 'SCORE_LOW' | 'TEXT_SECONDARY';
};

const buildBadges = (
  aiScore: number | null,
  aiDetails: AiDetails | null,
  status: string,
): BadgeConfig[] => {
  const badges: BadgeConfig[] = [];
  const preAi = status === 'pending' || status === 'terrain_done' || status === 'legal_done';

  if (preAi || aiScore === null) {
    badges.push({
      label: t('ai.pending'),
      icon: 'hourglass-outline',
      colorKey: 'TEXT_SECONDARY',
    });
    return badges;
  }

  const passed = aiScore >= 60;
  badges.push({
    label: passed ? t('ai.verified') : t('ai.flagged'),
    icon: passed ? 'checkmark-circle-outline' : 'alert-circle-outline',
    colorKey: passed ? 'SCORE_HIGH' : 'SCORE_LOW',
  });

  if (aiDetails && aiDetails.van_presence > 0) {
    badges.push({
      label: t('ai.vansDetected'),
      icon: 'car-outline',
      colorKey: 'SCORE_HIGH',
    });
  }

  return badges;
};

export const SpotDetailHeader = ({
  onBack,
  onSave,
  isSaved,
  aiScore,
  aiDetails,
  satelliteImagePath,
  status,
}: SpotDetailHeaderProps) => {
  const colors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);
  const badges = buildBadges(aiScore, aiDetails, status);

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          {satelliteImagePath && (
            Platform.OS === 'web' ? (
              <img
                src={satelliteImagePath}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                alt="Satellite view fullscreen"
              />
            ) : (
              <Image
                source={{ uri: satelliteImagePath }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )
          )}
        </View>
      </Modal>

      <Pressable
        onPress={() => satelliteImagePath ? setModalVisible(true) : undefined}
        style={[styles.imageWrapper, { backgroundColor: colors.CARD }]}
      >
        {satelliteImagePath ? (
          Platform.OS === 'web' ? (
            <img
              src={satelliteImagePath}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              alt="Satellite view"
            />
          ) : (
            <Image
              source={{ uri: satelliteImagePath }}
              style={styles.satelliteImage}
              resizeMode="cover"
            />
          )
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.CARD }]} />
        )}
      </Pressable>

      <View style={styles.navBar}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.ACCENT} />
          <Text style={[styles.backText, { color: colors.ACCENT }]}>
            {t('spotDetail.back')}
          </Text>
        </Pressable>
        <Pressable onPress={onSave} style={styles.saveButton} hitSlop={8}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.ACCENT : colors.TEXT_MUTED}
          />
        </Pressable>
      </View>

      <View style={styles.badgeRow}>
        {badges.map((badge) => {
          const badgeColor = colors[badge.colorKey];
          return (
            <View
              key={badge.label}
              style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.65)', borderColor: badgeColor }]}
            >
              <Ionicons name={badge.icon} size={12} color={badgeColor} />
              <Text style={[styles.badgeText, { color: badgeColor }]}>
                {badge.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  imageWrapper: {
    height: 220,
  },
  satelliteImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
  },
  navBar: {
    position: 'absolute',
    top: SPACING.XL + SPACING.SM,
    left: SPACING.MD,
    right: SPACING.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: RADIUS.PILL,
    paddingVertical: SPACING.XS + 2,
    paddingHorizontal: SPACING.SM + 4,
  },
  backText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: SPACING.SM,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: SPACING.XL * 2,
    right: SPACING.MD,
    zIndex: 20,
    padding: SPACING.SM,
  },
  fullscreenImage: {
    width: '100%', height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    bottom: SPACING.SM,
    right: SPACING.MD,
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.PILL,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
