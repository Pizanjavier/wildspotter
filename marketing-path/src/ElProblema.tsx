import {
	AbsoluteFill,
	Easing,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "900"],
	subsets: ["latin"],
});
const { fontFamily: monoFont } = loadMono("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});

// S1 "El Problema" — Problem/Solution arc
// 4 scenes × ~4.5s average = ~18s + transitions
// Scene durations: Hook 130, Escalation 150, Pivot 130, CTA 200 = 610 base
// 3 transitions × 18f = 54 overlap
// Total: 610 - 54 = 556 frames ≈ 18.5s
export const EL_PROBLEMA_FRAMES = 556;

export type ElProblemaProps = {
	hookVariant: "S1" | "S1b";
};

// ─── Video background helper ───────────────────────────────────────────────

type VideoBgProps = {
	src: string;
	dimOpacity: number;
	duration: number;
	startFrame?: number;
};

const VideoBg: React.FC<VideoBgProps> = ({
	src,
	dimOpacity,
	duration,
	startFrame = 0,
}) => {
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, duration], [1.0, 1.1], {
		extrapolateRight: "clamp",
	});
	return (
		<AbsoluteFill style={{ overflow: "hidden" }}>
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
					trimBefore={startFrame}
					style={{ width: "100%", height: "100%", objectFit: "cover" }}
				/>
			</div>
			{/* Dark overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `rgba(15,13,11,${dimOpacity})`,
				}}
			/>
			{/* Top vignette */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 600,
					background:
						"linear-gradient(180deg,rgba(15,13,11,0.95) 0%,rgba(15,13,11,0.5) 55%,transparent 100%)",
				}}
			/>
			{/* Bottom vignette */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 700,
					background:
						"linear-gradient(0deg,rgba(15,13,11,0.97) 0%,rgba(15,13,11,0.55) 55%,transparent 100%)",
				}}
			/>
		</AbsoluteFill>
	);
};

// ─── Scene 1: Hook ─────────────────────────────────────────────────────────

type Scene1Props = { variant: "S1" | "S1b" };

const Scene1Hook: React.FC<Scene1Props> = ({ variant }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const titleIn = spring({ frame, fps, config: { damping: 220 } });
	const titleY = interpolate(titleIn, [0, 1], [40, 0]);

	const subIn = interpolate(frame, [50, 70], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const subY = interpolate(frame, [50, 70], [18, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const isAlt = variant === "S1b";

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			<VideoBg
				src="videos/ai_Van_trying_to_park_full_parking.mp4"
				dimOpacity={0.52}
				duration={130}
			/>

			{/* Title */}
			<div
				style={{
					position: "absolute",
					top: 270,
					left: 60,
					right: 160,
					opacity: titleIn,
					transform: `translateY(${titleY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: isAlt ? 80 : 86,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.1,
						letterSpacing: -2,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					{isAlt ? (
						<>
							Guardaste ese spot{" "}
							<span style={{ color: "#D97706" }}>hace 3 meses.</span>
						</>
					) : (
						<>
							<span style={{ color: "#D97706" }}>Guardaste</span> ese spot hace
							3 meses.
						</>
					)}
				</div>
			</div>

			{/* Subtitle */}
			<div
				style={{
					position: "absolute",
					bottom: 480,
					left: 60,
					right: 160,
					opacity: subIn,
					transform: `translateY(${subY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 52,
						fontWeight: 700,
						color: "rgba(255,255,255,0.88)",
						lineHeight: 1.25,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					Llegas. Hay{" "}
					<span style={{ color: "#D97706", fontWeight: 900 }}>11 furgos</span>{" "}
					aparcadas.
					<br />
					El suelo está destrozado.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 2: Escalation ────────────────────────────────────────────────────

const Scene2Escalation: React.FC = () => {
	const frame = useCurrentFrame();
	const inOp = interpolate(frame, [0, 18], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const inY = interpolate(frame, [0, 18], [24, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			{/* Continue same footage from Scene 1, darker — one continuous shot */}
			<VideoBg
				src="videos/ai_Van_trying_to_park_full_parking.mp4"
				dimOpacity={0.72}
				duration={150}
				startFrame={100}
			/>

			<div
				style={{
					position: "absolute",
					top: 270,
					left: 60,
					right: 160,
					opacity: inOp,
					transform: `translateY(${inY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 52,
						fontWeight: 700,
						color: "rgba(255,255,255,0.85)",
						lineHeight: 1.3,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					Eso es lo que pasa cuando un spot tiene{" "}
					<span
						style={{
							color: "#D97706",
							fontWeight: 900,
							fontSize: 58,
						}}
					>
						400 reviews
					</span>{" "}
					en otras apps.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 3: Pivot ─────────────────────────────────────────────────────────

const Scene3Pivot: React.FC = () => {
	const frame = useCurrentFrame();

	const inOp = interpolate(frame, [0, 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const inY = interpolate(frame, [0, 20], [30, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// "Calcula" pops in later with amber
	const calcIn = interpolate(frame, [55, 75], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const calcScale = interpolate(frame, [55, 75], [0.85, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			{/* No video — stark dark break to feel different from problem scenes */}
			<div
				style={{
					position: "absolute",
					top: "35%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: 900,
					height: 900,
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(217,119,6,0.07) 0%, transparent 55%)",
					filter: "blur(80px)",
				}}
			/>

			<div
				style={{
					position: "absolute",
					top: 270,
					left: 60,
					right: 160,
					opacity: inOp,
					transform: `translateY(${inY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 88,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.05,
						letterSpacing: -2,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					WildSpotter
					<br />
					no comparte.
				</div>
			</div>

			{/* "Calcula." pops in */}
			<div
				style={{
					position: "absolute",
					top: 580,
					left: 60,
					opacity: calcIn,
					transform: `scale(${calcScale})`,
					transformOrigin: "left center",
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 104,
						fontWeight: 900,
						color: "#D97706",
						letterSpacing: -3,
						textShadow: "0 4px 24px rgba(0,0,0,0.9)",
					}}
				>
					Calcula.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 4: CTA ────────────────────────────────────────────────────────────

const Scene4CTA: React.FC = () => {
	const frame = useCurrentFrame();

	const heroIn = interpolate(frame, [0, 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const heroY = interpolate(frame, [0, 22], [30, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const statsIn = interpolate(frame, [35, 55], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const engIn = interpolate(frame, [80, 100], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const ctaIn = interpolate(frame, [120, 145], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaY = interpolate(frame, [120, 145], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Logo
	const logoIn = spring({
		frame,
		fps: 30, // assuming 30fps default, or get from useVideoConfig but fps is not imported in this scene yet
		delay: 110,
		config: { damping: 12, stiffness: 100 },
	});

	// Brand name
	const nameIn = spring({
		frame,
		fps: 30,
		delay: 120,
		config: { damping: 200 },
	});

	// Amber divider
	const lineWidth = interpolate(frame, [125, 145], [0, 250], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	// Count-up animation for the hero number
	const count = Math.round(
		interpolate(frame, [0, 55], [0, 83006], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.cubic),
		}),
	);
	const formatted = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			<VideoBg
				src="videos/lonely_beach_with_lifeguard_chair_and_waves_36723550_2160x3840_36723550.mp4"
				dimOpacity={0.45}
				duration={200}
			/>

			{/* Hero number */}
			<div
				style={{
					position: "absolute",
					top: 280,
					left: 60,
					right: 160,
					opacity: heroIn,
					transform: `translateY(${heroY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 100,
						fontWeight: 700,
						color: "#D97706",
						letterSpacing: -3,
						textShadow: "0 4px 24px rgba(0,0,0,0.9)",
					}}
				>
					{formatted}
				</div>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 48,
						fontWeight: 700,
						color: "rgba(255,255,255,0.9)",
						marginTop: -8,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					spots procesados.
				</div>
			</div>

			{/* Stats line */}
			<div
				style={{
					position: "absolute",
					top: 560,
					left: 60,
					right: 160,
					opacity: statsIn,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 46,
						fontWeight: 700,
						color: "rgba(255,255,255,0.85)",
						lineHeight: 1.3,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					Tú encuentras el que{" "}
					<span style={{ color: "#4ADE80" }}>nadie ha compartido</span> todavía.
				</div>
			</div>

			{/* Engagement question */}
			<div
				style={{
					position: "absolute",
					bottom: 850,
					left: 60,
					right: 160,
					opacity: engIn,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 40,
						fontWeight: 700,
						color: "rgba(255,255,255,0.82)",
						lineHeight: 1.35,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					¿A cuántos sitios "secretos" habéis llegado y estaban llenos? 👇
				</div>
			</div>

			{/* Logo */}
			<div
				style={{
					position: "absolute",
					bottom: 640,
					left: "50%",
					transform: `translate(-50%, 0) scale(${interpolate(logoIn, [0, 1], [0.5, 1])})`,
					opacity: logoIn,
				}}
			>
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 120,
						height: 120,
						borderRadius: 28,
						boxShadow: "0 8px 48px rgba(180,80,10,0.5)",
					}}
				/>
			</div>

			{/* Brand name */}
			<div
				style={{
					position: "absolute",
					bottom: 560,
					left: 0,
					right: 0,
					textAlign: "center",
					opacity: nameIn,
					transform: `translateY(${interpolate(nameIn, [0, 1], [25, 0])}px)`,
				}}
			>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 52,
						fontWeight: 700,
						color: "#FFFFFF",
						letterSpacing: 4,
						textShadow: "0 2px 20px rgba(0,0,0,0.8)",
					}}
				>
					WildSpotter
				</div>
			</div>

			{/* Amber divider */}
			<div
				style={{
					position: "absolute",
					bottom: 530,
					left: "50%",
					transform: "translateX(-50%)",
					width: lineWidth,
					height: 3,
					background:
						"linear-gradient(90deg, transparent, #D97706, transparent)",
					borderRadius: 2,
				}}
			/>

			{/* CTA pill */}
			<div
				style={{
					position: "absolute",
					bottom: 450,
					left: "50%",
					transform: `translate(-50%, ${ctaY}px)`,
					opacity: ctaIn,
				}}
			>
				<div
					style={{
						background: "#D97706",
						borderRadius: 50,
						paddingTop: 18,
						paddingBottom: 18,
						paddingLeft: 36,
						paddingRight: 36,
						display: "inline-block",
					}}
				>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 34,
							fontWeight: 900,
							color: "#0F0D0B",
							letterSpacing: -0.5,
						}}
					>
						Link en bio
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Music ───────────────────────────────────────────────────────────────────

const MusicTrack: React.FC = () => {
	const { durationInFrames, fps } = useVideoConfig();
	return (
		<Audio
			src={staticFile("audio/music/cyber-decrypt.mp3")}
			trimBefore={5 * fps}
			volume={(f) => {
				const fadeIn = interpolate(f, [0, 1 * fps], [0, 0.26], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
				const fadeOut = interpolate(
					f,
					[durationInFrames - 3 * fps, durationInFrames],
					[0.26, 0],
					{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
				);
				if (f < 1 * fps) return fadeIn;
				if (f > durationInFrames - 3 * fps) return fadeOut;
				return 0.26;
			}}
		/>
	);
};

// ─── Main composition ─────────────────────────────────────────────────────────

export const ElProblema: React.FC<ElProblemaProps> = ({
	hookVariant = "S1",
}) => {
	return (
		<>
			<MusicTrack />
			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={130}>
					<Scene1Hook variant={hookVariant} />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: 18 })}
				/>

				<TransitionSeries.Sequence durationInFrames={150}>
					<Scene2Escalation />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: 18 })}
				/>

				<TransitionSeries.Sequence durationInFrames={130}>
					<Scene3Pivot />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: 18 })}
				/>

				<TransitionSeries.Sequence durationInFrames={250}>
					<Scene4CTA />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</>
	);
};
