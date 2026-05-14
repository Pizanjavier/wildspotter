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

// S2 "El Peor Momento" — Night urgency problem-solution
// Scene durations: Night 130, Problem 170, Pivot 150, CTA 200 = 650
// 3 transitions × 18f = 54 overlap
// Total: 650 - 54 = 596 frames ≈ 19.9s
export const EL_PEOR_MOMENTO_FRAMES = 596;

export type ElPeorMomentoProps = {
	hookVariant: "S2" | "S2b";
};

// ─── Video background helper ───────────────────────────────────────────────

type VideoBgProps = {
	src: string;
	dimOpacity: number;
	duration: number;
	startFrame?: number;
	zoomEnd?: number;
};

const VideoBg: React.FC<VideoBgProps> = ({
	src,
	dimOpacity,
	duration,
	startFrame = 0,
	zoomEnd = 1.1,
}) => {
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, duration], [1.0, zoomEnd], {
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
					height: 650,
					background:
						"linear-gradient(180deg,rgba(15,13,11,0.97) 0%,rgba(15,13,11,0.55) 60%,transparent 100%)",
				}}
			/>
			{/* Bottom vignette */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 750,
					background:
						"linear-gradient(0deg,rgba(15,13,11,0.98) 0%,rgba(15,13,11,0.55) 60%,transparent 100%)",
				}}
			/>
		</AbsoluteFill>
	);
};

// ─── Scene 1: Night hook ─────────────────────────────────────────────────

type Scene1Props = { variant: "S2" | "S2b" };

const Scene1Night: React.FC<Scene1Props> = ({ variant }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Time stamp animates in big
	const timeIn = spring({ frame, fps, config: { damping: 160 } });
	const timeY = interpolate(timeIn, [0, 1], [60, 0]);

	const subIn = interpolate(frame, [55, 75], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const subY = interpolate(frame, [55, 75], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const isAlt = variant === "S2b";

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			{/* Night sky timelapse — AI clip, scale up to hide watermark */}
			<AbsoluteFill style={{ overflow: "hidden" }}>
				<div
					style={{
						position: "absolute",
						inset: "-5%",
						transform: `scale(${interpolate(frame, [0, 130], [1.08, 1.14], { extrapolateRight: "clamp" })})`,
						transformOrigin: "50% 50%",
					}}
				>
					<Video
						src={staticFile(
							"videos/view_of_the_horizon_at_dusk_over_cloudy_sky_3052476_1080x1920_3052476.mp4",
						)}
						muted
						loop
						style={{ width: "100%", height: "100%", objectFit: "cover" }}
					/>
				</div>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: "rgba(15,13,11,0.52)",
					}}
				/>
				{/* Top vignette */}
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						height: 650,
						background:
							"linear-gradient(180deg,rgba(15,13,11,0.97) 0%,rgba(15,13,11,0.55) 60%,transparent 100%)",
					}}
				/>
				{/* Bottom vignette */}
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: 750,
						background:
							"linear-gradient(0deg,rgba(15,13,11,0.98) 0%,rgba(15,13,11,0.55) 60%,transparent 100%)",
					}}
				/>
			</AbsoluteFill>

			{/* Time display */}
			<div
				style={{
					position: "absolute",
					top: 260,
					left: 60,
					right: 160,
					opacity: timeIn,
					transform: `translateY(${timeY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 130,
						fontWeight: 700,
						color: "#D97706",
						letterSpacing: -4,
						lineHeight: 1.0,
						textShadow: "0 6px 32px rgba(0,0,0,0.95)",
					}}
				>
					23:00
				</div>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 58,
						fontWeight: 900,
						color: "#FFFFFF",
						marginTop: 8,
						letterSpacing: -1,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					{isAlt ? "De la noche." : "Las 11 de la noche."}
				</div>
			</div>

			{/* Subtitle */}
			<div
				style={{
					position: "absolute",
					bottom: 490,
					left: 60,
					right: 160,
					opacity: subIn,
					transform: `translateY(${subY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 46,
						fontWeight: 700,
						color: "rgba(255,255,255,0.82)",
						lineHeight: 1.3,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					{isAlt
						? "Llevas horas conduciendo sin sitio."
						: "Llevas 4 horas conduciendo."}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 2: Problem escalation ──────────────────────────────────────────

const Scene2Problem: React.FC = () => {
	const frame = useCurrentFrame();

	const inOp = interpolate(frame, [0, 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const inY = interpolate(frame, [0, 20], [24, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const line2In = interpolate(frame, [38, 55], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const line3In = interpolate(frame, [70, 88], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			{/* Continue S1's night footage, darker — one continuous shot */}
			<VideoBg
				src="videos/view_of_the_horizon_at_dusk_over_cloudy_sky_3052476_1080x1920_3052476.mp4"
				dimOpacity={0.72}
				duration={170}
				startFrame={100}
				zoomEnd={1.08}
			/>

			<div
				style={{
					position: "absolute",
					top: 270,
					left: 60,
					right: 160,
				}}
			>
				<div
					style={{
						opacity: inOp,
						transform: `translateY(${inY}px)`,
						fontFamily: interFont,
						fontSize: 52,
						fontWeight: 700,
						color: "rgba(255,255,255,0.85)",
						lineHeight: 1.3,
						marginBottom: 24,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					El sitio que tenías guardado{" "}
					<span style={{ color: "#D97706" }}>ya no existe.</span>
				</div>

				<div
					style={{
						opacity: line2In,
						fontFamily: interFont,
						fontSize: 48,
						fontWeight: 700,
						color: "rgba(255,255,255,0.8)",
						lineHeight: 1.3,
						marginBottom: 24,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					Las apps de siempre te dan sitios llenos o cerrados.
				</div>

				<div
					style={{
						opacity: line3In,
						fontFamily: interFont,
						fontSize: 48,
						fontWeight: 700,
						color: "rgba(255,255,255,0.75)",
						lineHeight: 1.3,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					No tienes cobertura para buscar más.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 3: Pivot ──────────────────────────────────────────────────────

const Scene3Pivot: React.FC = () => {
	const frame = useCurrentFrame();

	const inOp = interpolate(frame, [0, 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const inY = interpolate(frame, [0, 22], [30, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const line2In = interpolate(frame, [50, 70], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const line2Scale = interpolate(frame, [50, 70], [0.88, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			{/* No video — stark dark break for the pivot moment */}
			<div
				style={{
					position: "absolute",
					top: "30%",
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
						fontSize: 62,
						fontWeight: 700,
						color: "rgba(255,255,255,0.88)",
						lineHeight: 1.2,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					Eso no le pasa a quien tiene el{" "}
					<span style={{ color: "#D97706", fontWeight: 900 }}>
						radar activo
					</span>{" "}
					antes de salir.
				</div>
			</div>

			{/* Amber accent bar */}
			<div
				style={{
					position: "absolute",
					top: 280,
					left: 50,
					width: 5,
					height: interpolate(frame, [10, 50], [0, 160], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
					background: "#D97706",
					borderRadius: 3,
				}}
			/>

			<div
				style={{
					position: "absolute",
					top: 650,
					left: 60,
					right: 160,
					opacity: line2In,
					transform: `scale(${line2Scale})`,
					transformOrigin: "left center",
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 42,
						fontWeight: 400,
						color: "#A0836C",
						lineHeight: 1.3,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					El radar trabaja offline. Descargado antes de salir, funciona sin
					señal.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 4: CTA ────────────────────────────────────────────────────────

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

	const statsIn = interpolate(frame, [40, 60], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const engIn = interpolate(frame, [80, 100], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const ctaIn = interpolate(frame, [125, 150], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaY = interpolate(frame, [125, 150], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Logo
	const logoIn = spring({
		frame,
		fps: 30, // assuming 30fps default
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
				src="videos/couple-cofee-outside-caravan.mp4"
				dimOpacity={0.48}
				duration={200}
				zoomEnd={1.08}
			/>

			{/* Hero count */}
			<div
				style={{
					position: "absolute",
					top: 270,
					left: 60,
					right: 160,
					opacity: heroIn,
					transform: `translateY(${heroY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 96,
						fontWeight: 700,
						color: "#D97706",
						letterSpacing: -3,
						lineHeight: 1.0,
						textShadow: "0 6px 32px rgba(0,0,0,0.9)",
					}}
				>
					{formatted}
				</div>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 46,
						fontWeight: 700,
						color: "#FFFFFF",
						marginTop: 4,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					spots analizados.
				</div>
			</div>

			{/* Subline */}
			<div
				style={{
					position: "absolute",
					top: 540,
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
					<span style={{ color: "#4ADE80" }}>Descárgalo</span> antes de
					necesitarlo.
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
					¿Os ha pasado quedarse sin sitio de noche? 👇
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
						Gratis en iOS y Android. Link en bio
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
			src={staticFile("audio/music/night-drive.mp3")}
			trimBefore={12 * fps}
			volume={(f) => {
				const fadeIn = interpolate(f, [0, 1 * fps], [0, 0.25], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
				const fadeOut = interpolate(
					f,
					[durationInFrames - 3 * fps, durationInFrames],
					[0.25, 0],
					{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
				);
				if (f < 1 * fps) return fadeIn;
				if (f > durationInFrames - 3 * fps) return fadeOut;
				return 0.25;
			}}
		/>
	);
};

// ─── Main composition ─────────────────────────────────────────────────────────

export const ElPeorMomento: React.FC<ElPeorMomentoProps> = ({
	hookVariant = "S2",
}) => {
	return (
		<>
			<MusicTrack />
			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={130}>
					<Scene1Night variant={hookVariant} />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: 18 })}
				/>

				<TransitionSeries.Sequence durationInFrames={170}>
					<Scene2Problem />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: 18 })}
				/>

				<TransitionSeries.Sequence durationInFrames={150}>
					<Scene3Pivot />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: 18 })}
				/>

				<TransitionSeries.Sequence durationInFrames={200}>
					<Scene4CTA />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</>
	);
};
