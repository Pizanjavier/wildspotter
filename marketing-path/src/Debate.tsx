import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Audio, Video } from "@remotion/media";
import {
	AbsoluteFill,
	Easing,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

// ──────────────────────────────────────────────────────────────────────────────
// Debate — shared component for Debate1 and Debate2
//
// Pure debate/engagement format. No download CTA — just opinion + hook.
//
// Timeline (18.4s / 552 frames):
//
// Timings are proportional to text density per scene.
// S1 (Hook):     0   → 120   (4.0s) — provocative question / opening statement
// S2 (Body):     120 → 400   (9.3s) — argument / counter (staggered lines, wide gaps)
// S3 (Question): 400 → 552   (5.1s / 4.0s full opacity) — engagement CTA
//
// Only 1 video clip — no crossfade needed. Keep it still and steady.
// ──────────────────────────────────────────────────────────────────────────────

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "800", "900"],
	subsets: ["latin"],
});

export type DebateVariant = "D1" | "D2";

export type DebateProps = {
	variant: DebateVariant;
	musicTrack?: string;
};

// ── Timing constants (proportional to text density) ──
const S1_START = 0;
const S1_END = 120;
const S2_START = 120;
const S2_END = 400;
const S3_START = 400;

// ── Variant data ──
type DebateData = {
	footage: string;
	// S1
	hookLine: string;
	hookSub: string;
	// S2 — up to 3 lines with individual timing
	argLines: { text: string; delay: number; highlight?: boolean }[];
	// S3
	questionLine: string;
	// Dim levels per scene [S1, S2, S3]
	dimLevels: [number, number, number];
};

const VARIANT_DATA: Record<DebateVariant, DebateData> = {
	D1: {
		footage: "videos/couple_sitting_in_van_9354235_1080x1920_9354235.mp4",
		hookLine: "¿Publicas la ubicación\nde tu spot favorito?",
		hookSub: "",
		argLines: [
			{
				text: "Compartirlo es generoso.\nAlguien va a flipar.",
				delay: 0,
				highlight: false,
			},
			{
				text: "Pero en las apps de reviews los mejores spots se extienden como la pólvora.",
				delay: 70,
				highlight: false,
			},
			{
				text: "Vuelves en junio.\nHay 15 furgos, basura\nen el suelo y alguien\ncon un altavoz.",
				delay: 150,
				highlight: true,
			},
		],
		questionLine: "¿Publicar o guardar\nel secreto?\nComenta 👇",
		dimLevels: [0.5, 0.58, 0.5],
	},
	D2: {
		footage:
			"videos/couple_in_the_morning_in_a_campervan_9354237_1080x1920_9354237.mp4",
		hookLine: "5 estrellas en un spot.\n¿Qué pasa después?",
		hookSub: "",
		argLines: [
			{
				text: "Primero llegan 20 personas.\nDespués 200.",
				delay: 0,
				highlight: false,
			},
			{
				text: "El parking se llena.\nEl ayuntamiento pone una barrera.\nEl spot desaparece.",
				delay: 70,
				highlight: false,
			},
			{
				text: "Una review de 5 estrellas\nes la sentencia de muerte\nde un buen spot.",
				delay: 150,
				highlight: true,
			},
		],
		questionLine: "¿Las reviews ayudan\no destruyen los spots?\nComenta 👇",
		dimLevels: [0.5, 0.58, 0.5],
	},
};

export const DEBATE_FRAMES = 552;

export const Debate: React.FC<DebateProps> = ({
	variant,
	musicTrack = "quiet-debate",
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const data = VARIANT_DATA[variant];

	// ── Ken Burns zoom across entire clip ──
	const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.09], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	// ── Dynamic dim overlay ──
	const dimValue = interpolate(
		frame,
		[S1_START, S1_END, S2_START + 20, S2_END, S3_START + 20],
		[
			data.dimLevels[0],
			data.dimLevels[0],
			data.dimLevels[1],
			data.dimLevels[1],
			data.dimLevels[2],
		],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// ── Text fade helper (local-frame relative) ──
	const textFade = (
		inFrame: number,
		outFrame: number,
		fadeInDur = 18,
		fadeOutDur = 14,
	) => {
		const fadeIn = interpolate(frame, [inFrame, inFrame + fadeInDur], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.quad),
		});
		const fadeOut = interpolate(
			frame,
			[outFrame - fadeOutDur, outFrame],
			[1, 0],
			{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
		);
		return Math.min(fadeIn, fadeOut);
	};

	// ── Scene opacities ──
	const s1Op = textFade(8, S1_END - 4);
	const s2Op = textFade(S2_START + 10, S2_END - 4);
	const s3Op = textFade(S3_START + 12, durationInFrames - 6);

	// ── Music fade out 3s before end ──
	const musicVol = (f: number) => {
		const fadeIn = interpolate(f, [0, fps], [0, 0.42], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		});
		const fadeOut = interpolate(
			f,
			[durationInFrames - 90, durationInFrames],
			[0.42, 0],
			{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
		);
		if (f < fps) return fadeIn;
		if (f > durationInFrames - 90) return fadeOut;
		return 0.42;
	};

	// ── Shared text styles ──
	const heroText: React.CSSProperties = {
		fontFamily: interFont,
		fontSize: 76,
		fontWeight: 900,
		color: "#FFFFFF",
		lineHeight: 1.2,
		letterSpacing: -2,
		textShadow: "0 4px 16px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)",
		whiteSpace: "pre-line",
		textAlign: "center",
	};

	const bodyText: React.CSSProperties = {
		fontFamily: interFont,
		fontSize: 52,
		fontWeight: 700,
		color: "#FFFFFF",
		lineHeight: 1.35,
		letterSpacing: -1,
		textShadow: "0 3px 14px rgba(0,0,0,0.8)",
		whiteSpace: "pre-line",
		textAlign: "center",
	};

	const accentBar: React.CSSProperties = {
		width: 44,
		height: 4,
		backgroundColor: "#D97706",
		borderRadius: 2,
		boxShadow: "0 0 14px rgba(217,119,6,0.5)",
		margin: "0 auto 28px",
	};

	// Safe zone layout
	const safeZone: React.CSSProperties = {
		position: "absolute",
		left: 50,
		right: 150,
		paddingTop: 250,
		paddingBottom: 450,
		top: 0,
		bottom: 0,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
	};

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B" }}>
			{/* ── Music ── */}
			<Audio
				src={staticFile(`audio/music/${musicTrack}.mp3`)}
				volume={musicVol}
			/>

			{/* ── Video background — single clip, full duration ── */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					transform: `scale(${zoom})`,
					transformOrigin: "50% 50%",
				}}
			>
				<Video
					src={staticFile(data.footage)}
					muted
					loop
					style={{ width: "100%", height: "100%", objectFit: "cover" }}
				/>
			</div>

			{/* ── Dim overlay ── */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundColor: `rgba(0,0,0,${dimValue})`,
					zIndex: 1,
				}}
			/>

			{/* ── Top vignette ── */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "22%",
					background:
						"linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 100%)",
					zIndex: 2,
				}}
			/>

			{/* ── Bottom vignette ── */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "28%",
					background:
						"linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)",
					zIndex: 2,
				}}
			/>

			{/* ══════════ SCENE 1 — HOOK ══════════ */}
			<div
				style={{
					...safeZone,
					opacity: s1Op,
					zIndex: 5,
					textAlign: "center",
				}}
			>
				<div style={accentBar} />
				<div style={heroText}>{data.hookLine}</div>
				{data.hookSub ? (
					<div
						style={{
							...heroText,
							fontSize: 64,
							color: "#D97706",
							marginTop: 16,
						}}
					>
						{data.hookSub}
					</div>
				) : null}
			</div>

			{/* ══════════ SCENE 2 — ARGUMENTS + PIVOT ══════════ */}
			<div
				style={{
					...safeZone,
					opacity: s2Op,
					zIndex: 5,
					textAlign: "center",
					gap: 0,
				}}
			>
				{/* Argument lines — staggered */}
				{data.argLines.map((line, i) => {
					const lineOp = interpolate(
						frame,
						[S2_START + 10 + line.delay, S2_START + 10 + line.delay + 20],
						[0, 1],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					);
					return (
						<div
							key={i}
							style={{
								...bodyText,
								color: line.highlight ? "#FCD34D" : "#FFFFFF",
								marginBottom: 20,
								opacity: lineOp,
							}}
						>
							{line.text}
						</div>
					);
				})}
			</div>

			{/* ══════════ SCENE 3 — ENGAGEMENT QUESTION ══════════ */}
			<div
				style={{
					...safeZone,
					opacity: s3Op,
					zIndex: 5,
					textAlign: "center",
				}}
			>
				<div
					style={{
						...heroText,
						fontSize: 68,
						lineHeight: 1.3,
					}}
				>
					{data.questionLine}
				</div>
			</div>
		</AbsoluteFill>
	);
};
