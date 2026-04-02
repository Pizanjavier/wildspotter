import {
	AbsoluteFill,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});

export const Scene3Question = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// First line fades in
	const line1In = spring({
		frame,
		fps,
		delay: 10,
		config: { damping: 200 },
	});

	// Second line fades in with delay
	const line2In = spring({
		frame,
		fps,
		delay: 35,
		config: { damping: 200 },
	});

	// Subtle amber glow pulse behind text
	const glowPulse = interpolate(
		frame,
		[35, 50, 65, 80],
		[0, 0.15, 0.08, 0.12],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// Thin horizontal line expanding
	const lineWidth = interpolate(
		spring({ frame, fps, delay: 25, config: { damping: 200 } }),
		[0, 1],
		[0, 600],
	);

	// Slow zoom on background video
	const bgZoom = interpolate(frame, [0, 165], [1.0, 1.08], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				background: "#0F0D0B",
			}}
		>
			{/* Drone mountains background — heavily dimmed for atmosphere */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					transform: `scale(${bgZoom})`,
					transformOrigin: "50% 50%",
				}}
			>
				<Video
					src={staticFile("videos/drone_mountains.mp4")}
					muted
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						opacity: 0.35,
					}}
				/>
			</div>

			{/* Dark overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse at 50% 50%, rgba(15,13,11,0.5) 0%, rgba(15,13,11,0.85) 100%)",
				}}
			/>

			{/* Ambient glow */}
			<div
				style={{
					position: "absolute",
					width: 600,
					height: 600,
					borderRadius: "50%",
					background: `radial-gradient(circle, rgba(217,119,6,${glowPulse}) 0%, transparent 70%)`,
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			/>

			{/* Content */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div
					style={{
						textAlign: "center",
						padding: "0 80px",
					}}
				>
					{/* Line 1 */}
					<div
						style={{
							fontFamily: interFont,
							fontSize: 58,
							fontWeight: 400,
							color: "#A0836C",
							opacity: line1In,
							transform: `translateY(${interpolate(line1In, [0, 1], [20, 0])}px)`,
							lineHeight: 1.4,
							textShadow: "0 2px 20px rgba(0,0,0,0.8)",
						}}
					>
						¿Y si los mejores spots
					</div>

					{/* Thin divider */}
					<div
						style={{
							width: lineWidth,
							height: 1,
							background:
								"linear-gradient(90deg, transparent, #D97706, transparent)",
							margin: "30px auto",
						}}
					/>

					{/* Line 2 — the punch */}
					<div
						style={{
							fontFamily: interFont,
							fontSize: 70,
							fontWeight: 700,
							color: "#FFFFFF",
							opacity: line2In,
							transform: `translateY(${interpolate(line2In, [0, 1], [20, 0])}px)`,
							lineHeight: 1.3,
							textShadow:
								"0 0 60px rgba(217,119,6,0.2), 0 2px 20px rgba(0,0,0,0.8)",
						}}
					>
						no tuvieran <span style={{ color: "#D97706" }}>reviews</span>?
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
