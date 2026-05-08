import { Audio, Video } from "@remotion/media";
import {
	AbsoluteFill,
	Easing,
	Img,
	Sequence,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import {
	StoreInstallIntro,
	STORE_INTRO_FRAMES,
} from "./components/StoreInstallIntro";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "900"],
	subsets: ["latin"],
});

const { fontFamily: monoFont } = loadJetBrains("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});

// Scene gross durations (within TransitionSeries, before transition overlap)
// S1=150 + S2=155 + S3=140 + S4=190 — 3 transitions × 18f = 576 net
const S1_DUR = 150; // 5.0s — score reveal
const S2_DUR = 155; // 5.2s — landscape data
const S3_DUR = 140; // 4.7s — soil info card
const S4_DUR = 190; // 6.3s — CTA + logo (CTA needs 6s+)
const TRANSITION_FRAMES = 18;

// Net frames: 150 + 155 + 140 + 190 - 3×18 = 581
export const EL_RADAR_ENCONTRO_FRAMES =
	S1_DUR + S2_DUR + S3_DUR + S4_DUR - 3 * TRANSITION_FRAMES;

// ── Variant data ──────────────────────────────────────────────────────────────

export type ElRadarEncontroVariant = "M1" | "M2" | "M3";

export type ElRadarEncontroProps = {
	variant: ElRadarEncontroVariant;
	withIntro?: boolean;
};

type VariantData = {
	score: number;
	scoreColor: string;
	biomeFootage: string;
	biomeDimS1: number;
	biomeDimS2: number;
	payoffFootage: string;
	payoffDimS3: number;
	payoffDimS4: number;
	musicTrack: string;
	dataLine1: string;
	dataLine2: string;
	infoLine1: string;
	infoLine2: string;
	closingLine: string;
	biomeLabel: string;
};

const VARIANT_DATA: Record<ElRadarEncontroVariant, VariantData> = {
	M1: {
		score: 81,
		scoreColor: "#4ADE80",
		biomeFootage: "videos/stunning_aerial_views_of_rocky_kefalonia_coast_29784774_1080x1920_29784774.mp4",
		biomeDimS1: 0.52,
		biomeDimS2: 0.22,
		payoffFootage: "videos/ai_Campervan_Sunset_Time_Lapse_Video.mp4",
		payoffDimS3: 0.78,
		payoffDimS4: 0.38,
		musicTrack: "spirit-in-the-woods",
		dataLine1: "300m de una playa sin nombre.",
		dataLine2: "0 edificios en 500m.  Pendiente: 2.3%.",
		infoLine1: "Vegetación esclerófila.",
		infoLine2: "Zona no protegida.",
		closingLine: "¿Dónde crees que está?",
		biomeLabel: "COSTA · ZONA VIRGEN",
	},
	M2: {
		score: 84,
		scoreColor: "#4ADE80",
		biomeFootage: "videos/serene_pine_forest_landscape_captured_in_summer_32728427_2160x3840_32728427.mp4",
		biomeDimS1: 0.5,
		biomeDimS2: 0.24,
		payoffFootage: "videos/ai_Stars_Timelapse_Van_Night.mp4",
		payoffDimS3: 0.75,
		payoffDimS4: 0.4,
		musicTrack: "spirit-in-the-woods",
		dataLine1: "Final de camino de tierra. 850m altitud.",
		dataLine2: "0 carreteras en 300m.  0 edificios.  Pendiente: 1.8%.",
		infoLine1: "Bosque de coníferas.",
		infoLine2: "Uso del suelo: forestal.",
		closingLine: "El radar lo encontró.\nLa ubicación es tuya.",
		biomeLabel: "MONTAÑA · BOSQUE",
	},
	M3: {
		score: 78,
		scoreColor: "#22D3EE",
		biomeFootage: "videos/aerial_view_of_van_journey_through_desert_terrain_35743112_2160x3840_35743112.mp4",
		biomeDimS1: 0.55,
		biomeDimS2: 0.3,
		payoffFootage: "videos/ai_Couple_Morning_Coffee_Van.mp4",
		payoffDimS3: 0.72,
		payoffDimS4: 0.44,
		musicTrack: "rising-tide",
		dataLine1: "Meseta castellana. Final de camino agrícola.",
		dataLine2: "Sin edificios en 500m.  Sin carreteras en 1km.",
		infoLine1: "Pastizal natural. Zona no protegida.",
		infoLine2: "Pendiente: 0.9%.  Silencio absoluto.",
		closingLine: "¿Dónde crees que está?",
		biomeLabel: "INTERIOR · MESETA",
	},
};

// ── Shared primitives ─────────────────────────────────────────────────────────

// Ken Burns wrapper — uses the scene-local frame from useCurrentFrame()
const BgVideo: React.FC<{
	src: string;
	dimOpacity: number;
	kenBurnsTo?: number;
}> = ({ src, dimOpacity, kenBurnsTo = 1.1 }) => {
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
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundColor: `rgba(0,0,0,${dimOpacity})`,
				}}
			/>
		</div>
	);
};

const TopGrad: React.FC = () => (
	<div
		style={{
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			height: 280,
			background:
				"linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)",
		}}
	/>
);

const BottomGrad: React.FC<{ h?: number; s?: number }> = ({
	h = 600,
	s = 0.7,
}) => (
	<div
		style={{
			position: "absolute",
			bottom: 0,
			left: 0,
			right: 0,
			height: h,
			background: `linear-gradient(0deg, rgba(0,0,0,${s}) 0%, rgba(0,0,0,${s * 0.4}) 55%, transparent 100%)`,
		}}
	/>
);

// ── Scene 1: Score counter ────────────────────────────────────────────────────
// useCurrentFrame() is scene-local thanks to TransitionSeries.Sequence

const Scene1Score: React.FC<{
	score: number;
	color: string;
	footage: string;
	dim: number;
	biomeLabel: string;
}> = ({ score, color, footage, dim, biomeLabel }) => {
	const frame = useCurrentFrame();

	const counted = Math.round(
		interpolate(frame, [0, 88], [0, score], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.cubic),
		}),
	);

	const labelOp = interpolate(frame, [5, 28], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const numOp = interpolate(frame, [8, 32], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const biomeOp = interpolate(frame, [82, 110], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Pulse when counter reaches target
	const pulseIn = interpolate(frame, [88, 100], [1.0, 1.05], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});
	const pulseOut = interpolate(frame, [100, 116], [1.05, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const pulseScale = frame < 100 ? pulseIn : pulseOut;

	return (
		<AbsoluteFill style={{ overflow: "hidden" }}>
			<BgVideo src={footage} dimOpacity={dim} kenBurnsTo={1.08} />
			<TopGrad />
			<BottomGrad />

			{/* Central score block */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 6,
				}}
			>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 38,
						fontWeight: 400,
						color: "rgba(255,255,255,0.5)",
						letterSpacing: 6,
						textTransform: "uppercase",
						opacity: labelOp,
						textShadow: "0 2px 12px rgba(0,0,0,0.8)",
					}}
				>
					Score
				</div>

				<div
					style={{
						display: "flex",
						alignItems: "baseline",
						gap: 6,
						opacity: numOp,
						transform: `scale(${pulseScale})`,
					}}
				>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 230,
							fontWeight: 700,
							color,
							lineHeight: 0.88,
							letterSpacing: -10,
							textShadow: `0 0 90px ${color}44, 0 4px 35px rgba(0,0,0,0.95)`,
						}}
					>
						{counted}
					</div>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 68,
							fontWeight: 400,
							color: "rgba(255,255,255,0.35)",
							lineHeight: 1,
							marginBottom: 10,
						}}
					>
						/100
					</div>
				</div>

				<div
					style={{
						marginTop: 28,
						padding: "10px 30px",
						border: `1.5px solid ${color}55`,
						borderRadius: 6,
						opacity: biomeOp,
					}}
				>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 30,
							fontWeight: 400,
							color,
							letterSpacing: 3.5,
							textTransform: "uppercase",
							textShadow: `0 0 20px ${color}55`,
						}}
					>
						{biomeLabel}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Scene 2: Landscape footage + data metrics ─────────────────────────────────

const Scene2Data: React.FC<{
	footage: string;
	dim: number;
	dataLine1: string;
	dataLine2: string;
	color: string;
}> = ({ footage, dim, dataLine1, dataLine2, color }) => {
	const frame = useCurrentFrame();

	const barW = interpolate(frame, [8, 30], [0, 52], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const line1Op = interpolate(frame, [14, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const line1Y = interpolate(frame, [14, 40], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const line2Op = interpolate(frame, [38, 65], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const line2Y = interpolate(frame, [38, 65], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ overflow: "hidden" }}>
			<BgVideo src={footage} dimOpacity={dim} kenBurnsTo={1.12} />
			<TopGrad />
			<BottomGrad h={820} s={0.78} />

			<div
				style={{
					position: "absolute",
					bottom: 240,
					left: 60,
					right: 60,
				}}
			>
				{/* Accent bar */}
				<div
					style={{
						width: barW,
						height: 4,
						backgroundColor: color,
						marginBottom: 26,
						borderRadius: 2,
						boxShadow: `0 0 14px ${color}88`,
					}}
				/>

				<div
					style={{
						opacity: line1Op,
						transform: `translateY(${line1Y}px)`,
						marginBottom: 22,
					}}
				>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 74,
							fontWeight: 700,
							color: "#FFFFFF",
							lineHeight: 1.2,
							letterSpacing: -2,
							textShadow: "0 3px 22px rgba(0,0,0,0.9)",
						}}
					>
						{dataLine1}
					</div>
				</div>

				<div
					style={{
						opacity: line2Op,
						transform: `translateY(${line2Y}px)`,
					}}
				>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 44,
							fontWeight: 400,
							color: "rgba(255,255,255,0.78)",
							lineHeight: 1.45,
							textShadow: "0 2px 14px rgba(0,0,0,0.85)",
						}}
					>
						{dataLine2}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Scene 3: Soil info card over darkened footage ─────────────────────────────

const Scene3Info: React.FC<{
	footage: string;
	dim: number;
	infoLine1: string;
	infoLine2: string;
	color: string;
}> = ({ footage, dim, infoLine1, infoLine2, color }) => {
	const frame = useCurrentFrame();

	const cardOp = interpolate(frame, [10, 36], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const cardY = interpolate(frame, [10, 36], [18, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const info2Op = interpolate(frame, [35, 62], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	// Scan lines fade in — gives "radar data" texture
	const linesOp = interpolate(frame, [0, 25], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ overflow: "hidden" }}>
			<BgVideo src={footage} dimOpacity={dim} kenBurnsTo={1.09} />
			<TopGrad />
			<BottomGrad h={750} s={0.8} />

			{/* Subtle horizontal scan lines for radar aesthetic */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage:
						"repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 7px)",
					opacity: linesOp,
					pointerEvents: "none",
				}}
			/>

			{/* Data card — vertically centered */}
			<div
				style={{
					position: "absolute",
					top: "50%",
					left: 56,
					right: 56,
					transform: `translateY(calc(-50% + ${cardY}px))`,
					opacity: cardOp,
				}}
			>
				<div
					style={{
						background: "rgba(0,0,0,0.52)",
						border: `1px solid ${color}44`,
						borderLeft: `4px solid ${color}`,
						borderRadius: 14,
						padding: "40px 50px",
					}}
				>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 28,
							fontWeight: 400,
							color,
							letterSpacing: 4,
							textTransform: "uppercase",
							marginBottom: 22,
							opacity: 0.8,
						}}
					>
						Análisis de suelo
					</div>

					<div
						style={{
							fontFamily: interFont,
							fontSize: 68,
							fontWeight: 700,
							color: "#FFFFFF",
							lineHeight: 1.25,
							letterSpacing: -2,
							textShadow: "0 3px 20px rgba(0,0,0,0.7)",
							marginBottom: 18,
						}}
					>
						{infoLine1}
					</div>

					<div style={{ opacity: info2Op }}>
						<div
							style={{
								fontFamily: monoFont,
								fontSize: 40,
								fontWeight: 400,
								color: "rgba(255,255,255,0.72)",
								lineHeight: 1.45,
								textShadow: "0 2px 12px rgba(0,0,0,0.7)",
							}}
						>
							{infoLine2}
						</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Scene 4: CTA + Logo ───────────────────────────────────────────────────────

const Scene4CTA: React.FC<{
	footage: string;
	dim: number;
	closingLine: string;
	color: string;
}> = ({ footage, dim, closingLine, color }) => {
	const frame = useCurrentFrame();

	const closingOp = interpolate(frame, [14, 44], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const closingY = interpolate(frame, [14, 44], [22, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const logoOp = interpolate(frame, [68, 95], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const ctaOp = interpolate(frame, [98, 125], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Radar ping ring
	const pingScale = interpolate(frame, [72, 140], [0.55, 2.4], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});
	const pingOp = interpolate(frame, [72, 140], [0.55, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ overflow: "hidden" }}>
			<BgVideo src={footage} dimOpacity={dim} kenBurnsTo={1.1} />
			<TopGrad />
			<BottomGrad h={900} s={0.7} />

			{/* Closing statement */}
			<div
				style={{
					position: "absolute",
					top: 310,
					left: 60,
					right: 60,
					textAlign: "center",
					opacity: closingOp,
					transform: `translateY(${closingY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 84,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.15,
						letterSpacing: -2.5,
						textShadow: "0 4px 30px rgba(0,0,0,0.88)",
						whiteSpace: "pre-line",
					}}
				>
					{closingLine}
				</div>
			</div>

			{/* Radar ping ring */}
			<div
				style={{
					position: "absolute",
					bottom: 392,
					left: "50%",
					transform: `translate(-50%, 50%) scale(${pingScale})`,
					width: 190,
					height: 190,
					borderRadius: "50%",
					border: `2px solid ${color}`,
					opacity: pingOp,
				}}
			/>

			{/* Logo */}
			<div
				style={{
					position: "absolute",
					bottom: 390,
					left: "50%",
					transform: "translateX(-50%)",
					opacity: logoOp,
				}}
			>
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 155,
						height: 155,
						borderRadius: 34,
						boxShadow: "0 8px 40px rgba(0,0,0,0.65)",
					}}
				/>
			</div>

			{/* App name + LINK IN BIO */}
			<div
				style={{
					position: "absolute",
					bottom: 296,
					left: 0,
					right: 0,
					textAlign: "center",
					opacity: ctaOp,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 12,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 38,
						fontWeight: 700,
						color: "#FFFFFF",
						letterSpacing: 1,
					}}
				>
					WildSpotter
				</div>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 24,
						fontWeight: 400,
						color: "rgba(255,255,255,0.45)",
						letterSpacing: 3,
					}}
				>
					LINK IN BIO
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Audio ─────────────────────────────────────────────────────────────────────

const RadarAudio: React.FC<{ musicTrack: string }> = ({ musicTrack }) => {
	const { durationInFrames, fps } = useVideoConfig();
	return (
		<Audio
			src={staticFile(`audio/music/${musicTrack}.mp3`)}
			volume={(f) => {
				const fadeIn = interpolate(f, [0, fps], [0, 0.38], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
				const fadeOut = interpolate(
					f,
					[durationInFrames - 3 * fps, durationInFrames],
					[0.38, 0],
					{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
				);
				if (f < fps) return fadeIn;
				if (f > durationInFrames - 3 * fps) return fadeOut;
				return 0.38;
			}}
		/>
	);
};

// ── Main body (shared between base and intro variants) ────────────────────────

const RadarBody: React.FC<{ data: VariantData }> = ({ data }) => {
	return (
		<TransitionSeries>
			{/* S1 — Score counter (biome footage) */}
			<TransitionSeries.Sequence durationInFrames={S1_DUR}>
				<Scene1Score
					score={data.score}
					color={data.scoreColor}
					footage={data.biomeFootage}
					dim={data.biomeDimS1}
					biomeLabel={data.biomeLabel}
				/>
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			{/* S2 — Landscape + metrics (same biome footage, different dim) */}
			<TransitionSeries.Sequence durationInFrames={S2_DUR}>
				<Scene2Data
					footage={data.biomeFootage}
					dim={data.biomeDimS2}
					dataLine1={data.dataLine1}
					dataLine2={data.dataLine2}
					color={data.scoreColor}
				/>
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			{/* S3 — Soil info card (payoff footage, darker) */}
			<TransitionSeries.Sequence durationInFrames={S3_DUR}>
				<Scene3Info
					footage={data.payoffFootage}
					dim={data.payoffDimS3}
					infoLine1={data.infoLine1}
					infoLine2={data.infoLine2}
					color={data.scoreColor}
				/>
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			{/* S4 — CTA + logo (same payoff footage, lighter) */}
			<TransitionSeries.Sequence durationInFrames={S4_DUR}>
				<Scene4CTA
					footage={data.payoffFootage}
					dim={data.payoffDimS4}
					closingLine={data.closingLine}
					color={data.scoreColor}
				/>
			</TransitionSeries.Sequence>
		</TransitionSeries>
	);
};

// ── Main composition ──────────────────────────────────────────────────────────

export const ElRadarEncontro: React.FC<ElRadarEncontroProps> = ({
	variant = "M1",
	withIntro = false,
}) => {
	const data = VARIANT_DATA[variant];

	if (withIntro) {
		return (
			<AbsoluteFill>
				{/* Music plays over the full composition (intro + body) */}
				<RadarAudio musicTrack={data.musicTrack} />

				{/* Intro: first STORE_INTRO_FRAMES frames */}
				<Sequence durationInFrames={STORE_INTRO_FRAMES}>
					<StoreInstallIntro />
				</Sequence>

				{/* Body: starts at STORE_INTRO_FRAMES */}
				<Sequence from={STORE_INTRO_FRAMES}>
					<RadarBody data={data} />
				</Sequence>
			</AbsoluteFill>
		);
	}

	return (
		<AbsoluteFill>
			<RadarAudio musicTrack={data.musicTrack} />
			<RadarBody data={data} />
		</AbsoluteFill>
	);
};
