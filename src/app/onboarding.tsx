import { useState, useRef, useCallback } from "react";
import {
	View,
	Text,
	Image,
	Pressable,
	Switch,
	FlatList,
	StyleSheet,
	useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useSettingsStore } from "@/stores/settings-store";
import { FONT_FAMILIES } from "@/constants/fonts";
import { SPACING, RADIUS } from "@/constants/theme";
import { t } from "@/i18n";

const ONBOARDING_KEY = "wildspotter_onboarding_complete";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appLogo = require("../../design/app-logo-1024.png") as number;

export const markOnboardingComplete = async () => {
	await AsyncStorage.setItem(ONBOARDING_KEY, "true");
};

export const isOnboardingComplete = async (): Promise<boolean> => {
	const value = await AsyncStorage.getItem(ONBOARDING_KEY);
	return value === "true";
};

const TOTAL_PAGES = 4;

type ThemeColors = ReturnType<typeof useThemeColors>;

const Dots = ({
	currentPage,
	colors,
}: {
	currentPage: number;
	colors: ThemeColors;
}) => (
	<View style={styles.dots}>
		{Array.from({ length: TOTAL_PAGES }).map((_, i) => (
			<View
				key={i}
				style={[
					styles.dot,
					{
						backgroundColor: i === currentPage ? colors.ACCENT : colors.BORDER,
					},
				]}
			/>
		))}
	</View>
);

const OnboardingScreen = () => {
	const colors = useThemeColors();
	const router = useRouter();
	const { width, height } = useWindowDimensions();
	const [currentPage, setCurrentPage] = useState(0);
	const flatListRef = useRef<FlatList>(null);

	const handleFinish = useCallback(async () => {
		await markOnboardingComplete();
		router.replace("/(tabs)/map");
	}, [router]);

	const handleNext = useCallback(() => {
		if (currentPage < TOTAL_PAGES - 1) {
			const nextPage = currentPage + 1;
			flatListRef.current?.scrollToIndex({ index: nextPage });
			setCurrentPage(nextPage);
		} else {
			void handleFinish();
		}
	}, [currentPage, handleFinish]);

	const pages = [
		<GetStartedPage
			key="getstarted"
			colors={colors}
			width={width}
			currentPage={0}
			onFinish={handleFinish}
			onNext={handleNext}
		/>,
		<DiscoverPage
			key="discover"
			colors={colors}
			width={width}
			currentPage={1}
			onNext={handleNext}
		/>,
		<HowItWorksPage
			key="howitworks"
			colors={colors}
			width={width}
			currentPage={2}
			onNext={handleNext}
		/>,
		<PrivacyPage
			key="privacy"
			colors={colors}
			width={width}
			currentPage={3}
			onFinish={handleFinish}
		/>,
	];

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: colors.BACKGROUND, width, height },
			]}
		>
			<FlatList
				ref={flatListRef}
				data={pages}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				scrollEventThrottle={16}
				style={{ width, height }}
				onMomentumScrollEnd={(e) => {
					const page = Math.round(e.nativeEvent.contentOffset.x / width);
					setCurrentPage(page);
				}}
				getItemLayout={(_, index) => ({
					length: width,
					offset: width * index,
					index,
				})}
				renderItem={({ item }) => (
					<View style={{ width, height, flexShrink: 0, flexGrow: 0 }}>
						{item}
					</View>
				)}
				keyExtractor={(_, i) => String(i)}
			/>
		</View>
	);
};

type PageProps = {
	colors: ThemeColors;
	width: number;
	currentPage: number;
};

const GetStartedPage = ({
	colors,
	currentPage,
	onFinish,
	onNext,
}: PageProps & { onFinish: () => void; onNext: () => void }) => (
	<View style={styles.page}>
		<View style={[styles.pageTop, { gap: 24 }]}>
			<Image source={appLogo} style={styles.logoImage} />
			<Text style={[styles.logoTitle, { color: colors.TEXT_PRIMARY }]}>
				{t("onboarding.getStartedTitle")}
			</Text>
			<Text style={[styles.logoSubtitle, { color: colors.TEXT_SECONDARY }]}>
				{t("onboarding.getStartedSubtitle")}
			</Text>
			<View style={styles.bullets}>
				{(["bullet1", "bullet2", "bullet3"] as const).map((key) => (
					<View key={key} style={styles.bulletRow}>
						<View
							style={[styles.bulletDot, { backgroundColor: colors.ACCENT }]}
						/>
						<Text style={[styles.bulletText, { color: colors.TEXT_SECONDARY }]}>
							{t(`onboarding.${key}`)}
						</Text>
					</View>
				))}
			</View>
		</View>
		<View style={styles.pageBottom}>
			<Dots currentPage={currentPage} colors={colors} />
			<Pressable
				style={[styles.nextButton, { backgroundColor: colors.ACCENT }]}
				onPress={onNext}
			>
				<Text style={styles.nextButtonText}>
					{t("onboarding.getStartedButton")}
				</Text>
			</Pressable>
			<Pressable onPress={onFinish}>
				<Text style={[styles.skipText, { color: colors.TEXT_MUTED }]}>
					{t("onboarding.skipLink")}
				</Text>
			</Pressable>
		</View>
	</View>
);

const DiscoverPage = ({
	colors,
	currentPage,
	onNext,
}: PageProps & { onNext: () => void }) => (
	<View style={styles.page}>
		<View style={styles.pageTop}>
			<View style={[styles.iconRing, { borderColor: colors.ACCENT + "20" }]}>
				<View
					style={[
						styles.iconRingInner,
						{ backgroundColor: colors.ACCENT + "15" },
					]}
				>
					<Image source={appLogo} style={styles.iconCircleImage} />
				</View>
			</View>
		</View>
		<View style={styles.pageBottom}>
			<Text style={[styles.pageTitle, { color: colors.TEXT_PRIMARY }]}>
				{t("onboarding.discoverTitle")}
			</Text>
			<Text style={[styles.pageBody, { color: colors.TEXT_SECONDARY }]}>
				{t("onboarding.discoverBody")}
			</Text>
			<Dots currentPage={currentPage} colors={colors} />
			<Pressable
				style={[styles.nextButton, { backgroundColor: colors.ACCENT }]}
				onPress={onNext}
			>
				<Text style={styles.nextButtonText}>{t("onboarding.nextButton")}</Text>
			</Pressable>
		</View>
	</View>
);

const StepRow = ({
	num,
	title,
	body,
	colors,
}: {
	num: number;
	title: string;
	body: string;
	colors: ThemeColors;
}) => (
	<View style={styles.stepRow}>
		<View style={[styles.stepCircle, { backgroundColor: colors.ACCENT }]}>
			<Text style={styles.stepNum}>{num}</Text>
		</View>
		<View style={styles.stepContent}>
			<Text style={[styles.stepTitle, { color: colors.TEXT_PRIMARY }]}>
				{title}
			</Text>
			<Text style={[styles.stepBody, { color: colors.TEXT_SECONDARY }]}>
				{body}
			</Text>
		</View>
	</View>
);

const STEPS: Array<{ titleKey: string; bodyKey: string }> = [
	{ titleKey: "onboarding.step1Title", bodyKey: "onboarding.step1Body" },
	{ titleKey: "onboarding.step2Title", bodyKey: "onboarding.step2Body" },
	{ titleKey: "onboarding.step3Title", bodyKey: "onboarding.step3Body" },
	{ titleKey: "onboarding.step4Title", bodyKey: "onboarding.step4Body" },
	{ titleKey: "onboarding.step5Title", bodyKey: "onboarding.step5Body" },
	{ titleKey: "onboarding.step6Title", bodyKey: "onboarding.step6Body" },
];

const HowItWorksPage = ({
	colors,
	currentPage,
	onNext,
}: PageProps & { onNext: () => void }) => (
	<View style={styles.page}>
		<View
			style={[
				styles.pageTop,
				{ justifyContent: "center", paddingHorizontal: 24 },
			]}
		>
			{STEPS.map((step, i) => (
				<StepRow
					key={i}
					num={i + 1}
					title={t(step.titleKey)}
					body={t(step.bodyKey)}
					colors={colors}
				/>
			))}
		</View>
		<View style={styles.pageBottom}>
			<Dots currentPage={currentPage} colors={colors} />
			<Pressable
				style={[styles.nextButton, { backgroundColor: colors.ACCENT }]}
				onPress={onNext}
			>
				<Text style={styles.nextButtonText}>{t("onboarding.nextButton")}</Text>
			</Pressable>
		</View>
	</View>
);

const PrivacyPage = ({
	colors,
	currentPage,
	onFinish,
}: PageProps & { onFinish: () => void }) => {
	const analyticsEnabled = useSettingsStore((s) => s.analyticsEnabled);
	const setAnalyticsEnabled = useSettingsStore((s) => s.setAnalyticsEnabled);

	return (
		<View style={styles.page}>
			<View style={[styles.pageTop, { paddingHorizontal: 32 }]}>
				<View
					style={[
						styles.iconRing,
						{
							borderColor: colors.ACCENT + "20",
							width: 110,
							height: 110,
							borderRadius: 55,
						},
					]}
				>
					<View
						style={[
							styles.iconRingInner,
							{
								backgroundColor: colors.ACCENT + "15",
								width: 80,
								height: 80,
								borderRadius: 40,
							},
						]}
					>
						<Ionicons
							name="shield-checkmark-outline"
							size={40}
							color={colors.ACCENT}
						/>
					</View>
				</View>
				<Text
					style={[
						styles.pageTitle,
						{ color: colors.TEXT_PRIMARY, marginTop: SPACING.LG },
					]}
				>
					{t("onboarding.analyticsTitle")}
				</Text>
				<Text style={[styles.pageBody, { color: colors.TEXT_SECONDARY }]}>
					{t("onboarding.analyticsBody")}
				</Text>
				<View
					style={[
						styles.privacyCard,
						{ backgroundColor: colors.CARD, borderColor: colors.BORDER },
					]}
				>
					<View style={styles.privacyRow}>
						<Ionicons
							name="checkmark-circle"
							size={18}
							color={colors.SCORE_HIGH}
							style={styles.privacyIcon}
						/>
						<Text
							style={[styles.privacyText, { color: colors.TEXT_SECONDARY }]}
						>
							{t("onboarding.analyticsCollect")}
						</Text>
					</View>
					<View style={styles.privacyRow}>
						<Ionicons
							name="lock-closed"
							size={18}
							color={colors.ACCENT}
							style={styles.privacyIcon}
						/>
						<Text
							style={[styles.privacyText, { color: colors.TEXT_SECONDARY }]}
						>
							{t("onboarding.analyticsNoCollect")}
						</Text>
					</View>
				</View>
				<View
					style={[
						styles.toggleRow,
						{ backgroundColor: colors.CARD, borderColor: colors.BORDER },
					]}
				>
					<View style={styles.toggleTextCol}>
						<Text
							style={[
								styles.toggleLabel,
								{ color: colors.TEXT_PRIMARY },
							]}
						>
							{t("onboarding.analyticsToggleLabel")}
						</Text>
						<Text
							style={[
								styles.toggleStatus,
								{
									color: analyticsEnabled
										? colors.SCORE_HIGH
										: colors.TEXT_MUTED,
								},
							]}
						>
							{analyticsEnabled
								? t("onboarding.analyticsToggleOn")
								: t("onboarding.analyticsToggleOff")}
						</Text>
					</View>
					<Switch
						value={analyticsEnabled}
						onValueChange={setAnalyticsEnabled}
						trackColor={{ false: colors.BORDER, true: colors.ACCENT }}
						thumbColor="#FFFFFF"
					/>
				</View>
			</View>
			<View style={styles.pageBottom}>
				<Dots currentPage={currentPage} colors={colors} />
				<Pressable
					style={[styles.nextButton, { backgroundColor: colors.ACCENT }]}
					onPress={onFinish}
				>
					<Text style={styles.nextButtonText}>{t("onboarding.letsGo")}</Text>
				</Pressable>
			</View>
		</View>
	);
};

export default OnboardingScreen;

const styles = StyleSheet.create({
	container: { flex: 1 },
	page: { flex: 1 },
	pageTop: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingHorizontal: 40,
		paddingTop: 100,
	},
	pageBottom: {
		alignItems: "center",
		gap: SPACING.MD,
		paddingHorizontal: 40,
		paddingBottom: 40,
	},
	pageTitle: {
		fontFamily: FONT_FAMILIES.BODY_BOLD,
		fontSize: 28,
		textAlign: "center",
	},
	pageBody: {
		fontFamily: FONT_FAMILIES.BODY,
		fontSize: 15,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: SPACING.SM,
	},
	iconRing: {
		width: 160,
		height: 160,
		borderRadius: 80,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	iconRingInner: {
		width: 120,
		height: 120,
		borderRadius: 60,
		alignItems: "center",
		justifyContent: "center",
	},
	iconCircleImage: {
		width: 64,
		height: 64,
		borderRadius: 14,
	},
	stepRow: {
		flexDirection: "row",
		gap: SPACING.MD,
		alignItems: "flex-start",
		marginBottom: SPACING.LG,
	},
	stepCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	stepNum: {
		fontFamily: FONT_FAMILIES.DATA_BOLD,
		fontSize: 16,
		color: "#FFFFFF",
	},
	stepContent: { flex: 1, gap: 4 },
	stepTitle: {
		fontFamily: FONT_FAMILIES.BODY_BOLD,
		fontSize: 16,
	},
	stepBody: {
		fontFamily: FONT_FAMILIES.BODY,
		fontSize: 13,
		lineHeight: 19,
	},
	logoImage: {
		width: 96,
		height: 96,
		borderRadius: 22,
	},
	logoTitle: {
		fontFamily: FONT_FAMILIES.DATA_BOLD,
		fontSize: 28,
	},
	logoSubtitle: {
		fontFamily: FONT_FAMILIES.BODY,
		fontSize: 15,
	},
	bullets: { gap: SPACING.SM, alignSelf: "flex-start" },
	bulletRow: { flexDirection: "row", alignItems: "center", gap: SPACING.SM },
	bulletDot: { width: 8, height: 8, borderRadius: 4 },
	bulletText: {
		fontFamily: FONT_FAMILIES.BODY,
		fontSize: 14,
	},
	dots: { flexDirection: "row", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	nextButton: {
		width: 260,
		height: 52,
		borderRadius: RADIUS.PILL,
		alignItems: "center",
		justifyContent: "center",
	},
	nextButtonText: {
		fontFamily: FONT_FAMILIES.BODY_BOLD,
		fontSize: 16,
		color: "#FFFFFF",
	},
	skipText: {
		fontFamily: FONT_FAMILIES.BODY,
		fontSize: 13,
		marginTop: SPACING.SM,
	},
	privacyCard: {
		width: "100%",
		borderRadius: RADIUS.MD,
		borderWidth: 1,
		padding: SPACING.MD,
		gap: SPACING.SM,
		marginTop: SPACING.MD,
	},
	privacyRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: SPACING.SM,
	},
	privacyIcon: {
		marginTop: 2,
	},
	privacyText: {
		fontFamily: FONT_FAMILIES.BODY,
		fontSize: 13,
		lineHeight: 19,
		flex: 1,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		borderRadius: RADIUS.MD,
		borderWidth: 1,
		padding: SPACING.MD,
		marginTop: SPACING.SM,
	},
	toggleTextCol: {
		flex: 1,
		gap: 2,
	},
	toggleLabel: {
		fontFamily: FONT_FAMILIES.BODY_BOLD,
		fontSize: 14,
	},
	toggleStatus: {
		fontFamily: FONT_FAMILIES.BODY,
		fontSize: 13,
	},
});
