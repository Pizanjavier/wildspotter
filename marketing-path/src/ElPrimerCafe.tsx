import { Audio, Video } from "@remotion/media";
import {
	AbsoluteFill,
	Easing,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "900"],
	subsets: ["latin"],
});

export const EL_PRIMER_CAFE_FRAMES = 450;

export type ElPrimerCafeProps = {
	hookVariant: "PC1" | "PC2" | "PC3";
	musicTrack: "the-journey" | "golden-fields" | "morning-calm";
};

const FOOTAGE_A: Record<ElPrimerCafeProps["hookVariant"], string> = {
	PC1: "videos/couple-cofee-outside-caravan.mp4",
	PC2: "videos/ai_Couple_Morning_Coffee_Van.mp4",
	PC3: "videos/coffee_camping.mp4",
};

const FOOTAGE_B: Record<ElPrimerCafeProps["hookVariant"], string> = {
	PC1: "videos/couple-inside-van-with-lake-outside.mp4",
	PC2: "videos/couple-inside-van-with-lake-outside.mp4",
	PC3: "videos/ai_Couple_Morning_Coffee_Van.mp4",
};

const CROSS_DUR = 28;

export const ElPrimerCafe: React.FC<ElPrimerCafeProps> = ({
	hookVariant = "PC1",
	musicTrack = "the-journey",
}) => {
	const frame = useCurrentFrame();
	const { durationInFrames, fps } = useVideoConfig();

	const srcA = FOOTAGE_A[hookVariant];
	const srcB = FOOTAGE_B[hookVariant];

	const crossAt = 250;

	const globalZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	const opA = interpolate(frame, [crossAt, crossAt + CROSS_DUR], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const opB = interpolate(frame, [crossAt, crossAt + CROSS_DUR], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const videoStyle: React.CSSProperties = {
		width: "100%",
		height: "100%",
		objectFit: "cover",
	};

	const layerStyle = (opacity: number): React.CSSProperties => ({
		position: "absolute",
		inset: 0,
		opacity,
		transform: `scale(${globalZoom})`,
		transformOrigin: "50% 40%",
	});

	// Warm overlay
	const warmOverlay: React.CSSProperties = {
		position: "absolute",
		inset: 0,
		background:
			"linear-gradient(180deg, rgba(45,30,15,0.15) 0%, transparent 40%, transparent 60%, rgba(45,30,15,0.25) 100%)",
		mixBlendMode: "multiply",
	};

	// Text timing — 3 text moments + CTA
	const t1In = interpolate(frame, [30, 50], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const t1Out = interpolate(frame, [120, 140], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const t1Y = interpolate(frame, [30, 50], [15, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const t2In = interpolate(frame, [150, 175], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const t2Out = interpolate(frame, [crossAt - 15, crossAt], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const t3In = interpolate(frame, [crossAt + 30, crossAt + 55], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const t3Out = interpolate(frame, [350, 370], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const logoIn = interpolate(frame, [375, 400], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaIn = interpolate(frame, [405, 425], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ backgroundColor: "#000" }}>
			{/* Music */}
			<Audio
				src={staticFile(`audio/music/${musicTrack}.mp3`)}
				volume={(f) => {
					const fadeIn = interpolate(f, [0, fps * 1.5], [0, 0.35], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					});
					const fadeOut = interpolate(
						f,
						[durationInFrames - 3 * fps, durationInFrames],
						[0.35, 0],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					);
					if (f < fps * 1.5) return fadeIn;
					if (f > durationInFrames - 3 * fps) return fadeOut;
					return 0.35;
				}}
			/>

			{/* Video layer A — coffee footage */}
			<div style={layerStyle(opA)}>
				<Video src={staticFile(srcA)} muted loop style={videoStyle} />
			</div>

			{/* Video layer B — van interior/calm */}
			{frame > crossAt - 5 && (
				<div style={layerStyle(opB)}>
					<Video src={staticFile(srcB)} muted loop style={videoStyle} />
				</div>
			)}

			{/* Warm overlay */}
			<div style={warmOverlay} />

			{/* Bottom gradient */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 600,
					background:
						"linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)",
				}}
			/>

			{/* Text 1: "6:47" */}
			<div
				style={{
					position: "absolute",
					top: 320,
					left: 0,
					right: 0,
					textAlign: "center",
					opacity: Math.min(t1In, t1Out),
					transform: `translateY(${t1Y}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 88,
						fontWeight: 900,
						color: "#FFFFFF",
						letterSpacing: -2,
						textShadow:
							"0 4px 30px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
					}}
				>
					6:47
				</div>
			</div>

			{/* Text 2: "Sin alarma..." */}
			<div
				style={{
					position: "absolute",
					bottom: 420,
					left: 60,
					right: 60,
					textAlign: "center",
					opacity: Math.min(t2In, t2Out),
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 64,
						fontWeight: 700,
						color: "#FFFFFF",
						lineHeight: 1.3,
						textShadow: "0 3px 20px rgba(0,0,0,0.7)",
					}}
				>
					Sin alarma.
					<br />
					Sin vecinos.
					<br />
					Sin prisa.
				</div>
			</div>

			{/* Text 3: "Solo el café..." */}
			<div
				style={{
					position: "absolute",
					bottom: 460,
					left: 60,
					right: 60,
					textAlign: "center",
					opacity: Math.min(t3In, t3Out),
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 56,
						fontWeight: 700,
						color: "rgba(255,255,255,0.9)",
						lineHeight: 1.35,
						textShadow: "0 3px 20px rgba(0,0,0,0.7)",
					}}
				>
					Solo el café.
					<br />Y lo que sea que hay ahí fuera.
				</div>
			</div>

			{/* CTA: logo + vignette */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: logoIn,
					background:
						"radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: 380,
					left: "50%",
					transform: "translateX(-50%)",
					opacity: logoIn,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 24,
				}}
			>
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 160,
						height: 160,
						borderRadius: 36,
						boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
					}}
				/>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 42,
						fontWeight: 700,
						color: "#FFFFFF",
						textShadow: "0 2px 15px rgba(0,0,0,0.6)",
					}}
				>
					WildSpotter
				</div>
			</div>
			<div
				style={{
					position: "absolute",
					bottom: 280,
					left: 0,
					right: 0,
					textAlign: "center",
					opacity: ctaIn,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 24,
						fontWeight: 400,
						color: "rgba(255,255,255,0.5)",
						letterSpacing: 2,
					}}
				>
					LINK IN BIO
				</div>
			</div>
		</AbsoluteFill>
	);
};
