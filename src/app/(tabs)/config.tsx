import { useState } from "react";
import {
	ScrollView,
	View,
	Text,
	Pressable,
	Modal,
	Switch,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, RADIUS } from "@/constants/theme";
import { FONT_FAMILIES } from "@/constants/fonts";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useSettingsStore } from "@/stores/settings-store";
import { setLocale, t } from "@/i18n";
import { CacheSection } from "@/components/config/CacheSection";
import { PreferencesSection } from "@/components/config/PreferencesSection";
import { AboutSection } from "@/components/config/AboutSection";
import type { ThemeMode } from "@/constants/theme";

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "es", label: "Español" },
] as const;

export const ConfigScreen = () => {
	const colors = useThemeColors();
	const language = useSettingsStore((s) => s.language);
	const setLanguage = useSettingsStore((s) => s.setLanguage);
	const theme = useSettingsStore((s) => s.theme);
	const setTheme = useSettingsStore((s) => s.setTheme);
	const analyticsEnabled = useSettingsStore((s) => s.analyticsEnabled);
	const setAnalyticsEnabled = useSettingsStore((s) => s.setAnalyticsEnabled);
	const [langModalVisible, setLangModalVisible] = useState(false);

	const handleLanguageChange = (code: string) => {
		setLanguage(code);
		setLocale(code as "en" | "es");
		setLangModalVisible(false);
	};

	const currentLangLabel =
		LANGUAGES.find((l) => l.code === language)?.label ?? "English";

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
			edges={["top"]}
		>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
					{t("config.settingsTitle")}
				</Text>

				<PreferencesSection />

				<LanguageRow
					label={currentLangLabel}
					colors={colors}
					onPress={() => setLangModalVisible(true)}
				/>

				<AppearanceSection theme={theme} onChangeTheme={setTheme} />

				<CacheSection />

				<PrivacySection
					enabled={analyticsEnabled}
					onChange={setAnalyticsEnabled}
				/>

				<AboutSection />
			</ScrollView>

			<LanguageModal
				visible={langModalVisible}
				currentCode={language}
				onSelect={handleLanguageChange}
				onClose={() => setLangModalVisible(false)}
			/>
		</SafeAreaView>
	);
};

export default ConfigScreen;

/* --- Language Row --- */

type LanguageRowProps = {
	label: string;
	colors: ReturnType<typeof useThemeColors>;
	onPress: () => void;
};

const LanguageRow = ({ label, colors, onPress }: LanguageRowProps) => (
	<View style={styles.section}>
		<Text style={[styles.sectionTitle, { color: colors.TEXT_MUTED }]}>
			{t("config.language")}
		</Text>
		<Pressable
			onPress={onPress}
			style={[styles.card, { backgroundColor: colors.CARD }]}
		>
			<View style={styles.row}>
				<Ionicons
					name="globe-outline"
					size={20}
					color={colors.TEXT_MUTED}
					style={styles.rowIcon}
				/>
				<Text style={[styles.rowLabel, { color: colors.TEXT_PRIMARY }]}>
					{label}
				</Text>
				<Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
			</View>
		</Pressable>
	</View>
);

/* --- Language Modal --- */

type LanguageModalProps = {
	visible: boolean;
	currentCode: string;
	onSelect: (code: string) => void;
	onClose: () => void;
};

const LanguageModal = ({
	visible,
	currentCode,
	onSelect,
	onClose,
}: LanguageModalProps) => {
	const colors = useThemeColors();
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable style={styles.modalOverlay} onPress={onClose}>
				<View style={[styles.modalCard, { backgroundColor: colors.CARD }]}>
					{LANGUAGES.map((lang) => {
						const isActive = lang.code === currentCode;
						return (
							<Pressable
								key={lang.code}
								onPress={() => onSelect(lang.code)}
								style={[
									styles.modalOption,
									isActive && { backgroundColor: colors.ACCENT + "1A" },
								]}
							>
								<Text
									style={[
										styles.modalOptionText,
										{ color: isActive ? colors.ACCENT : colors.TEXT_PRIMARY },
									]}
								>
									{lang.label}
								</Text>
								{isActive && (
									<Ionicons name="checkmark" size={18} color={colors.ACCENT} />
								)}
							</Pressable>
						);
					})}
				</View>
			</Pressable>
		</Modal>
	);
};

/* --- Appearance Section --- */

type AppearanceProps = {
	theme: ThemeMode;
	onChangeTheme: (mode: ThemeMode) => void;
};

const AppearanceSection = ({ theme, onChangeTheme }: AppearanceProps) => {
	const colors = useThemeColors();
	const modes: ThemeMode[] = ["light", "dark"];
	const labels: Record<ThemeMode, () => string> = {
		light: () => t("appearance.light"),
		dark: () => t("appearance.dark"),
	};

	return (
		<View style={styles.section}>
			<Text style={[styles.sectionTitle, { color: colors.TEXT_MUTED }]}>
				{t("appearance.title")}
			</Text>
			<View style={[styles.card, { backgroundColor: colors.CARD }]}>
				<View style={styles.row}>
					<Ionicons
						name="color-palette-outline"
						size={20}
						color={colors.TEXT_MUTED}
						style={styles.rowIcon}
					/>
					<Text style={[styles.rowLabel, { color: colors.TEXT_PRIMARY }]}>
						{t("config.theme")}
					</Text>
					<View style={[styles.pillGroup, { backgroundColor: colors.BORDER }]}>
						{modes.map((mode) => {
							const isActive = theme === mode;
							return (
								<Pressable
									key={mode}
									onPress={() => onChangeTheme(mode)}
									style={[
										styles.pill,
										isActive && { backgroundColor: colors.ACCENT },
									]}
								>
									<Ionicons
										name={mode === "light" ? "sunny" : "moon"}
										size={14}
										color={isActive ? colors.WHITE : colors.TEXT_MUTED}
										style={styles.pillIcon}
									/>
									<Text
										style={[
											styles.pillText,
											{
												color: isActive ? colors.WHITE : colors.TEXT_MUTED,
											},
										]}
									>
										{labels[mode]()}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>
			</View>
		</View>
	);
};

/* --- Privacy Section --- */

type PrivacyProps = {
	enabled: boolean;
	onChange: (value: boolean) => void;
};

const PrivacySection = ({ enabled, onChange }: PrivacyProps) => {
	const colors = useThemeColors();
	return (
		<View style={styles.section}>
			<Text style={[styles.sectionTitle, { color: colors.TEXT_MUTED }]}>
				{t("config.privacyTitle")}
			</Text>
			<View style={[styles.card, { backgroundColor: colors.CARD }]}>
				<View style={styles.row}>
					<Ionicons
						name="shield-checkmark-outline"
						size={20}
						color={colors.TEXT_MUTED}
						style={styles.rowIcon}
					/>
					<View style={{ flex: 1 }}>
						<Text style={[styles.rowLabel, { color: colors.TEXT_PRIMARY }]}>
							{t("config.analyticsLabel")}
						</Text>
						<Text
							style={{
								fontFamily: FONT_FAMILIES.BODY,
								fontSize: 12,
								color: colors.TEXT_MUTED,
								marginTop: 2,
							}}
						>
							{t("config.analyticsHint")}
						</Text>
					</View>
					<Switch
						value={enabled}
						onValueChange={onChange}
						trackColor={{ false: colors.BORDER, true: colors.ACCENT }}
					/>
				</View>
			</View>
		</View>
	);
};

/* --- Styles --- */

const styles = StyleSheet.create({
	container: { flex: 1 },
	scroll: { flex: 1 },
	content: { padding: SPACING.MD, paddingTop: SPACING.LG },
	title: {
		fontFamily: FONT_FAMILIES.BODY_BOLD,
		fontSize: 24,
		marginBottom: SPACING.LG,
	},
	section: { marginBottom: SPACING.LG },
	sectionTitle: {
		fontFamily: FONT_FAMILIES.DATA_BOLD,
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 2,
		marginBottom: SPACING.SM,
	},
	card: { borderRadius: RADIUS.MD, padding: SPACING.MD },
	row: {
		flexDirection: "row",
		alignItems: "center",
	},
	rowIcon: { marginRight: SPACING.SM + 4 },
	rowLabel: {
		flex: 1,
		fontFamily: FONT_FAMILIES.BODY_MEDIUM,
		fontSize: 15,
	},
	/* pill toggle */
	pillGroup: {
		flexDirection: "row",
		borderRadius: RADIUS.PILL,
		padding: 3,
	},
	pill: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: SPACING.SM + 4,
		paddingVertical: SPACING.XS + 2,
		borderRadius: RADIUS.PILL,
	},
	pillIcon: { marginRight: 4 },
	pillText: {
		fontFamily: FONT_FAMILIES.BODY_MEDIUM,
		fontSize: 13,
	},
	/* language modal */
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalCard: {
		width: 260,
		borderRadius: RADIUS.MD,
		paddingVertical: SPACING.SM,
		overflow: "hidden",
	},
	modalOption: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: SPACING.MD,
		paddingVertical: SPACING.SM + 4,
	},
	modalOptionText: {
		fontFamily: FONT_FAMILIES.BODY_MEDIUM,
		fontSize: 16,
	},
});
