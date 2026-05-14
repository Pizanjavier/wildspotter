import { Audio } from "@remotion/media";
import { Video } from "@remotion/media";
import {
	AbsoluteFill,
	Easing,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
loadJetBrains("normal", { weights: ["400", "700"], subsets: ["latin"] });

// ─── Palette ───────────────────────────────────────────────────────────────
const BG = "#0F0D0B";
const CARD = "#1E1A17";
const AMBER = "#D97706";
const GREEN = "#4ADE80";
const MUTED = "#A0836C";
const BORDER = "#3D3530";

// ─── Scene durations ───────────────────────────────────────────────────────
const S1_DUR = 150; // 5s — Hero score reveal
const S2_DUR = 195; // 6.5s — Data cascade
const S3_DUR = 135; // 4.5s — Emotional pivot
const S4_DUR = 180; // 6s — CTA
const TRANSITION_FRAMES = 18;

export const UN_NOVENTA_FRAMES =
	S1_DUR + S2_DUR + S3_DUR + S4_DUR - 3 * TRANSITION_FRAMES;

// ─── Helper components ─────────────────────────────────────────────────────

const VideoBackground: React.FC<{
	src: string;
	opacity?: number;
	scale?: [number, number];
	duration: number;
}> = ({ src, opacity = 0.35, scale = [1.0, 1.08], duration }) => {
	const frame = useCurrentFrame();
	const bgScale = interpolate(frame, [0, duration], scale, {
		extrapolateRight: "clamp",
	});
	return (
		<AbsoluteFill style={{ opacity }}>
			<Video
				src={staticFile(src)}
				muted
				loop
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: `scale(${bgScale})`,
				}}
			/>
		</AbsoluteFill>
	);
};

// ─── Scene 1: Hero score reveal ────────────────────────────────────────────

const Scene1Hero: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Score counter: 0 -> 91 over first 90 frames, then slam to 91
	const countProgress = interpolate(frame, [20, 90], [0, 89], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});
	const slamSpring = spring({
		frame: frame - 85,
		fps,
		config: { damping: 8, stiffness: 280, mass: 0.9 },
		durationInFrames: 25,
	});
	const slamValue = interpolate(slamSpring, [0, 1], [0, 2], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const displayScore = Math.min(
		frame < 90 ? countProgress : 89 + slamValue,
		91,
	);

	// Ring fill
	const SIZE = 380;
	const STROKE = 16;
	const radius = (SIZE - STROKE) / 2;
	const circumference = 2 * Math.PI * radius;
	const fillProgress = spring({
		frame: frame - 15,
		fps,
		config: { damping: 14, stiffness: 100 },
		durationInFrames: 90,
	});
	const dashOffset =
		circumference * (1 - interpolate(fillProgress, [0, 1], [0, 0.91]));
	const glowOpacity = interpolate(
		(frame * 1.5) % 90,
		[0, 45, 90],
		[0.5, 1.0, 0.5],
	);

	const subtitleOpacity = spring({
		frame: frame - 105,
		fps,
		config: { damping: 20, stiffness: 120 },
		durationInFrames: 25,
	});

	const labelOpacity = spring({
		frame: frame - 18,
		fps,
		config: { damping: 20, stiffness: 80 },
		durationInFrames: 30,
	});

	return (
		<AbsoluteFill style={{ background: BG }}>
			<VideoBackground
				src="videos/waves_rushing_to_the_shore_8045150_1080x1920_8045150.mp4"
				opacity={0.2}
				scale={[1.0, 1.1]}
				duration={S1_DUR}
			/>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse at 50% 45%, transparent 0%, ${BG}cc 55%, ${BG} 100%)`,
				}}
			/>

			<AbsoluteFill
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					paddingTop: 250,
					paddingBottom: 450,
					paddingLeft: 50,
					paddingRight: 150,
					gap: 0,
				}}
			>
				{/* "Un" label */}
				<div
					style={{
						opacity: labelOpacity,
						fontFamily: "Inter, sans-serif",
						fontSize: 52,
						fontWeight: 400,
						color: MUTED,
						letterSpacing: 4,
						textTransform: "uppercase",
						marginBottom: 16,
					}}
				>
					Un
				</div>

				{/* Score ring */}
				<div
					style={{
						position: "relative",
						width: SIZE,
						height: SIZE,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<svg
						width={SIZE}
						height={SIZE}
						style={{
							position: "absolute",
							inset: 0,
							transform: "rotate(-90deg)",
						}}
					>
						<circle
							cx={SIZE / 2}
							cy={SIZE / 2}
							r={radius}
							fill="none"
							stroke="#3D353044"
							strokeWidth={STROKE}
						/>
						<circle
							cx={SIZE / 2}
							cy={SIZE / 2}
							r={radius}
							fill="none"
							stroke={GREEN}
							strokeWidth={STROKE}
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={dashOffset}
							style={{
								filter: `drop-shadow(0 0 ${10 * glowOpacity}px ${GREEN})`,
							}}
						/>
					</svg>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 6,
						}}
					>
						<span
							style={{
								fontFamily: "JetBrains Mono, monospace",
								fontSize: SIZE * 0.26,
								fontWeight: 700,
								color: GREEN,
								lineHeight: 1,
								letterSpacing: -4,
								textShadow: `0 0 30px ${GREEN}88`,
							}}
						>
							{Math.round(displayScore)}
						</span>
						<span
							style={{
								fontFamily: "JetBrains Mono, monospace",
								fontSize: SIZE * 0.075,
								fontWeight: 400,
								color: MUTED,
								letterSpacing: 3,
								textTransform: "uppercase",
							}}
						>
							/ 100
						</span>
					</div>
				</div>

				{/* Subtitle */}
				<div
					style={{
						opacity: subtitleOpacity,
						fontFamily: "Inter, sans-serif",
						fontSize: 38,
						fontWeight: 400,
						color: MUTED,
						marginTop: 24,
						textAlign: "center",
						maxWidth: 640,
						lineHeight: 1.4,
					}}
				>
					sobre 100.
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ─── Scene 2: Data cascade ─────────────────────────────────────────────────

type DataPoint = { label: string; value: string; icon?: string };

const DataRow: React.FC<{ item: DataPoint; startFrame: number }> = ({
	item,
	startFrame,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const appear = spring({
		frame: frame - startFrame,
		fps,
		config: { damping: 18, stiffness: 140 },
		durationInFrames: 22,
	});

	return (
		<div
			style={{
				opacity: appear,
				transform: `translateX(${interpolate(appear, [0, 1], [-40, 0])}px)`,
				display: "flex",
				alignItems: "center",
				gap: 20,
				background: `${CARD}cc`,
				border: `1px solid ${BORDER}`,
				borderRadius: 14,
				padding: "18px 28px",
				width: "100%",
				boxSizing: "border-box",
			}}
		>
			<span
				style={{
					fontFamily: "JetBrains Mono, monospace",
					fontSize: 28,
					fontWeight: 700,
					color: AMBER,
					minWidth: 32,
					textAlign: "center",
				}}
			>
				{item.icon ?? "›"}
			</span>
			<div style={{ flex: 1 }}>
				<div
					style={{
						fontFamily: "Inter, sans-serif",
						fontSize: 34,
						fontWeight: 700,
						color: "#FFFFFF",
						lineHeight: 1.2,
					}}
				>
					{item.value}
				</div>
				<div
					style={{
						fontFamily: "JetBrains Mono, monospace",
						fontSize: 22,
						fontWeight: 400,
						color: MUTED,
						marginTop: 2,
					}}
				>
					{item.label}
				</div>
			</div>
		</div>
	);
};

const DATA_POINTS: DataPoint[] = [
	{ icon: "👁", label: "Vista al mar", value: "120m de altura" },
	{ icon: "🏗", label: "Edificios en 300m", value: "0 edificios" },
	{ icon: "👥", label: "Vecinos en 2km", value: "0 vecinos" },
	{ icon: "⬛", label: "Pendiente del terreno", value: "Suelo plano" },
	{ icon: "✅", label: "Zonas protegidas", value: "Fuera" },
	{ icon: "🛤", label: "Tipo de acceso", value: "Pista sin salida" },
];

const Scene2Data: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const headerOpacity = spring({
		frame: frame - 10,
		fps,
		config: { damping: 20, stiffness: 100 },
		durationInFrames: 25,
	});

	return (
		<AbsoluteFill style={{ background: BG }}>
			<VideoBackground
				src="videos/waves_crashing_the_cliff_coast_5667128_2160x4096_5667128.mp4"
				opacity={0.12}
				scale={[1.0, 1.06]}
				duration={S2_DUR}
			/>
			<AbsoluteFill
				style={{
					background: `linear-gradient(180deg, ${BG}ee 0%, ${BG}99 50%, ${BG}ee 100%)`,
				}}
			/>

			<AbsoluteFill
				style={{
					display: "flex",
					flexDirection: "column",
					paddingTop: 260,
					paddingBottom: 460,
					paddingLeft: 60,
					paddingRight: 160,
					gap: 14,
				}}
			>
				{/* Header */}
				<div
					style={{
						opacity: headerOpacity,
						fontFamily: "JetBrains Mono, monospace",
						fontSize: 26,
						fontWeight: 700,
						color: AMBER,
						letterSpacing: 3,
						textTransform: "uppercase",
						marginBottom: 12,
					}}
				>
					Análisis del spot
				</div>

				{/* Data rows staggered */}
				{DATA_POINTS.map((item, i) => (
					<DataRow key={item.label} item={item} startFrame={20 + i * 22} />
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ─── Scene 3: Emotional pivot ──────────────────────────────────────────────

const Scene3Pivot: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const line1Opacity = spring({
		frame: frame - 15,
		fps,
		config: { damping: 18, stiffness: 100 },
		durationInFrames: 30,
	});
	const line2Opacity = spring({
		frame: frame - 55,
		fps,
		config: { damping: 18, stiffness: 100 },
		durationInFrames: 30,
	});

	return (
		<AbsoluteFill style={{ background: BG }}>
			<VideoBackground
				src="videos/top_view_of_a_sea_waves_crashing_on_the_rocks_13869670_1080x1920_13869670.mp4"
				opacity={0.22}
				scale={[1.0, 1.07]}
				duration={S3_DUR}
			/>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse at 50% 60%, transparent 0%, ${BG}cc 60%, ${BG} 100%)`,
				}}
			/>

			<AbsoluteFill
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					paddingTop: 250,
					paddingBottom: 450,
					paddingLeft: 80,
					paddingRight: 180,
					gap: 28,
				}}
			>
				<div
					style={{
						opacity: line1Opacity,
						transform: `translateY(${interpolate(line1Opacity, [0, 1], [24, 0])}px)`,
						fontFamily: "Inter, sans-serif",
						fontSize: 72,
						fontWeight: 900,
						color: "#FFFFFF",
						textAlign: "center",
						lineHeight: 1.15,
						letterSpacing: -2,
						textShadow: "0 4px 24px rgba(0,0,0,0.8)",
					}}
				>
					El radar lo encontró antes de que nadie lo compartiera.
				</div>
				<div
					style={{
						opacity: line2Opacity,
						fontFamily: "Inter, sans-serif",
						fontSize: 42,
						fontWeight: 400,
						color: MUTED,
						textAlign: "center",
						lineHeight: 1.4,
						maxWidth: 680,
					}}
				>
					Sin reviews. Sin coordinates compartidas. Solo datos.
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ─── Scene 4: CTA ──────────────────────────────────────────────────────────

const Scene4CTA: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const questionOpacity = spring({
		frame: frame - 15,
		fps,
		config: { damping: 18, stiffness: 100 },
		durationInFrames: 30,
	});
	const emojiScale = spring({
		frame: frame - 30,
		fps,
		config: { damping: 10, stiffness: 200 },
		durationInFrames: 20,
	});
	const ctaOpacity = spring({
		frame: frame - 70,
		fps,
		config: { damping: 18, stiffness: 120 },
		durationInFrames: 30,
	});
	const badgeOpacity = spring({
		frame: frame - 110,
		fps,
		config: { damping: 18, stiffness: 120 },
		durationInFrames: 25,
	});

	return (
		<AbsoluteFill style={{ background: BG }}>
			<VideoBackground
				src="videos/lonely_beach_with_lifeguard_chair_and_waves_36723550_2160x3840_36723550.mp4"
				opacity={0.28}
				scale={[1.0, 1.08]}
				duration={S4_DUR}
			/>
			<AbsoluteFill
				style={{
					background: `linear-gradient(180deg, ${BG}dd 0%, ${BG}88 40%, ${BG}dd 100%)`,
				}}
			/>

			<AbsoluteFill
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					paddingTop: 250,
					paddingBottom: 450,
					paddingLeft: 60,
					paddingRight: 160,
					gap: 32,
				}}
			>
				{/* Engagement question */}
				<div
					style={{
						opacity: questionOpacity,
						transform: `translateY(${interpolate(questionOpacity, [0, 1], [20, 0])}px)`,
						fontFamily: "Inter, sans-serif",
						fontSize: 68,
						fontWeight: 900,
						color: "#FFFFFF",
						textAlign: "center",
						lineHeight: 1.2,
						letterSpacing: -1,
						textShadow: "0 4px 24px rgba(0,0,0,0.8)",
					}}
				>
					¿Costa del norte o del sur?
				</div>
				<div
					style={{
						opacity: questionOpacity,
						fontFamily: "Inter, sans-serif",
						fontSize: 50,
						fontWeight: 700,
						color: AMBER,
						textAlign: "center",
						textShadow: `0 4px 16px ${AMBER}44`,
					}}
				>
					¿Qué crees?
				</div>

				{/* Emoji bounce */}
				<div
					style={{
						opacity: emojiScale,
						transform: `scale(${interpolate(emojiScale, [0, 1], [0.6, 1])})`,
						fontSize: 72,
						lineHeight: 1,
					}}
				>
					👇
				</div>

				{/* CTA pill */}
				<div
					style={{
						opacity: ctaOpacity,
						transform: `translateY(${interpolate(ctaOpacity, [0, 1], [16, 0])}px)`,
						fontFamily: "Inter, sans-serif",
						fontSize: 36,
						fontWeight: 700,
						color: MUTED,
						textAlign: "center",
						lineHeight: 1.5,
					}}
				>
					Solo en WildSpotter.
				</div>

				{/* Download badge */}
				<div
					style={{
						opacity: badgeOpacity,
						display: "flex",
						alignItems: "center",
						gap: 16,
						background: `${CARD}ee`,
						border: `1.5px solid ${AMBER}55`,
						borderRadius: 16,
						padding: "18px 36px",
						boxShadow: `0 0 24px ${AMBER}22`,
					}}
				>
					<span style={{ fontSize: 38 }}>📲</span>
					<div>
						<div
							style={{
								fontFamily: "Inter, sans-serif",
								fontSize: 36,
								fontWeight: 700,
								color: "#FFFFFF",
							}}
						>
							Gratis en iOS y Android.
						</div>
						<div
							style={{
								fontFamily: "JetBrains Mono, monospace",
								fontSize: 24,
								fontWeight: 400,
								color: AMBER,
							}}
						>
							link en bio ↗
						</div>
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ─── Root composition ──────────────────────────────────────────────────────

export const UnNoventa: React.FC = () => {
	const { durationInFrames } = useVideoConfig();

	return (
		<AbsoluteFill style={{ background: BG }}>
			<Audio
				src={staticFile("audio/music/data-reveal.mp3")}
				volume={(f) =>
					interpolate(
						f,
						[0, 25, durationInFrames - 90, durationInFrames],
						[0, 0.35, 0.35, 0],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					)
				}
			/>

			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={S1_DUR}>
					<Scene1Hero />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
					presentation={fade()}
				/>

				<TransitionSeries.Sequence durationInFrames={S2_DUR}>
					<Scene2Data />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
					presentation={fade()}
				/>

				<TransitionSeries.Sequence durationInFrames={S3_DUR}>
					<Scene3Pivot />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
					presentation={fade()}
				/>

				<TransitionSeries.Sequence durationInFrames={S4_DUR}>
					<Scene4CTA />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</AbsoluteFill>
	);
};
