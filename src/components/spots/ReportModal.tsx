import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { reportSpot, ApiError } from '@/services/api';
import type { ReportCategory } from '@/services/api';
import { t } from '@/i18n';

type ReportModalProps = {
  visible: boolean;
  spotId: string;
  onClose: () => void;
};

const CATEGORIES: { key: ReportCategory; labelKey: string }[] = [
  { key: 'incorrect_legal', labelKey: 'spotDetail.reportIncorrectLegal' },
  { key: 'not_accessible', labelKey: 'spotDetail.reportNotAccessible' },
  { key: 'private_property', labelKey: 'spotDetail.reportPrivateProperty' },
  { key: 'score_too_high', labelKey: 'spotDetail.reportScoreTooHigh' },
  { key: 'score_too_low', labelKey: 'spotDetail.reportScoreTooLow' },
  { key: 'other', labelKey: 'spotDetail.reportOther' },
];

export const ReportModal = ({ visible, spotId, onClose }: ReportModalProps) => {
  const colors = useThemeColors();
  const [selected, setSelected] = useState<ReportCategory | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await reportSpot(spotId, selected, comment || undefined);
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError ? err.message : t('spotDetail.reportError');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelected(null);
    setComment('');
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.CARD }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
            {t('spotDetail.reportTitle')}
          </Text>

          {submitted ? (
            <View style={styles.thankYou}>
              <Ionicons name="checkmark-circle" size={40} color={colors.SCORE_HIGH} />
              <Text style={[styles.thanksText, { color: colors.TEXT_PRIMARY }]}>
                {t('spotDetail.reportThanks')}
              </Text>
            </View>
          ) : (
            <>
              {CATEGORIES.map(({ key, labelKey }) => (
                <Pressable
                  key={key}
                  style={[
                    styles.option,
                    { borderColor: colors.BORDER },
                    selected === key && { borderColor: colors.ACCENT },
                  ]}
                  onPress={() => setSelected(key)}
                >
                  <Ionicons
                    name={selected === key ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected === key ? colors.ACCENT : colors.TEXT_MUTED}
                  />
                  <Text style={[styles.optionText, { color: colors.TEXT_PRIMARY }]}>
                    {t(labelKey)}
                  </Text>
                </Pressable>
              ))}

              <TextInput
                style={[
                  styles.input,
                  { color: colors.TEXT_PRIMARY, borderColor: colors.BORDER },
                ]}
                placeholder={t('spotDetail.reportCommentPlaceholder')}
                placeholderTextColor={colors.TEXT_MUTED}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={2000}
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.DANGER }]}>
                  {error}
                </Text>
              ) : null}

              <Pressable
                style={[
                  styles.submitBtn,
                  { backgroundColor: selected ? colors.ACCENT : colors.BORDER },
                ]}
                onPress={handleSubmit}
                disabled={!selected || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.BLACK} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.BLACK }]}>
                    {t('spotDetail.reportSubmit')}
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: SPACING.LG,
    gap: SPACING.SM,
    paddingBottom: SPACING.XL,
  },
  title: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 18,
    marginBottom: SPACING.SM,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderWidth: 1,
    borderRadius: 8,
  },
  optionText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.MD,
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: SPACING.SM,
  },
  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    marginTop: SPACING.SM,
  },
  submitText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 15,
  },
  thankYou: {
    alignItems: 'center',
    gap: SPACING.MD,
    paddingVertical: SPACING.XL,
  },
  thanksText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 16,
  },
  errorText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
  },
});
