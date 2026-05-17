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

// W1 "83.006" — Data hero
// Scene durations: Counter 160, Breakdown 140, Pivot 150, CTA 190 = 640
// 3 transitions × 18f = 54 overlap
// Total: 640 - 54 = 586 frames ≈ 19.5s
export const OCHO_TRES_MIL_FRAMES = 586;

export type OchoTresMilProps = {
	hookVariant: "W1" | "W1b";
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
	const zoom = interpolate(frame, [0, duration], [1.0, 1.09], {
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
						"linear-gradient(180deg,rgba(15,13,11,0.97) 0%,rgba(15,13,11,0.5) 60%,transparent 100%)",
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

// ─── Animated counter ─────────────────────────────────────────────────────

const formatNumber = (n: number): string =>
	Math.round(n).toLocaleString("de-DE"); // dot as thousands separator: 83.006

type CounterProps = {
	targetValue: number;
	durationFrames: number;
};

const Counter: React.FC<CounterProps> = ({ targetValue, durationFrames }) => {
	const frame = useCurrentFrame();
	// Ease-out curve: fast start, slow finish
	const progress = interpolate(frame, [0, durationFrames], [0, 1], {
		extrapolateRight: "clamp",
		easing: (t) => 1 - Math.pow(1 - t, 3),
	});
	const value = progress * targetValue;
	return <>{formatNumber(value)}</>;
};

// ─── Scene 1: Counter ─────────────────────────────────────────────────────

type Scene1Props = { variant: "W1" | "W1b" };

const Scene1Counter: React.FC<Scene1Props> = ({ variant }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const labelIn = spring({ frame, fps, config: { damping: 200 } });
	const labelY = interpolate(labelIn, [0, 1], [35, 0]);

	const isAlt = variant === "W1b";

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			<VideoBg
				src="videos/aerial_view_of_verdant_forest_canopy_in_summer_31620899_2160x3840_31620899.mp4"
				dimOpacity={0.72}
				duration={160}
			/>

			{/* Label at top */}
			<div
				style={{
					position: "absolute",
					top: 270,
					left: 60,
					right: 160,
					opacity: labelIn,
					transform: `translateY(${labelY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: isAlt ? 56 : 52,
						fontWeight: 700,
						color: "rgba(255,255,255,0.8)",
						letterSpacing: -0.5,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					{isAlt
						? "Esto es lo que ha encontrado el radar:"
						: "spots analizados en toda España"}
				</div>
			</div>

			{/* Big animated counter */}
			<div
				style={{
					position: "absolute",
					top: 420,
					left: 55,
					right: 160,
				}}
			>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 124,
						fontWeight: 700,
						color: "#D97706",
						letterSpacing: -4,
						lineHeight: 1.0,
						textShadow: "0 6px 32px rgba(0,0,0,0.9)",
					}}
				>
					<Counter targetValue={83006} durationFrames={110} />
				</div>
				{!isAlt && (
					<div
						style={{
							fontFamily: interFont,
							fontSize: 42,
							fontWeight: 700,
							color: "rgba(255,255,255,0.7)",
							marginTop: 4,
							textShadow: "0 4px 16px rgba(0,0,0,0.8)",
						}}
					>
						spots analizados
					</div>
				)}
			</div>

			{/* Spain label */}
			<div
				style={{
					position: "absolute",
					bottom: 490,
					left: 60,
					opacity: interpolate(frame, [80, 100], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
				}}
			>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 30,
						fontWeight: 400,
						color: "#A0836C",
						letterSpacing: 2,
						textShadow: "0 2px 8px rgba(0,0,0,0.8)",
					}}
				>
					ESPAÑA COMPLETA · PIPELINE V4
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 2: Score breakdown ─────────────────────────────────────────────

type StatCardProps = {
	label: string;
	value: string;
	subLabel: string;
	color: string;
	delay: number;
};

const StatCard: React.FC<StatCardProps> = ({
	label,
	value,
	subLabel,
	color,
	delay,
}) => {
	const frame = useCurrentFrame();
	const inOp = interpolate(frame, [delay, delay + 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const inY = interpolate(frame, [delay, delay + 20], [22, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				opacity: inOp,
				transform: `translateY(${inY}px)`,
				background: "rgba(30,26,23,0.9)",
				border: `2px solid ${color}40`,
				borderLeft: `4px solid ${color}`,
				borderRadius: 16,
				padding: "28px 32px",
				marginBottom: 20,
			}}
		>
			<div
				style={{
					fontFamily: monoFont,
					fontSize: 28,
					fontWeight: 400,
					color: "#A0836C",
					letterSpacing: 1,
					marginBottom: 4,
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontFamily: monoFont,
					fontSize: 72,
					fontWeight: 700,
					color,
					letterSpacing: -2,
					lineHeight: 1.0,
				}}
			>
				{value}
			</div>
			<div
				style={{
					fontFamily: interFont,
					fontSize: 32,
					fontWeight: 400,
					color: "rgba(255,255,255,0.65)",
					marginTop: 4,
				}}
			>
				{subLabel}
			</div>
		</div>
	);
};

const Scene2Breakdown: React.FC = () => {
	const frame = useCurrentFrame();

	const titleIn = interpolate(frame, [0, 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			<VideoBg
				src="videos/stunning_aerial_view_of_lush_green_forest_canopy_28870593_2160x3840_28870593.mp4"
				dimOpacity={0.78}
				duration={140}
				startFrame={5.3}
			/>

			<div
				style={{
					position: "absolute",
					top: 270,
					left: 60,
					right: 160,
					opacity: titleIn,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 44,
						fontWeight: 700,
						color: "#A0836C",
						letterSpacing: 1,
						marginBottom: 32,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					DE ESA MUESTRA:
				</div>

				<StatCard
					label="Media de score"
					value="21,7"
					subLabel="de 100 posible"
					color="#FBBF24"
					delay={10}
				/>
				<StatCard
					label="Score mayor de 70"
					value="393"
					subLabel="spots de calidad"
					color="#22D3EE"
					delay={32}
				/>
				<StatCard
					label="Score mayor de 80"
					value="41"
					subLabel="spots excepcionales"
					color="#4ADE80"
					delay={52}
				/>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 3: Emotional pivot ─────────────────────────────────────────────

const Scene3Pivot: React.FC = () => {
	const frame = useCurrentFrame();

	const inOp = interpolate(frame, [0, 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const inY = interpolate(frame, [0, 20], [28, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const line2In = interpolate(frame, [45, 65], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			<VideoBg
				src="videos/serene_pine_forest_landscape_captured_in_summer_32728427_2160x3840_32728427.mp4"
				dimOpacity={0.52}
				duration={150}
			/>

			<div
				style={{
					position: "absolute",
					top: 280,
					left: 60,
					right: 160,
					opacity: inOp,
					transform: `translateY(${inY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 78,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.1,
						letterSpacing: -2,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					El radar no te da los mejores sitios del mundo.
				</div>
			</div>

			<div
				style={{
					position: "absolute",
					top: 680,
					left: 60,
					right: 160,
					opacity: line2In,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 72,
						fontWeight: 900,
						color: "#D97706",
						lineHeight: 1.1,
						letterSpacing: -2,
						textShadow: "0 4px 24px rgba(0,0,0,0.9)",
					}}
				>
					Te da los que nadie más te va a dar.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 4: CTA ─────────────────────────────────────────────────────────

const Scene4CTA: React.FC = () => {
	const frame = useCurrentFrame();

	const heroIn = interpolate(frame, [0, 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const heroY = interpolate(frame, [0, 22], [28, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const engIn = interpolate(frame, [55, 75], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const ctaIn = interpolate(frame, [110, 135], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaY = interpolate(frame, [110, 135], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Logo
	const logoIn = spring({
		frame,
		fps: 30, // assuming 30fps default
		delay: 100,
		config: { damping: 12, stiffness: 100 },
	});

	// Brand name
	const nameIn = spring({
		frame,
		fps: 30,
		delay: 110,
		config: { damping: 200 },
	});

	// Amber divider
	const lineWidth = interpolate(frame, [115, 135], [0, 250], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			<VideoBg
				src="videos/aerial_view_of_scenic_forest_road_in_summer_34239173_1080x1920_34239173.mp4"
				dimOpacity={0.48}
				duration={190}
			/>

			{/* Engagement question */}
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
						fontFamily: interFont,
						fontSize: 58,
						fontWeight: 700,
						color: "rgba(255,255,255,0.9)",
						lineHeight: 1.25,
						letterSpacing: -0.5,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					¿Cuántos crees que hay cerca de donde estás ahora? 👇
				</div>
			</div>

			{/* CTA block */}
			<div
				style={{
					position: "absolute",
					bottom: 760,
					left: 60,
					right: 160,
					opacity: engIn,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 44,
						fontWeight: 700,
						color: "rgba(255,255,255,0.82)",
						lineHeight: 1.3,
						textShadow: "0 4px 16px rgba(0,0,0,0.8)",
					}}
				>
					83.006 spots analizados.
					<br />
					<span style={{ color: "#4ADE80" }}>
						Solo 41 con score mayor de 80.
					</span>
				</div>
			</div>

			{/* Logo */}
			<div
				style={{
					position: "absolute",
					bottom: 620,
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
					bottom: 540,
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
					bottom: 510,
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
					bottom: 460,
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
			src={staticFile("audio/music/data-reveal.mp3")}
			trimBefore={8 * fps}
			volume={(f) => {
				const fadeIn = interpolate(f, [0, 1.2 * fps], [0, 0.28], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
				const fadeOut = interpolate(
					f,
					[durationInFrames - 3 * fps, durationInFrames],
					[0.28, 0],
					{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
				);
				if (f < 1.2 * fps) return fadeIn;
				if (f > durationInFrames - 3 * fps) return fadeOut;
				return 0.28;
			}}
		/>
	);
};

// ─── Main composition ─────────────────────────────────────────────────────────

export const OchoTresMil: React.FC<OchoTresMilProps> = ({
	hookVariant = "W1",
}) => {
	return (
		<>
			<MusicTrack />
			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={160}>
					<Scene1Counter variant={hookVariant} />
				</TransitionSeries.Sequence>

				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({ durationInFrames: 18 })}
				/>

				<TransitionSeries.Sequence durationInFrames={140}>
					<Scene2Breakdown />
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

				<TransitionSeries.Sequence durationInFrames={190}>
					<Scene4CTA />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</>
	);
};
