import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
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
	weights: ["400", "900"],
	subsets: ["latin"],
});

// 660 net frames = 22s @ 30fps
// Scene gross durations: 156+158+130+155+157 = 756 — 4 transitions × 24f = 660
export const LAS_COORDENADAS_FRAMES = 660;

const TRANSITION_FRAMES = 24;

export type LasCoordenadaProps = {
	hookVariant: "E1" | "E2" | "E3";
	musicTrack: "spirit-in-the-woods" | "digital-clouds" | "the-journey";
};

// Scene 1 footage — changes the hook feel per variant
const S1_FOOTAGE: Record<LasCoordenadaProps["hookVariant"], string> = {
	E1: "videos/van_in_spot_calm.mp4",
	E2: "videos/ai_Stars_Timelapse_Van_Night.mp4",
	E3: "videos/coffee_camping.mp4",
};

// Scene 3 footage — swaps to avoid repetition when S1 already uses that clip
const S3_FOOTAGE: Record<LasCoordenadaProps["hookVariant"], string> = {
	E1: "videos/ai_Stars_Timelapse_Van_Night.mp4",
	E2: "videos/ai_Van_Arriving_Empty_Coastal_Spot.mp4",
	E3: "videos/ai_Stars_Timelapse_Van_Night.mp4",
};

// ── Background video with Ken Burns ─────────────────────────────────────────

type BgProps = {
	src: string;
	kenBurnsTo?: number;
};

const Bg: React.FC<BgProps> = ({ src, kenBurnsTo = 1.15 }) => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();
	const zoom = interpolate(frame, [0, durationInFrames], [1.0, kenBurnsTo], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				transform: `scale(${zoom})`,
				transformOrigin: "50% 50%",
			}}
		>
			<Video
				src={staticFile(src)}
				muted
				loop
				style={{ width: "100%", height: "100%", objectFit: "cover" }}
			/>
		</div>
	);
};

// Subtle top + bottom edge gradients — no center dimming (V2: footage at full saturation)
const EdgeGradients: React.FC = () => (
	<>
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				height: 280,
				background:
					"linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 100%)",
			}}
		/>
		<div
			style={{
				position: "absolute",
				bottom: 0,
				left: 0,
				right: 0,
				height: 280,
				background:
					"linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%)",
			}}
		/>
	</>
);

// ── Scenes 1-3: pure footage, no text ───────────────────────────────────────

const PureFootageScene: React.FC<{ footage: string }> = ({ footage }) => (
	<AbsoluteFill style={{ overflow: "hidden" }}>
		<Bg src={footage} />
		<EdgeGradients />
	</AbsoluteFill>
);

// ── Scene 4: "Nosotros calculamos las coordenadas." ──────────────────────────

const Scene4Text: React.FC = () => {
	const frame = useCurrentFrame();

	const textOpacity = interpolate(frame, [18, 42], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const textY = interpolate(frame, [18, 42], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill style={{ overflow: "hidden" }}>
			<Bg
				src="videos/ai_Spanish_Beach_VW_Van_Golden_Hour.mp4"
				kenBurnsTo={1.12}
			/>

			{/* Gradient supporting text readability in the lower half */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 800,
					background:
						"linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 260,
					background:
						"linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 100%)",
				}}
			/>

			{/* "Nosotros calculamos las coordenadas." */}
			<div
				style={{
					position: "absolute",
					bottom: 480,
					left: 70,
					right: 100,
					opacity: textOpacity,
					transform: `translateY(${textY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 96,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.1,
						letterSpacing: -3,
						textShadow: "0 4px 30px rgba(0,0,0,0.8)",
					}}
				>
					Nosotros calculamos las coordenadas.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Scene 5: "La historia es tuya." + logo + CTA ────────────────────────────

const Scene5Final: React.FC = () => {
	const frame = useCurrentFrame();

	const textOpacity = interpolate(frame, [15, 39], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const textY = interpolate(frame, [15, 39], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const logoOpacity = interpolate(frame, [50, 70], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaOpacity = interpolate(frame, [65, 85], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ overflow: "hidden" }}>
			<Bg src="videos/van_in_spot_calm_couple_dog_night.mp4" kenBurnsTo={1.1} />

			{/* Strong bottom gradient for text + logo readability */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 900,
					background:
						"linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 260,
					background:
						"linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 100%)",
				}}
			/>

			{/* "La historia es tuya." */}
			<div
				style={{
					position: "absolute",
					bottom: 530,
					left: 70,
					right: 100,
					opacity: textOpacity,
					transform: `translateY(${textY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 96,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.1,
						letterSpacing: -3,
						textShadow: "0 4px 30px rgba(0,0,0,0.8)",
					}}
				>
					La historia es tuya.
				</div>
			</div>

			{/* Logo — 180px, centered, fade-in 20 frames */}
			<div
				style={{
					position: "absolute",
					bottom: 340,
					left: "50%",
					transform: "translateX(-50%)",
					opacity: logoOpacity,
				}}
			>
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 180,
						height: 180,
						borderRadius: 40,
						boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
					}}
				/>
			</div>

			{/* wildspotter.app — above 250px safe zone */}
			<div
				style={{
					position: "absolute",
					bottom: 270,
					left: 0,
					right: 0,
					textAlign: "center",
					opacity: ctaOpacity,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 36,
						fontWeight: 400,
						color: "rgba(255,255,255,0.65)",
						letterSpacing: 3,
					}}
				>
					wildspotter.app
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Audio ────────────────────────────────────────────────────────────────────

const CoordenadaAudio: React.FC<{ musicSrc: string }> = ({ musicSrc }) => {
	const { durationInFrames, fps } = useVideoConfig();
	return (
		<>
			{/* Narration IA — volume 1.0 throughout */}
			<Audio
				src={staticFile("audio/narration/LasCoordenadas-narration.mp3")}
				volume={1.0}
			/>

			{/* Instrumental — subtle, volume 0.2, fade in/out */}
			<Audio
				src={staticFile(musicSrc)}
				volume={(f) => {
					const fadeIn = interpolate(f, [0, fps], [0, 0.2], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					});
					const fadeOut = interpolate(
						f,
						[durationInFrames - 2.5 * fps, durationInFrames],
						[0.2, 0],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					);
					if (f < fps) return fadeIn;
					if (f > durationInFrames - 2.5 * fps) return fadeOut;
					return 0.2;
				}}
			/>
		</>
	);
};

// ── Main composition ─────────────────────────────────────────────────────────

export const LasCoordenadas: React.FC<LasCoordenadaProps> = ({
	hookVariant = "E1",
	musicTrack = "spirit-in-the-woods",
}) => {
	const s1Footage = S1_FOOTAGE[hookVariant];
	const s3Footage = S3_FOOTAGE[hookVariant];
	const musicSrc = `audio/music/${musicTrack}.mp3`;

	return (
		<>
			<CoordenadaAudio musicSrc={musicSrc} />

			<TransitionSeries>
				{/* S1 — Hook footage, no text (0–5.2s) */}
				<TransitionSeries.Sequence durationInFrames={156}>
					<PureFootageScene footage={s1Footage} />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
				/>

				{/* S2 — Mountains at dawn, no text (5–10.3s) */}
				<TransitionSeries.Sequence durationInFrames={158}>
					<PureFootageScene footage="videos/drone_mountains.mp4" />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
				/>

				{/* S3 — Stars timelapse / van night, no text (10–14.3s) */}
				<TransitionSeries.Sequence durationInFrames={130}>
					<PureFootageScene footage={s3Footage} />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
				/>

				{/* S4 — Beach golden hour + "Nosotros calculamos las coordenadas." (14–19.2s) */}
				<TransitionSeries.Sequence durationInFrames={155}>
					<Scene4Text />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
				/>

				{/* S5 — Couple + dog night + "La historia es tuya." + logo (19–22s) */}
				<TransitionSeries.Sequence durationInFrames={157}>
					<Scene5Final />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</>
	);
};
