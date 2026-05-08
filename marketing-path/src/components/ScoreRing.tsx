import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type ScoreRingProps = {
	score: number;
	size?: number;
	strokeWidth?: number;
	startFrame?: number;
	fillDuration?: number;
	fontFamily?: string;
};

export const ScoreRing: React.FC<ScoreRingProps> = ({
	score,
	size = 320,
	strokeWidth = 14,
	startFrame = 0,
	fillDuration = 60,
	fontFamily = "JetBrains Mono, monospace",
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const color = score >= 80 ? "#4ADE80" : score >= 60 ? "#D97706" : "#FBBF24";
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	const fillProgress = spring({
		frame: frame - startFrame,
		fps,
		config: { damping: 14, stiffness: 120 },
		durationInFrames: fillDuration,
	});

	const displayProgress = interpolate(fillProgress, [0, 1], [0, score / 100], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const dashOffset = circumference * (1 - displayProgress);

	const linearProgress = interpolate(
		frame - startFrame,
		[0, fillDuration * 0.85],
		[0, score - 2],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);
	const slamProgress = spring({
		frame: frame - startFrame - Math.round(fillDuration * 0.8),
		fps,
		config: { damping: 8, stiffness: 300, mass: 0.8 },
		durationInFrames: Math.round(fillDuration * 0.3),
	});
	const slamValue = interpolate(slamProgress, [0, 1], [0, 2 + (score % 1)], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const displayScore =
		frame - startFrame < fillDuration * 0.8
			? linearProgress
			: score - 2 + slamValue;

	const clampedScore = Math.min(displayScore, score);
	const scoreStr = clampedScore.toFixed(1);

	const glowOpacity = interpolate((frame * 1.5) % 90, [0, 45, 90], [0.4, 0.8, 0.4]);

	if (frame < startFrame) return null;

	return (
		<div
			style={{
				position: "relative",
				width: size,
				height: size,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<svg
				width={size}
				height={size}
				style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="#3D353044"
					strokeWidth={strokeWidth}
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={dashOffset}
					style={{ filter: `drop-shadow(0 0 ${8 * glowOpacity}px ${color})` }}
				/>
			</svg>
			<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
				<span
					style={{
						fontFamily,
						fontSize: size * 0.22,
						fontWeight: 700,
						color,
						lineHeight: 1,
						textShadow: `0 0 20px ${color}66`,
						letterSpacing: -2,
					}}
				>
					{scoreStr}
				</span>
				<span
					style={{
						fontFamily,
						fontSize: size * 0.075,
						fontWeight: 400,
						color: "#A0836C",
						letterSpacing: 3,
						textTransform: "uppercase",
					}}
				>
					/ 100
				</span>
			</div>
		</div>
	);
};
