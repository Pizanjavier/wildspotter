import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { MapView } from "@/components/map/MapView";
import type { MapViewHandle } from "@/components/map/MapView";
import { SearchBar } from "@/components/map/SearchBar";
import { ScanButton } from "@/components/map/ScanButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ScanningOverlay } from "@/components/ui/ScanningOverlay";
import { SpotList } from "@/components/spots/SpotList";
import {
	EmptyState,
	ErrorState,
	IdlePrompt,
	NoResultsToast,
	ZoomWarning,
} from "@/components/map/MapOverlays";
import { FilterChips } from "@/components/map/FilterChips";
import { MyLocationButton } from "@/components/map/MyLocationButton";
import { MapLayersButton } from "@/components/map/MapLayersButton";
import { useMapStore } from "@/stores/map-store";
import { useScanStore } from "@/stores/scan-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { GeocodingResult } from "@/services/geocoding";
import type { SpotSummary } from "@/services/api/types";

const MIN_SCAN_ZOOM = 9;

export const MapScreen = () => {
	const colors = useThemeColors();
	const mapViewRef = useRef<MapViewHandle>(null);
	const zoom = useMapStore((s) => s.zoom);
	const {
		state: scanState,
		spots,
		regionName,
		error,
		fromCache,
		sortKey,
		setSortKey,
		startScan,
		refreshScan,
	} = useScanStore();

	const sortedSpots = useMemo(() => {
		if (sortKey === 'score') return spots;
		if (sortKey === 'slope') {
			return [...spots].sort((a, b) => {
				if (a.slope_pct === null) return 1;
				if (b.slope_pct === null) return -1;
				return a.slope_pct - b.slope_pct;
			});
		}
		// elevation descending
		return [...spots].sort((a, b) => {
			if (a.elevation === null) return 1;
			if (b.elevation === null) return -1;
			return b.elevation - a.elevation;
		});
	}, [spots, sortKey]);

	const filtersVersion = useSettingsStore((s) => s.filtersVersion);
	const prevFiltersVersion = useRef(filtersVersion);
	const flyTo = useMapStore((s) => s.flyTo);

	const isTooZoomedOut = zoom < MIN_SCAN_ZOOM;
	const [showNoResults, setShowNoResults] = useState(false);
	const [showZoomWarning, setShowZoomWarning] = useState(false);

	const prevScanState = useRef(scanState);
	useEffect(() => {
		if (
			prevScanState.current === "scanning" &&
			scanState === "complete" &&
			spots.length === 0
		) {
			setShowNoResults(true);
			const timer = setTimeout(() => setShowNoResults(false), 4000);
			return () => clearTimeout(timer);
		}
		if (scanState === "scanning") {
			setShowNoResults(false);
		}
		prevScanState.current = scanState;
	}, [scanState, spots.length]);

	useEffect(() => {
		if (prevFiltersVersion.current !== filtersVersion) {
			prevFiltersVersion.current = filtersVersion;
			const doRefresh = async () => {
				const liveBounds = await mapViewRef.current?.getVisibleBounds();
				if (spots.length > 0 && liveBounds && scanState !== "scanning") {
					refreshScan(liveBounds);
				}
			};
			doRefresh();
		}
	}, [filtersVersion, spots.length, scanState, refreshScan]);

	const handleSearchSelect = (result: GeocodingResult) => {
		flyTo({
			center: [result.lng, result.lat],
			zoom: result.boundingBox ? 12 : 14,
		});
	};

	const clearFlyTo = useMapStore((s) => s.clearFlyTo);

	const handleScan = async () => {
		if (isTooZoomedOut) {
			setShowZoomWarning(true);
			return;
		}
		setShowZoomWarning(false);
		clearFlyTo();

		let bounds = await mapViewRef.current?.getVisibleBounds();
		if (!bounds) {
			await new Promise((r) => setTimeout(r, 100));
			bounds = await mapViewRef.current?.getVisibleBounds();
		}
		if (!bounds) {
			console.warn("[MapScreen] No bounds available for scan");
			return;
		}
		startScan(bounds);
	};

	useEffect(() => {
		if (!showZoomWarning) return;
		const timer = setTimeout(() => setShowZoomWarning(false), 4000);
		return () => clearTimeout(timer);
	}, [showZoomWarning]);

	const isScanning = scanState === "scanning";
	const isError = scanState === "error";
	const isEmpty = scanState === "complete" && spots.length === 0;

	const isIdle = scanState === "idle" && spots.length === 0;

	const selectedSpot = useMapStore((s) => s.selectedSpot);
	const setSelectedSpot = useMapStore((s) => s.setSelectedSpot);

	const handleFocusSpot = useCallback((spot: SpotSummary) => {
		flyTo({ center: [spot.coordinates.lon, spot.coordinates.lat], zoom: 14 });
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
	}, [flyTo, setSelectedSpot]);

	const renderContent = () => {
		if (isError && error) {
			return <ErrorState message={error} onRetry={handleScan} />;
		}
		if (isIdle) {
			return <IdlePrompt />;
		}
		if (isEmpty) {
			return <EmptyState />;
		}
		return (
			<SpotList
				spots={sortedSpots}
				onFocusSpot={handleFocusSpot}
				focusedSpotId={selectedSpot?.id ?? null}
			/>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
			<MapView ref={mapViewRef} spots={spots} />
			<ScanningOverlay visible={isScanning} />
			<NoResultsToast visible={showNoResults} />
			<SearchBar onSelect={handleSearchSelect} />
			<FilterChips />
			<MyLocationButton />
			<MapLayersButton />
			{showZoomWarning && <ZoomWarning />}
			<ScanButton
				onPress={handleScan}
				isScanning={isScanning}
			/>
			<BottomSheet
				spotsCount={spots.length}
				regionName={regionName}
				fromCache={fromCache}
				sortKey={sortKey}
				onSortChange={setSortKey}
			>
				{renderContent()}
			</BottomSheet>
		</View>
	);
};

export default MapScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
