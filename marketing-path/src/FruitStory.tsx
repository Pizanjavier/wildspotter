import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
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

// --- Durations ---
const CLIP_FRAMES = 250; // 8s each @ 30fps
const CTA_FRAMES = 180; // 6s CTA
const FADE_FRAMES = 18; // 0.6s fades
// Total: 3×240 + 180 - 3×18 = 846 frames ≈ 28.2s
export const FRUIT_STORY_FRAMES = 846;

export type FruitStoryProps = {
	hookVariant: "F1";
	withIntro: false;
};

// --- CTA Scene (link en bio + logo) ---
const SceneCTA = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const line1In = spring({
		frame,
		fps,
		delay: 15,
		config: { damping: 200 },
	});

	const line2In = spring({
		frame,
		fps,
		delay: 35,
		config: { damping: 200 },
	});

	const logoIn = spring({
		frame,
		fps,
		delay: 50,
		config: { damping: 15, stiffness: 120 },
	});

	const ctaIn = spring({
		frame,
		fps,
		delay: 68,
		config: { damping: 200 },
	});
	const ctaPulse = frame > 85 ? 1 + Math.sin((frame - 85) * 0.12) * 0.025 : 1;

	const bgZoom = interpolate(frame, [0, CTA_FRAMES], [1.0, 1.1], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
			{/* Peaceful van footage background */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					transform: `scale(${bgZoom})`,
					transformOrigin: "50% 40%",
				}}
			>
				<Video
					src={staticFile("videos/ai_Spanish_Beach_VW_Van_Golden_Hour.mp4")}
					loop
					muted
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
					}}
				/>
			</div>

			{/* Warm overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: "rgba(26,22,20,0.45)",
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

			{/* Bottom gradient */}
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

			{/* "wildspotter.app" */}
			<div
				style={{
					position: "absolute",
					top: "50%",
					left: 0,
					right: 0,
					textAlign: "center",
					fontFamily: jetbrainsFont,
					fontSize: 64,
					fontWeight: 700,
					color: "#FFFFFF",
					opacity: line1In,
					transform: `translateY(${interpolate(line1In, [0, 1], [40, 0])}px)`,
					textShadow: "0 2px 30px rgba(0,0,0,0.9), 0 4px 60px rgba(0,0,0,0.5)",
					letterSpacing: 1,
				}}
			>
				wildspotter.app
			</div>

			{/* "Solo 500 plazas" */}
			<div
				style={{
					position: "absolute",
					top: "59%",
					left: 0,
					right: 0,
					textAlign: "center",
					fontFamily: interFont,
					fontSize: 48,
					fontWeight: 700,
					color: "#D97706",
					opacity: line2In,
					transform: `translateY(${interpolate(line2In, [0, 1], [40, 0])}px)`,
					textShadow:
						"0 0 60px rgba(217,119,6,0.4), 0 2px 30px rgba(0,0,0,0.9)",
					letterSpacing: -1,
				}}
			>
				Solo 500 plazas en el waitlist.
			</div>

			{/* Logo block */}
			<div
				style={{
					position: "absolute",
					top: "72%",
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
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 96,
						height: 96,
						borderRadius: 22,
						boxShadow: "0 6px 36px rgba(180,80,10,0.55)",
					}}
				/>
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

// --- Video clip scene (full-frame video) ---
const VideoClip: React.FC<{ src: string }> = ({ src }) => {
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, CLIP_FRAMES], [1.0, 1.05], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
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
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// --- Main composition ---
export const FruitStory: React.FC<FruitStoryProps> = () => {
	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			<TransitionSeries>
				{/* Scene 1: El Dolor — Avocado frustrado */}
				<TransitionSeries.Sequence durationInFrames={CLIP_FRAMES}>
					<VideoClip src="videos/fruit_story_1_Avocado_saying__Fui_202604101147.mp4" />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: FADE_FRAMES })}
				/>

				{/* Scene 2: La Solucion — Limon con WildSpotter */}
				<TransitionSeries.Sequence durationInFrames={CLIP_FRAMES}>
					<VideoClip src="videos/fruit_story_2_Lemos_using_WildSpotter_202604101153.mp4" />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: FADE_FRAMES })}
				/>

				{/* Scene 3: El Cierre — Avocado + Limon */}
				<TransitionSeries.Sequence durationInFrames={CLIP_FRAMES}>
					<VideoClip src="videos/fruit_story_3_Avocado_Lemon_WildSpotter_202604101200.mp4" />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: FADE_FRAMES })}
				/>

				{/* Scene 4: CTA — Logo + wildspotter.app + link en bio */}
				<TransitionSeries.Sequence durationInFrames={CTA_FRAMES}>
					<SceneCTA />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</AbsoluteFill>
	);
};
