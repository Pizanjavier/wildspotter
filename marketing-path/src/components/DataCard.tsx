import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type DataCardProps = {
	label: string;
	value: string;
	accentColor?: string;
	startFrame?: number;
	indicator?: "check" | "warning" | "none";
	fontFamily?: string;
	monoFamily?: string;
	width?: number;
};

export const DataCard: React.FC<DataCardProps> = ({
	label,
	value,
	accentColor = "#D97706",
	startFrame = 0,
	indicator = "none",
	fontFamily = "Inter, sans-serif",
	monoFamily = "JetBrains Mono, monospace",
	width = 480,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const entrance = spring({
		frame: frame - startFrame,
		fps,
		config: { damping: 16, stiffness: 180 },
		durationInFrames: 25,
	});

	const translateY = interpolate(entrance, [0, 1], [40, 0]);
	const opacity = interpolate(entrance, [0, 0.3], [0, 1], {
		extrapolateRight: "clamp",
	});

	if (frame < startFrame) return null;

	const indicatorEl =
		indicator === "check" ? (
			<span style={{ color: "#4ADE80", fontFamily: monoFamily, fontSize: 30, fontWeight: 700 }}>✓</span>
		) : indicator === "warning" ? (
			<span style={{ color: "#FBBF24", fontFamily: monoFamily, fontSize: 30, fontWeight: 700 }}>⚠</span>
		) : null;

	return (
		<div
			style={{
				width,
				display: "flex",
				alignItems: "stretch",
				transform: `translateY(${translateY}px)`,
				opacity,
				overflow: "hidden",
				borderRadius: 10,
				background: "#1E1A17",
				border: "1px solid #3D353066",
			}}
		>
			<div
				style={{
					width: 4,
					background: accentColor,
					flexShrink: 0,
					boxShadow: `0 0 8px ${accentColor}66`,
				}}
			/>
			<div
				style={{
					flex: 1,
					padding: "14px 18px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 12,
				}}
			>
				<div>
					<div
						style={{
							fontFamily,
							fontSize: 20,
							fontWeight: 400,
							color: "#A0836C",
							letterSpacing: 1.2,
							textTransform: "uppercase",
							marginBottom: 4,
						}}
					>
						{label}
					</div>
					<div
						style={{
							fontFamily: monoFamily,
							fontSize: 28,
							fontWeight: 700,
							color: "#FFFFFF",
							letterSpacing: -0.5,
						}}
					>
						{value}
					</div>
				</div>
				{indicatorEl}
			</div>
		</div>
	);
};
