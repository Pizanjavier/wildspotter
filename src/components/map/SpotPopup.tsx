import {
	View,
	Text,
	Image,
	Platform,
	Pressable,
	StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SPACING, RADIUS } from "@/constants/theme";
import { FONT_FAMILIES } from "@/constants/fonts";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getScoreColor } from "@/components/spots/ScoreBadge";
import { getOvernightLevel } from "@/utils/legal-verdict";
import { getSpotDisplayName } from "@/utils/spot-display-name";
import { buildSatelliteUrl } from "@/services/api";
import { hapticSelection } from "@/utils/haptics";
import { t } from "@/i18n";
import type { ThemeColors } from "@/constants/theme";
import type { ContextDetails, LegalStatus } from "@/services/api/types";

type HighlightChip = {
	label: string;
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const extractHighlights = (ctx: ContextDetails | null): HighlightChip[] => {
	if (!ctx) return [];
	const chips: HighlightChip[] = [];

	if (ctx.scenic_value?.score > 0) {
		const features = ctx.scenic_value.features ?? [];
		if (features.includes("beach_nearby")) chips.push({ label: t("highlights.beachNearby"), icon: "weather-sunset-up" });
		else if (features.includes("viewpoint_nearby")) chips.push({ label: t("highlights.viewpoint"), icon: "binoculars" });
		else if (features.includes("water_nearby")) chips.push({ label: t("highlights.waterNearby"), icon: "waves" });
	}
	if (ctx.privacy?.score > 0 && ctx.privacy.is_dead_end) {
		chips.push({ label: t("highlights.deadEnd"), icon: "shield-lock-outline" });
	}
	if (ctx.van_community?.score > 0) {
		chips.push({ label: t("highlights.vanCommunity"), icon: "caravan" });
	}
	if (ctx.drinking_water && ctx.drinking_water.score > 0) {
		chips.push({ label: t("highlights.water"), icon: "cup-water" });
	}
	if (ctx.dog_friendly && ctx.dog_friendly.score > 0) {
		chips.push({ label: t("highlights.dogFriendly"), icon: "paw" });
	}

	return chips.slice(0, 3);
};

export type SpotPopupProps = {
	name: string | null;
	score: number | null;
	surface: string;
	province: string | null;
	slopePct: number | null;
	satelliteImagePath: string | null;
	legalStatus: LegalStatus | null;
	spotType: string | null;
	contextDetails: ContextDetails | null;
	onPress: () => void;
};

type LegalIndicator = { color: string; icon: string } | null;

const getLegalIndicator = (
	legalStatus: LegalStatus | null,
	colors: ThemeColors,
): LegalIndicator => {
	const level = getOvernightLevel(legalStatus);
	if (level === "prohibited") return { color: colors.DANGER, icon: "X" };
	if (level === "restricted") return { color: colors.SCORE_LOW, icon: "!" };
	return null;
};

export const SpotPopup = ({
	name,
	score,
	surface,
	province,
	slopePct,
	satelliteImagePath,
	legalStatus,
	spotType,
	contextDetails,
	onPress,
}: SpotPopupProps) => {
	const colors = useThemeColors();
	const scoreColor = getScoreColor(score, colors);
	const legal = getLegalIndicator(legalStatus, colors);
	const highlights = extractHighlights(contextDetails);
	const displayName = getSpotDisplayName({
		name,
		spot_type: spotType,
		surface_type: surface,
	});
	const hasThumbnail = !!satelliteImagePath;
	const thumbnailUri = satelliteImagePath
		? buildSatelliteUrl(satelliteImagePath)
		: undefined;

	const handlePress = () => {
		hapticSelection();
		onPress();
	};

	const content = (
		<>
			<View
				style={[
					styles.card,
					{ backgroundColor: colors.CARD, borderColor: colors.BORDER },
					legal !== null && {
						borderLeftWidth: 3,
						borderLeftColor: legal.color,
					},
				]}
			>
				<View style={styles.thumbnailContainer}>
					{hasThumbnail ? (
						Platform.OS === "web" ? (
							<View
								style={[
									styles.thumbnail,
									{ backgroundColor: colors.CARD_SURFACE },
								]}
							>
								<Image
									source={{ uri: thumbnailUri }}
									style={styles.thumbnailImage}
									resizeMode="cover"
								/>
							</View>
						) : (
							<Image
								source={{ uri: thumbnailUri }}
								style={[
									styles.thumbnail,
									{ backgroundColor: colors.CARD_SURFACE },
								]}
								resizeMode="cover"
							/>
						)
					) : (
						<View style={[styles.thumbnail, { backgroundColor: scoreColor }]}>
							<Text style={styles.placeholderScore}>
								{score !== null ? String(Math.round(score)) : "--"}
							</Text>
						</View>
					)}
					{hasThumbnail && (
						<View
							style={[styles.scoreDotOverlay, { backgroundColor: scoreColor }]}
						>
							<Text style={styles.scoreText}>
								{score !== null ? String(Math.round(score)) : "--"}
							</Text>
						</View>
					)}
				</View>

				<View style={styles.textArea}>
					<View style={styles.nameRow}>
						<Text
							style={[styles.name, { color: colors.TEXT_PRIMARY }]}
							numberOfLines={1}
						>
							{displayName}
						</Text>
						{legal && (
							<Text style={[styles.legalIcon, { color: legal.color }]}>
								{legal.icon}
							</Text>
						)}
					</View>
					{province ? (
						<Text
							style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}
							numberOfLines={1}
						>
							{province}
						</Text>
					) : null}
					{slopePct !== null && slopePct !== undefined && (
						<Text style={[styles.details, { color: colors.TEXT_MUTED }]}>
							{t("spots.slope", { value: slopePct.toFixed(1) })}
						</Text>
					)}
					{highlights.length > 0 && (
						<View style={styles.chipsRow}>
							{highlights.map((h) => (
								<View key={h.label} style={styles.chipRow}>
									<MaterialCommunityIcons name={h.icon} size={11} color={colors.ACCENT} />
									<Text style={[styles.chip, { color: colors.ACCENT }]}>
										{h.label}
									</Text>
								</View>
							))}
						</View>
					)}
				</View>
				<View style={[styles.detailBtn, { backgroundColor: colors.ACCENT }]}>
					<Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
				</View>
			</View>
			<View style={[styles.arrow, { borderTopColor: colors.CARD }]} />
		</>
	);

	if (Platform.OS === "web") {
		return (
			<Pressable onPress={handlePress} style={styles.wrapper}>
				{content}
			</Pressable>
		);
	}

	return <View style={styles.wrapper}>{content}</View>;
};

const styles = StyleSheet.create({
	wrapper: {
		width: 260,
		alignItems: "center",
	},
	card: {
		width: 260,
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: SPACING.SM,
		paddingRight: 12,
		paddingVertical: SPACING.SM,
		borderRadius: RADIUS.MD,
		borderWidth: 1,
		gap: SPACING.SM,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	thumbnailContainer: {
		position: "relative",
		width: 56,
		height: 56,
	},
	thumbnail: {
		width: 56,
		height: 56,
		borderRadius: RADIUS.SM,
		overflow: "hidden",
		alignItems: "center",
		justifyContent: "center",
	},
	thumbnailImage: {
		width: 56,
		height: 56,
	},
	placeholderScore: {
		fontFamily: FONT_FAMILIES.DATA_BOLD,
		fontSize: 14,
		color: "#FFFFFF",
	},
	scoreDotOverlay: {
		position: "absolute",
		bottom: -2,
		right: -2,
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: "center",
		justifyContent: "center",
	},
	scoreText: {
		fontFamily: FONT_FAMILIES.DATA_BOLD,
		fontSize: 9,
		color: "#FFFFFF",
	},
	textArea: {
		flex: 1,
		gap: 2,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	name: {
		fontFamily: FONT_FAMILIES.BODY_BOLD,
		fontSize: 14,
		flexShrink: 1,
	},
	legalIcon: {
		fontFamily: FONT_FAMILIES.DATA,
		fontSize: 13,
	},
	subtitle: {
		fontFamily: FONT_FAMILIES.BODY,
		fontSize: 12,
	},
	details: {
		fontFamily: FONT_FAMILIES.DATA,
		fontSize: 11,
	},
	chipsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 4,
		marginTop: 2,
	},
	chipRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
	},
	chip: {
		fontFamily: FONT_FAMILIES.DATA,
		fontSize: 10,
	},
	detailBtn: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "center",
	},
	arrow: {
		width: 0,
		height: 0,
		borderLeftWidth: 8,
		borderRightWidth: 8,
		borderTopWidth: 8,
		borderLeftColor: "transparent",
		borderRightColor: "transparent",
		marginTop: -1,
	},
});
