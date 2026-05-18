import { View, Text, Pressable, Image, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSpotsStore } from '@/stores/spots-store';
import { getScoreColor } from '@/components/spots/ScoreBadge';
import { getOvernightLevel } from '@/utils/legal-verdict';
import { getSpotDisplayName, getTranslatedSurface } from '@/utils/spot-display-name';
import { buildSatelliteUrl } from '@/services/api';
import type { SpotSummary } from '@/services/api/types';
import type { ThemeColors } from '@/constants/theme';
import { useSpotNavigation } from '@/hooks/useSpotNavigation';
import { hapticSelection } from '@/utils/haptics';
import { t } from '@/i18n';

type SpotCardProps = {
  spot: SpotSummary;
  onFocus?: (spot: SpotSummary) => void;
  onShowOnMap?: (spot: SpotSummary) => void;
  isFocused?: boolean;
};

type LegalIndicator = { color: string; icon: string } | null;

const getLegalIndicator = (spot: SpotSummary, colors: ThemeColors): LegalIndicator => {
  const level = getOvernightLevel(spot.legal_status);
  if (level === 'prohibited') return { color: colors.DANGER, icon: 'X' };
  if (level === 'restricted') return { color: colors.SCORE_LOW, icon: '!' };
  return null;
};

const formatDetailsLine = (spot: SpotSummary): string => {
  const parts: string[] = [];
  const surfaceLabel = getTranslatedSurface(spot.surface_type);
  if (surfaceLabel) parts.push(surfaceLabel);
  if (spot.slope_pct !== null) parts.push(t('spots.slope', { value: spot.slope_pct.toFixed(1) }));
  return parts.join(' · ');
};

export const SpotCard = ({ spot, onFocus, onShowOnMap, isFocused }: SpotCardProps) => {
  const colors = useThemeColors();
  const score = spot.composite_score ?? null;
  const { navigateToSpot } = useSpotNavigation();
  const isSaved = useSpotsStore((s) => s.isSaved(spot.id));

  const handlePress = () => {
    hapticSelection();
    if (onFocus) {
      if (isFocused) {
        navigateToSpot(spot.id);
      } else {
        onFocus(spot);
      }
    } else {
      navigateToSpot(spot.id);
    }
  };

  const handleDetailPress = () => {
    hapticSelection();
    navigateToSpot(spot.id);
  };

  const scoreColor = getScoreColor(score, colors);
  const legal = getLegalIndicator(spot, colors);
  const detailsLine = formatDetailsLine(spot);
  const imageUrl = spot.satellite_image_path
    ? buildSatelliteUrl(spot.satellite_image_path)
    : null;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { borderBottomColor: colors.BORDER },
        legal !== null && { borderLeftWidth: 3, borderLeftColor: legal.color },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.thumbnailWrapper}>
        {imageUrl ? (
          Platform.OS === 'web' ? (
            <View style={[styles.thumbnail, { backgroundColor: colors.CARD }]}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.thumbnail, { backgroundColor: colors.CARD }]}
              resizeMode="cover"
            />
          )
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: scoreColor }]}>
            <Text style={styles.placeholderScore}>
              {score !== null ? String(Math.round(score)) : '--'}
            </Text>
          </View>
        )}
        {imageUrl && (
          <View style={[styles.miniBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.miniBadgeText}>
              {score !== null ? String(Math.round(score)) : '--'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.textArea}>
        <View style={styles.nameRow}>
          {isSaved && (
            <Ionicons name="bookmark" size={14} color={colors.ACCENT} />
          )}
          <Text style={[styles.name, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
            {getSpotDisplayName(spot)}
          </Text>
          {legal && (
            <Text style={[styles.legalIcon, { color: legal.color }]}>
              {legal.icon}
            </Text>
          )}
        </View>
        {spot.province ? (
          <Text
            style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}
            numberOfLines={1}
          >
            {spot.province}
          </Text>
        ) : null}
        {detailsLine ? (
          <Text
            style={[styles.details, { color: colors.TEXT_MUTED }]}
            numberOfLines={1}
          >
            {detailsLine}
          </Text>
        ) : null}
      </View>
      {onShowOnMap && (
        <Pressable
          onPress={() => { hapticSelection(); onShowOnMap(spot); }}
          hitSlop={8}
          style={styles.mapBtn}
        >
          <Ionicons name="map-outline" size={16} color={colors.ACCENT} />
        </Pressable>
      )}
      {onFocus ? (
        <Pressable onPress={handleDetailPress} hitSlop={8} style={styles.detailBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
      )}
      {isFocused && (
        <View style={[styles.focusedOverlay, { backgroundColor: colors.ACCENT }]}>
          <Text style={styles.focusedText}>
            {t('spots.tapAgainForDetail')}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.MD,
  },
  pressed: {
    opacity: 0.7,
  },
  thumbnailWrapper: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.SM,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImage: {
    width: 48,
    height: 48,
  },
  placeholderScore: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 14,
    color: '#FFFFFF',
  },
  miniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBadgeText: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 9,
    color: '#FFFFFF',
  },
  textArea: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
    flexShrink: 1,
  },
  legalIcon: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 13,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
  },
  details: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 12,
  },
  mapBtn: {
    padding: SPACING.XS,
  },
  detailBtn: {
    padding: SPACING.XS,
  },
  focusedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: 0.92,
    borderRadius: RADIUS.SM,
  },
  focusedText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
