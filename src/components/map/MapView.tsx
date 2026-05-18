import { useEffect, useRef, useCallback, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import {
	View,
	Text,
	Image,
	StyleSheet,
	PixelRatio,
} from "react-native";
import { router } from "expo-router";
import { captureRef } from "react-native-view-shot";
import {
	MapView as MLMapView,
	Camera,
	ShapeSource,
	VectorSource,
	CircleLayer,
	SymbolLayer,
	FillLayer,
	LineLayer,
	Images,
	type MapViewRef,
	type CameraRef,
	type RegionPayload,
} from "@maplibre/maplibre-react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from "@/constants/theme";
import { FONT_FAMILIES } from "@/constants/fonts";
import { API_BASE_URL } from "@/constants/config";
import { useMapStore } from "@/stores/map-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useSpotsStore } from "@/stores/spots-store";
import { useThemeColors } from "@/hooks/useThemeColors";
import { t } from "@/i18n";
import { getMapStyle } from "@/components/map/map-style";
import { SpotPopup } from "@/components/map/SpotPopup";
import { buildSatelliteUrl } from "@/services/api";
import { hapticSelection } from "@/utils/haptics";
import type { SpotSummary } from "@/services/api/types";
import { getOvernightLevel } from "@/utils/legal-verdict";
import type { OvernightLevel } from "@/utils/legal-verdict";
import { LegalLegend } from "@/components/map/LegalLegend";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bookmarkIcon = require("@/../assets/map/bookmark-saved.png");
const MAP_IMAGES = { "bookmark-saved": bookmarkIcon };

/** Numeric encoding: 0=unknown, 1=allowed, 3=restricted, 4=prohibited */
const OVERNIGHT_LEVEL_NUM: Record<OvernightLevel, number> = {
	unknown: 0,
	allowed: 1,
	restricted: 3,
	prohibited: 4,
};

const SPOTS_SOURCE_ID = "spots-source";
const SPOTS_LAYER_ID = "spots-layer";
const SPOTS_GLOW_LAYER_ID = "spots-glow-layer";

const LEGAL_ZONES_SOURCE_ID = "legal-zones";
const LEGAL_ZONES_FILL_LAYER_ID = "legal-zones-fill";
const LEGAL_ZONES_LINE_LAYER_ID = "legal-zones-line";

const LEGAL_TILE_URL = `${API_BASE_URL}/legal/tiles/{z}/{x}/{y}.pbf`;

type MapViewProps = {
	onMapReady?: () => void;
	spots?: SpotSummary[];
};

export type MapViewHandle = {
	getVisibleBounds: () => Promise<BoundingBox | null>;
};

type BoundingBox = {
	north: number;
	south: number;
	east: number;
	west: number;
};

const spotsToGeoJSON = (
	spots: SpotSummary[],
	savedIds: Set<string>,
): GeoJSON.FeatureCollection => ({
	type: "FeatureCollection",
	features: spots.map((spot) => {
		const level = getOvernightLevel(spot.legal_status);
		const levelNum = OVERNIGHT_LEVEL_NUM[level];
		return {
			type: "Feature" as const,
			geometry: {
				type: "Point" as const,
				coordinates: [spot.coordinates.lon, spot.coordinates.lat],
			},
			properties: {
				id: spot.id,
				name: spot.name,
				spot_type: spot.spot_type,
				surface_type: spot.surface_type,
				composite_score: spot.composite_score ?? 0,
				score_label: String(Math.round(spot.composite_score ?? 0)),
				restricted: levelNum,
				overnight_level: levelNum,
				saved: savedIds.has(spot.id) ? 1 : 0,
			},
		};
	}),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeColorExpr: any = [
	"case",
	["==", ["get", "restricted"], 4],
	"#EF4444",
	[">=", ["get", "restricted"], 3],
	"#FBBF24",
	"#FFFFFF",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeWidthExpr: any = [
	"case",
	[">=", ["get", "restricted"], 3],
	2.5,
	1.5,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeOpacityExpr: any = [
	"case",
	[">=", ["get", "restricted"], 3],
	0.95,
	0.3,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zoomRadiusExpr: any = [
	"interpolate",
	["linear"],
	["zoom"],
	8,
	10,
	12,
	14,
	15,
	18,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const glowRadiusExpr: any = [
	"interpolate",
	["linear"],
	["zoom"],
	8,
	13,
	12,
	18,
	15,
	24,
];

/**
 * Native MapLibre map for iOS/Android.
 * Renders a full-screen dark-themed interactive map with spot markers.
 * Uses @maplibre/maplibre-react-native declarative components.
 */
export const MapView = forwardRef<MapViewHandle, MapViewProps>(({ onMapReady, spots = [] }, ref) => {
	const cameraRef = useRef<CameraRef>(null);
	const mapRef = useRef<MapViewRef>(null);

	useImperativeHandle(ref, () => ({
		getVisibleBounds: async () => {
			if (!mapRef.current) return null;
			try {
				const bounds = await mapRef.current.getVisibleBounds();
				const [ne, sw] = bounds;
				return { north: ne[1], south: sw[1], east: ne[0], west: sw[0] };
			} catch {
				return null;
			}
		},
	}));
	const theme = useSettingsStore((s) => s.theme);
	const showLegalZones = useSettingsStore((s) => s.showLegalZones);
	const themeColors = useThemeColors();

	// Data-driven color: green (30+), cyan (10-29), amber (<10).
	// Built from theme colors so map dots match ScoreBadge in both light & dark.
	const scoreColorExpr = useMemo(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(): any => [
			"case",
			[">=", ["coalesce", ["get", "composite_score"], 0], 30],
			themeColors.SCORE_HIGH,
			[">=", ["coalesce", ["get", "composite_score"], 0], 10],
			themeColors.SCORE_MEDIUM,
			themeColors.SCORE_LOW,
		],
		[themeColors.SCORE_HIGH, themeColors.SCORE_MEDIUM, themeColors.SCORE_LOW],
	);

	const glowStyle = useMemo(
		() => ({
			circleRadius: glowRadiusExpr,
			circleColor: scoreColorExpr,
			circleOpacity: 0.15,
			circleBlur: 1,
		}),
		[scoreColorExpr],
	);

	const dotStyle = useMemo(
		() => ({
			circleRadius: zoomRadiusExpr,
			circleColor: scoreColorExpr,
			circleOpacity: 0.9,
			circleStrokeWidth: strokeWidthExpr,
			circleStrokeColor: strokeColorExpr,
			circleStrokeOpacity: strokeOpacityExpr,
		}),
		[scoreColorExpr],
	);
	const center = useMapStore((s) => s.center);
	const zoom = useMapStore((s) => s.zoom);
	const updateBounds = useMapStore((s) => s.updateBounds);
	const setCenter = useMapStore((s) => s.setCenter);
	const setZoom = useMapStore((s) => s.setZoom);
	const flyToTarget = useMapStore((s) => s.flyToTarget);
	const clearFlyTo = useMapStore((s) => s.clearFlyTo);
	const selectedSpot = useMapStore((s) => s.selectedSpot);
	const setSelectedSpot = useMapStore((s) => s.setSelectedSpot);
	const clearSelectedSpot = useMapStore((s) => s.clearSelectedSpot);

	const initialCenter = useRef<[number, number]>([center[0], center[1]]);
	const initialZoom = useRef(zoom);

	const userLocation = useMapStore((s) => s.userLocation);

	const savedSpots = useSpotsStore((s) => s.savedSpots);
	const savedIds = useMemo(
		() => new Set(savedSpots.map((sp) => sp.id)),
		[savedSpots],
	);

	const spotsGeoJSON = useMemo(
		() => spotsToGeoJSON(spots, savedIds),
		[spots, savedIds],
	);

	const userLocationGeoJSON = useMemo(
		(): GeoJSON.FeatureCollection => ({
			type: "FeatureCollection",
			features: userLocation
				? [
						{
							type: "Feature",
							geometry: { type: "Point", coordinates: userLocation },
							properties: {},
						},
					]
				: [],
		}),
		[userLocation],
	);

	const isFlyingRef = useRef(false);
	const lastAppliedFlyRef = useRef<string | null>(null);
	const clearingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const popupViewRef = useRef<View>(null);
	const [popupImageUri, setPopupImageUri] = useState<string | null>(null);
	const popupImageKey = useRef(0);

	const prohibitedBadgeRef = useRef<View>(null);
	const restrictedBadgeRef = useRef<View>(null);
	const [badgeImages, setBadgeImages] = useState<Record<string, { uri: string }>>(
		{},
	);

	const popupGeoJSON = useMemo(
		(): GeoJSON.FeatureCollection => ({
			type: "FeatureCollection",
			features: selectedSpot
				? [
						{
							type: "Feature",
							geometry: {
								type: "Point",
								coordinates: [
									selectedSpot.coordinates.lon,
									selectedSpot.coordinates.lat,
								],
							},
							properties: { id: selectedSpot.id },
						},
					]
				: [],
		}),
		[selectedSpot],
	);

	useEffect(() => {
		setPopupImageUri(null);
		if (!selectedSpot) return;
		popupImageKey.current += 1;
		const captureKey = popupImageKey.current;
		let cancelled = false;
		const capture = async () => {
			if (selectedSpot.satelliteImagePath) {
				try {
					await Image.prefetch(buildSatelliteUrl(selectedSpot.satelliteImagePath));
				} catch { /* use placeholder fallback */ }
			}
			await new Promise((r) => setTimeout(r, 100));
			if (cancelled || captureKey !== popupImageKey.current) return;
			if (!popupViewRef.current) return;
			try {
				const uri = await captureRef(popupViewRef, {
					format: "png",
					quality: 1,
				});
				if (!cancelled && captureKey === popupImageKey.current) {
					setPopupImageUri(uri);
				}
			} catch (e) {
				console.warn("[MapView] popup capture failed", e);
			}
		};
		capture();
		return () => { cancelled = true; };
	}, [selectedSpot]);

	useEffect(() => {
		const capture = async () => {
			await new Promise((r) => setTimeout(r, 200));
			const imgs: Record<string, { uri: string }> = {};
			if (prohibitedBadgeRef.current) {
				try {
					const uri = await captureRef(prohibitedBadgeRef, {
						format: "png",
						quality: 1,
					});
					imgs["badge-prohibited"] = { uri };
				} catch {
					/* skip */
				}
			}
			if (restrictedBadgeRef.current) {
				try {
					const uri = await captureRef(restrictedBadgeRef, {
						format: "png",
						quality: 1,
					});
					imgs["badge-restricted"] = { uri };
				} catch {
					/* skip */
				}
			}
			if (Object.keys(imgs).length > 0) setBadgeImages(imgs);
		};
		capture();
	}, []);

	const popupImageName = `spot-popup-${popupImageKey.current}`;

	const mapImages = useMemo(
		() => ({
			...MAP_IMAGES,
			...badgeImages,
			...(popupImageUri ? { [popupImageName]: { uri: popupImageUri } } : {}),
		}),
		[badgeImages, popupImageUri, popupImageName],
	);

	const popupIconSize = useMemo(() => 1 / PixelRatio.get(), []);

	const LEGAL_BADGE_TRANSLATE: [number, number] = [12, -12];
	const SAVED_ICON_TRANSLATE: [number, number] = [-12, 12];

	const handleRegionDidChange = useCallback(
		(feature: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) => {
			const { visibleBounds, zoomLevel } = feature.properties;
			const [ne, sw] = visibleBounds;

			updateBounds({
				north: ne[1],
				south: sw[1],
				east: ne[0],
				west: sw[0],
			});

			const coords = feature.geometry.coordinates;
			setCenter([coords[0], coords[1]]);
			setZoom(zoomLevel);

			isFlyingRef.current = false;
		},
		[updateBounds, setCenter, setZoom],
	);

	const handleDidFinishLoadingMap = useCallback(() => {
		if (cameraRef.current) {
			cameraRef.current.setCamera({
				centerCoordinate: initialCenter.current,
				zoomLevel: initialZoom.current,
				animationDuration: 0,
			});
		}
		onMapReady?.();
	}, [onMapReady]);

	const handleSpotPress = useCallback(
		(event: {
			features: GeoJSON.Feature[];
			coordinates: { latitude: number; longitude: number };
		}) => {
			const feature = event.features[0];
			const spotId = feature?.properties?.id as string | undefined;
			if (!spotId) return;
			const spot = spots.find((s) => s.id === spotId);
			if (!spot) {
				router.push(`/spot/${spotId}`);
				return;
			}
			hapticSelection();
			setSelectedSpot({
				id: spot.id,
				name: spot.name,
				score: spot.composite_score,
				surface: spot.surface_type,
				province: spot.province,
				slopePct: spot.slope_pct,
				satelliteImagePath: spot.satellite_image_path,
				legalStatus: spot.legal_status,
				spotType: spot.spot_type,
				contextDetails: spot.context_details,
				coordinates: spot.coordinates,
			});
		},
		[spots, setSelectedSpot],
	);

	const handleMapPress = useCallback(() => {
		if (selectedSpot) {
			clearSelectedSpot();
		}
	}, [selectedSpot, clearSelectedSpot]);

	const handlePopupPress = useCallback(
		(_event?: { features: GeoJSON.Feature[]; coordinates: { latitude: number; longitude: number } }) => {
			if (!selectedSpot) return;
			hapticSelection();
			const id = selectedSpot.id;
			clearSelectedSpot();
			router.push(`/spot/${id}`);
		},
		[selectedSpot, clearSelectedSpot],
	);

	useEffect(() => {
		if (!flyToTarget || !cameraRef.current) return;

		const key = `${flyToTarget.center[0]}_${flyToTarget.center[1]}_${flyToTarget.zoom}`;
		if (lastAppliedFlyRef.current === key) {
			clearFlyTo();
			return;
		}
		lastAppliedFlyRef.current = key;

		const target = flyToTarget;
		clearFlyTo();

		isFlyingRef.current = true;

		if (clearingTimerRef.current) {
			clearTimeout(clearingTimerRef.current);
		}

		cameraRef.current.setCamera({
			centerCoordinate: [target.center[0], target.center[1]],
			zoomLevel: target.zoom,
			animationDuration: 1500,
			animationMode: "flyTo",
		});

		clearingTimerRef.current = setTimeout(() => {
			isFlyingRef.current = false;
			clearingTimerRef.current = null;
			if (!cameraRef.current) return;
			cameraRef.current.setCamera({
				animationDuration: 0,
				animationMode: "moveTo",
			});
		}, 1600);
	}, [flyToTarget, clearFlyTo]);

	useEffect(() => {
		return () => {
			if (clearingTimerRef.current) clearTimeout(clearingTimerRef.current);
		};
	}, []);

	return (
		<View style={styles.container}>
			<MLMapView
				ref={mapRef}
				style={styles.map}
				mapStyle={getMapStyle(theme)}
				logoEnabled={false}
				attributionEnabled={false}
				compassEnabled={false}
				onRegionDidChange={handleRegionDidChange}
				onDidFinishLoadingMap={handleDidFinishLoadingMap}
				onPress={handleMapPress}
			>
				<Camera ref={cameraRef} />

				<VectorSource
					id={LEGAL_ZONES_SOURCE_ID}
					tileUrlTemplates={[LEGAL_TILE_URL]}
					minZoomLevel={4}
					maxZoomLevel={10}
				>
					<FillLayer
						id={LEGAL_ZONES_FILL_LAYER_ID}
						sourceLayerID="legal_zones"
						style={{
							visibility: showLegalZones ? "visible" : "none",
							fillColor: "#EF4444",
							fillOpacity: 0.15,
						}}
						belowLayerID={SPOTS_GLOW_LAYER_ID}
					/>
					<LineLayer
						id={LEGAL_ZONES_LINE_LAYER_ID}
						sourceLayerID="legal_zones"
						style={{
							visibility: showLegalZones ? "visible" : "none",
							lineColor: "#EF4444",
							lineOpacity: 0.5,
							lineWidth: 1,
						}}
						belowLayerID={SPOTS_GLOW_LAYER_ID}
					/>
				</VectorSource>

				<Images images={mapImages} />

				<ShapeSource
					id={SPOTS_SOURCE_ID}
					shape={spotsGeoJSON}
					onPress={handleSpotPress}
					hitbox={{ width: 24, height: 24 }}
				>
					<CircleLayer id={SPOTS_GLOW_LAYER_ID} style={glowStyle} />
					<CircleLayer id={SPOTS_LAYER_ID} style={dotStyle} />
					<SymbolLayer
						id="spots-saved-icon"
						filter={["==", ["get", "saved"], 1]}
						style={{
							iconImage: "bookmark-saved",
							iconSize: 0.35,
							iconAnchor: "center",
							iconAllowOverlap: true,
							iconIgnorePlacement: true,
							iconTranslate: SAVED_ICON_TRANSLATE,
						}}
					/>
					<SymbolLayer
						id="spots-text-layer"
						style={{
							textField: ["get", "score_label"],
							textSize: 12,
							textColor: "#FFFFFF",
							textAllowOverlap: true,
						}}
					/>
					<SymbolLayer
						id="spots-badge-prohibited"
						filter={["==", ["get", "overnight_level"], 4]}
						style={{
							iconImage: "badge-prohibited",
							iconSize: popupIconSize,
							iconAnchor: "center",
							iconAllowOverlap: true,
							iconIgnorePlacement: true,
							iconTranslate: LEGAL_BADGE_TRANSLATE,
						}}
					/>
					<SymbolLayer
						id="spots-badge-restricted"
						filter={["==", ["get", "overnight_level"], 3]}
						style={{
							iconImage: "badge-restricted",
							iconSize: popupIconSize,
							iconAnchor: "center",
							iconAllowOverlap: true,
							iconIgnorePlacement: true,
							iconTranslate: LEGAL_BADGE_TRANSLATE,
						}}
					/>
				</ShapeSource>

				<ShapeSource id="user-location-source" shape={userLocationGeoJSON}>
					<CircleLayer
						id="user-location-glow"
						style={{
							circleRadius: 20,
							circleColor: "#4A90D9",
							circleOpacity: 0.2,
							circleBlur: 1,
						}}
					/>
					<CircleLayer
						id="user-location-dot"
						style={{
							circleRadius: 8,
							circleColor: "#4A90D9",
							circleOpacity: 0.9,
							circleStrokeWidth: 2,
							circleStrokeColor: "#FFFFFF",
							circleStrokeOpacity: 0.8,
						}}
					/>
				</ShapeSource>

				<ShapeSource
					id="popup-source"
					shape={popupGeoJSON}
					onPress={handlePopupPress}
					hitbox={{ width: 260, height: 140 }}
				>
					<SymbolLayer
						id="popup-layer"
						style={{
							iconImage: popupImageName,
							iconAnchor: "bottom",
							iconOffset: [0, -15],
							iconAllowOverlap: true,
							iconIgnorePlacement: true,
							iconSize: popupIconSize,
						}}
					/>
				</ShapeSource>
			</MLMapView>

			<View style={styles.offscreen} collapsable={false} pointerEvents="none">
				<View ref={prohibitedBadgeRef} collapsable={false}>
					<View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
						<Text style={styles.badgeSymbol}>✕</Text>
					</View>
				</View>
				<View ref={restrictedBadgeRef} collapsable={false}>
					<View style={[styles.badge, { backgroundColor: "#FBBF24" }]}>
						<Text style={styles.badgeSymbol}>!</Text>
					</View>
				</View>
			</View>
			{selectedSpot && (
				<View
					ref={popupViewRef}
					style={styles.offscreen}
					collapsable={false}
					pointerEvents="none"
				>
					<SpotPopup
						name={selectedSpot.name}
						score={selectedSpot.score}
						surface={selectedSpot.surface}
						province={selectedSpot.province}
						slopePct={selectedSpot.slopePct}
						satelliteImagePath={selectedSpot.satelliteImagePath}
						legalStatus={selectedSpot.legalStatus}
						spotType={selectedSpot.spotType}
						contextDetails={selectedSpot.contextDetails}
						onPress={() => {}}
					/>
				</View>
			)}
			{showLegalZones && (
				<View
					style={[
						styles.legalBanner,
						{ backgroundColor: themeColors.CARD_SURFACE },
					]}
				>
					<Ionicons
						name="shield-outline"
						size={14}
						color={themeColors.SCORE_LOW}
					/>
					<Text
						style={[styles.legalBannerText, { color: themeColors.SCORE_LOW }]}
					>
						{t("legal.legalOverlayBanner")}
					</Text>
				</View>
			)}
			<LegalLegend />
		</View>
	);
});

MapView.displayName = "MapView";

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.BACKGROUND,
	},
	map: {
		flex: 1,
	},
	legalBanner: {
		position: "absolute",
		top: SPACING.SM,
		left: SPACING.MD,
		right: SPACING.MD,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: SPACING.XS + 2,
		paddingHorizontal: SPACING.MD,
		borderRadius: 8,
		opacity: 0.92,
	},
	legalBannerText: {
		fontFamily: FONT_FAMILIES.DATA,
		fontSize: 11,
		letterSpacing: 0.3,
	},
	offscreen: {
		position: "absolute",
		left: -1000,
		top: -1000,
	},
	badge: {
		width: 18,
		height: 18,
		borderRadius: 9,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1.5,
		borderColor: "#FFFFFF",
	},
	badgeSymbol: {
		fontSize: 10,
		fontWeight: "700",
		color: "#FFFFFF",
		textAlign: "center",
	},
});
