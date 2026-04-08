import { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { MapView } from "@/components/map/MapView";
import { SearchBar } from "@/components/map/SearchBar";
import { ScanButton } from "@/components/map/ScanButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ScanningOverlay } from "@/components/ui/ScanningOverlay";
import { SpotList } from "@/components/spots/SpotList";
import {
	EmptyState,
	ErrorState,
	NoResultsToast,
	ZoomWarning,
} from "@/components/map/MapOverlays";
import { FilterChips } from "@/components/map/FilterChips";
import { MyLocationButton } from "@/components/map/MyLocationButton";
import { useMapStore } from "@/stores/map-store";
import { useScanStore } from "@/stores/scan-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { GeocodingResult } from "@/services/geocoding";

const MIN_SCAN_ZOOM = 9;

export const MapScreen = () => {
	const colors = useThemeColors();
	const bounds = useMapStore((s) => s.bounds);
	const zoom = useMapStore((s) => s.zoom);
	const {
		state: scanState,
		spots,
		regionName,
		error,
		fromCache,
		startScan,
		refreshScan,
	} = useScanStore();

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
			if (spots.length > 0 && bounds && scanState !== "scanning") {
				refreshScan(bounds);
			}
		}
	}, [filtersVersion, spots.length, bounds, scanState, refreshScan]);

	const handleSearchSelect = (result: GeocodingResult) => {
		flyTo({
			center: [result.lng, result.lat],
			zoom: result.boundingBox ? 12 : 14,
		});
	};

	const handleScan = () => {
		if (isTooZoomedOut) {
			setShowZoomWarning(true);
			return;
		}
		if (!bounds) {
			console.warn("[MapScreen] No bounds available for scan");
			return;
		}
		setShowZoomWarning(false);
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

	const renderContent = () => {
		if (isError && error) {
			return <ErrorState message={error} onRetry={handleScan} />;
		}
		if (isEmpty) {
			return <EmptyState />;
		}
		return <SpotList spots={spots} />;
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
			<MapView spots={spots} />
			<ScanningOverlay visible={isScanning} />
			<NoResultsToast visible={showNoResults} />
			<SearchBar onSelect={handleSearchSelect} />
			<FilterChips />
			<MyLocationButton />
			{showZoomWarning && <ZoomWarning />}
			<ScanButton
				onPress={handleScan}
				isScanning={isScanning}
			/>
			<BottomSheet
				spotsCount={spots.length}
				regionName={regionName}
				fromCache={fromCache}
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
