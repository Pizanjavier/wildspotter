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

export const NO_LO_BUSQUE_FRAMES = 540;

export type NoLoBusqueProps = {
	hookVariant: "NB1" | "NB2" | "NB3";
	musicTrack: "open-road" | "rising-tide" | "epic-drums";
};

const DRIVING_FOOTAGE: Record<NoLoBusqueProps["hookVariant"], string> = {
	NB1: "videos/ai_Spanish_Countryside_Van_Video.mp4",
	NB2: "videos/rv_mountain_road.mp4",
	NB3: "videos/road_trip_sunset.mp4",
};

const ARRIVAL_FOOTAGE = "videos/ai_Spanish_Beach_VW_Van_Golden_Hour.mp4";

const CROSS_DUR = 24;

export const NoLoBusque: React.FC<NoLoBusqueProps> = ({
	hookVariant = "NB1",
	musicTrack = "open-road",
}) => {
	const frame = useCurrentFrame();
	const { durationInFrames, fps } = useVideoConfig();
	const drivingSrc = DRIVING_FOOTAGE[hookVariant];

	// Single crossfade point: driving → arrival
	const crossAt = 280;

	// Continuous Ken Burns
	const globalZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.12], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	// Layer opacities — direct crossfade, no black gap
	const opDriving = interpolate(frame, [crossAt, crossAt + CROSS_DUR], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const opArrival = interpolate(frame, [crossAt, crossAt + CROSS_DUR], [0, 1], {
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
		transformOrigin: "50% 50%",
	});

	// Text timing — 4 text moments over 2 footage layers
	const t1In = interpolate(frame, [20, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const t1Out = interpolate(frame, [120, 140], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const t2In = interpolate(frame, [145, 165], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const t2Out = interpolate(frame, [230, 250], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// "No lo busqué." — the title line, appears during crossfade
	const t3In = interpolate(frame, [crossAt - 10, crossAt + 15], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const t3Out = interpolate(frame, [crossAt + 70, crossAt + 90], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// "Lo calculé." — amber payoff
	const t4In = interpolate(frame, [crossAt + 95, crossAt + 120], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const t4Y = interpolate(frame, [crossAt + 95, crossAt + 120], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const t4Out = interpolate(frame, [430, 450], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const logoIn = interpolate(frame, [455, 480], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaIn = interpolate(frame, [485, 505], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const textBase: React.CSSProperties = {
		fontFamily: interFont,
		fontWeight: 900,
		color: "#FFFFFF",
		lineHeight: 1.2,
		textShadow: "0 4px 25px rgba(0,0,0,0.7)",
		letterSpacing: -2,
	};

	return (
		<AbsoluteFill style={{ backgroundColor: "#000" }}>
			{/* Music */}
			<Audio
				src={staticFile(`audio/music/${musicTrack}.mp3`)}
				volume={(f) => {
					const fadeIn = interpolate(f, [0, fps], [0, 0.4], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					});
					const fadeOut = interpolate(
						f,
						[durationInFrames - 3 * fps, durationInFrames],
						[0.4, 0],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					);
					if (f < fps) return fadeIn;
					if (f > durationInFrames - 3 * fps) return fadeOut;
					return 0.4;
				}}
			/>

			{/* Video layer: driving footage */}
			<div style={layerStyle(opDriving)}>
				<Video src={staticFile(drivingSrc)} muted loop style={videoStyle} />
			</div>

			{/* Video layer: arrival footage */}
			{frame > crossAt - 5 && (
				<div style={layerStyle(opArrival)}>
					<Video src={staticFile(ARRIVAL_FOOTAGE)} muted loop style={videoStyle} />
				</div>
			)}

			{/* Bottom gradient */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 700,
					background:
						"linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)",
				}}
			/>

			{/* Text 1: "No pregunté en foros." */}
			<div
				style={{
					position: "absolute",
					bottom: 500,
					left: 60,
					right: 60,
					opacity: Math.min(t1In, t1Out),
				}}
			>
				<div style={{ ...textBase, fontSize: 72 }}>
					No pregunté en foros.
				</div>
			</div>

			{/* Text 2: "No seguí a nadie." */}
			<div
				style={{
					position: "absolute",
					bottom: 500,
					left: 60,
					right: 60,
					opacity: Math.min(t2In, t2Out),
				}}
			>
				<div style={{ ...textBase, fontSize: 72 }}>
					No seguí a nadie.
				</div>
			</div>

			{/* Text 3: "No lo busqué." — title line */}
			<div
				style={{
					position: "absolute",
					bottom: 480,
					left: 60,
					right: 60,
					opacity: Math.min(t3In, t3Out),
				}}
			>
				<div
					style={{
						...textBase,
						fontSize: 80,
						letterSpacing: -2,
					}}
				>
					No lo busqué.
				</div>
			</div>

			{/* Text 4: "Lo calculé." in amber */}
			<div
				style={{
					position: "absolute",
					bottom: 480,
					left: 60,
					right: 60,
					opacity: Math.min(t4In, t4Out),
					transform: `translateY(${t4Y}px)`,
				}}
			>
				<div
					style={{
						...textBase,
						fontSize: 88,
						color: "#D97706",
						letterSpacing: -3,
						textShadow: "0 4px 30px rgba(0,0,0,0.8)",
					}}
				>
					Lo calculé.
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
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 24,
					opacity: logoIn,
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
						fontSize: 40,
						fontWeight: 700,
						color: "#FFFFFF",
						textShadow: "0 2px 15px rgba(0,0,0,0.5)",
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
