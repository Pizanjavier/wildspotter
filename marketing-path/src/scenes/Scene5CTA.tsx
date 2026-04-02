import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "600", "700", "900"],
	subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
	weights: ["700"],
	subsets: ["latin"],
});

export const Scene5CTA = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Text line 1
	const line1In = spring({
		frame,
		fps,
		delay: 22,
		config: { damping: 200 },
	});

	// Text line 2
	const line2In = spring({
		frame,
		fps,
		delay: 40,
		config: { damping: 200 },
	});

	// Logo
	const logoIn = spring({
		frame,
		fps,
		delay: 58,
		config: { damping: 15, stiffness: 120 },
	});

	// CTA button
	const ctaIn = spring({
		frame,
		fps,
		delay: 75,
		config: { damping: 200 },
	});
	const ctaPulse = frame > 90 ? 1 + Math.sin((frame - 90) * 0.12) * 0.025 : 1;

	// Slow zoom on video background
	const bgZoom = interpolate(frame, [0, 195], [1.0, 1.1], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				background: "#0F0D0B",
				overflow: "hidden",
			}}
		>
			{/* Real footage: van parked in calm nature spot */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					transform: `scale(${bgZoom})`,
					transformOrigin: "50% 40%",
				}}
			>
				<Video
					src={staticFile("videos/van_in_spot_calm.mp4")}
					muted
					loop
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
					}}
				/>
			</div>

			{/* Warm cinematic overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: "rgba(26,22,20,0.4)",
					mixBlendMode: "multiply",
				}}
			/>

			{/* Top vignette */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 400,
					background:
						"linear-gradient(180deg, rgba(15,13,11,0.85) 0%, transparent 100%)",
				}}
			/>

			{/* Bottom gradient for text area */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "65%",
					background:
						"linear-gradient(0deg, rgba(15,13,11,0.95) 0%, rgba(15,13,11,0.8) 40%, rgba(15,13,11,0.3) 70%, transparent 100%)",
				}}
			/>

			{/* Text: "Descubierto por datos." */}
			<div
				style={{
					position: "absolute",
					top: "55%",
					left: 0,
					right: 0,
					textAlign: "center",
					fontFamily: interFont,
					fontSize: 72,
					fontWeight: 700,
					color: "#FFFFFF",
					opacity: line1In,
					transform: `translateY(${interpolate(line1In, [0, 1], [40, 0])}px)`,
					textShadow:
						"0 2px 30px rgba(0,0,0,0.9), 0 4px 60px rgba(0,0,0,0.5)",
					letterSpacing: -1,
				}}
			>
				Descubierto por datos.
			</div>

			{/* Text: "No por reviews." */}
			<div
				style={{
					position: "absolute",
					top: "65%",
					left: 0,
					right: 0,
					textAlign: "center",
					fontFamily: interFont,
					fontSize: 72,
					fontWeight: 700,
					color: "#D97706",
					opacity: line2In,
					transform: `translateY(${interpolate(line2In, [0, 1], [40, 0])}px)`,
					textShadow:
						"0 0 60px rgba(217,119,6,0.4), 0 2px 30px rgba(0,0,0,0.9)",
					letterSpacing: -1,
				}}
			>
				No por reviews.
			</div>

			{/* WildSpotter Logo + Name */}
			<div
				style={{
					position: "absolute",
					top: "77%",
					left: 0,
					right: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 14,
					opacity: logoIn,
					transform: `scale(${interpolate(logoIn, [0, 1], [0.8, 1])})`,
				}}
			>
				{/* App icon */}
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 96,
						height: 96,
						borderRadius: 22,
						boxShadow: "0 6px 36px rgba(180,80,10,0.55)",
					}}
				/>

				{/* Brand name */}
				<div
					style={{
						fontFamily: jetbrainsFont,
						fontSize: 44,
						fontWeight: 700,
						color: "#FFFFFF",
						letterSpacing: 4,
						textShadow: "0 2px 20px rgba(0,0,0,0.8)",
					}}
				>
					WildSpotter
				</div>

				{/* Tagline */}
				<div
					style={{
						fontFamily: interFont,
						fontSize: 26,
						color: "#D4C4B0",
						letterSpacing: 1,
						textShadow: "0 2px 12px rgba(0,0,0,0.7)",
					}}
				>
					Tu radar para spots salvajes
				</div>
			</div>

			{/* CTA badge */}
			<div
				style={{
					position: "absolute",
					bottom: 55,
					left: "50%",
					transform: `translateX(-50%) scale(${ctaPulse})`,
					opacity: ctaIn,
					background: "linear-gradient(135deg, #D97706, #B45309)",
					borderRadius: 36,
					padding: "18px 52px",
					fontFamily: interFont,
					fontSize: 32,
					fontWeight: 700,
					color: "#FFFFFF",
					letterSpacing: 1,
					boxShadow:
						"0 6px 40px rgba(217,119,6,0.5), 0 2px 20px rgba(0,0,0,0.5)",
					whiteSpace: "nowrap",
				}}
			>
				Link en bio ↗
			</div>
		</AbsoluteFill>
	);
};
