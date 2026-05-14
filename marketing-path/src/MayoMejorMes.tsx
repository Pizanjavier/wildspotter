import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
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

// ──────────────────────────────────────────────────────────────────────────────
// MayoMejorMes — "Mayo es el Mejor Mes"
//
// Seasonal content. Atlantic north coast (Galicia, Asturias, Cantabria) in May.
// Green, empty, before tourists. CTA = link en bio.
//
// Audio sync note: track 595 has a structural swell at ~0:59s (frame ~59 of audio).
// We use startFrom offset so the swell lands near the S3 CTA scene entrance (~300f).
// startFrom = 0 (audio opens gently — perfect for this mood).
//
// Timeline (~18s / 540 frames):
//
// V1-1: hook "Mayo." — single word, big impact
// V1-2: hook "La costa cantábrica..." — longer opening
//
// S1 Hook:         0   → 105   (3.5s)  — "Mayo." / "La costa cantábrica..."
// S2 Description:  105 → 330   (7.5s)  — 3 regional lines staggered  (crossfade at 105f)
// S3 CTA:          330 → 540   (7.0s)  — radar pitch + question + download CTA
//
// 2 video clips:
//   Clip 1 (S1+S2): stunning cliffs + sea from above — pure green Atlantic
//   Clip 2 (S3):    rocky Kefalonia coast aerial — different angle, same mood
// ──────────────────────────────────────────────────────────────────────────────

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "800", "900"],
	subsets: ["latin"],
});

export type MayoVariant = "V1" | "V2";

export type MayoMejorMesProps = {
	hookVariant: MayoVariant;
	musicTrack?: string;
};

export const MAYO_MEJOR_MES_FRAMES = 540;

// ── Timing constants ──
const S1_END = 105;
const S2_START = 105;
const S2_END = 330;
const S3_START = 330;
const CROSS_DUR = 20;

const CLIP1 =
	"videos/stunning_cliffs_and_turquoise_sea_from_above_34885409_2160x3840_34885409.mp4";
const CLIP2 =
	"videos/stunning_aerial_views_of_rocky_kefalonia_coast_29784774_1080x1920_29784774.mp4";

export const MayoMejorMes: React.FC<MayoMejorMesProps> = ({
	hookVariant = "V1",
	musicTrack = "atlantic-swell",
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// ── Ken Burns — each clip has its own zoom starting from 1.0 ──
	const zoomClip1 = interpolate(frame, [0, S2_END], [1.0, 1.1], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});
	// Clip 2 zooms from its own start point
	const zoomClip2 = interpolate(
		frame,
		[S2_END, durationInFrames],
		[1.0, 1.07],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.quad),
		},
	);

	// ── Crossfade ── clip1 fades out, clip2 fades in
	const clip1Op = interpolate(frame, [S2_END, S2_END + CROSS_DUR], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const clip2Op = interpolate(frame, [S2_END, S2_END + CROSS_DUR], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// ── Dynamic dim ──
	// S1 lighter for impact, S2 moderate for readability, S3 slightly lighter for CTA
	const dimValue = interpolate(
		frame,
		[0, S1_END, S2_START + 20, S2_END, S3_START + 20, durationInFrames],
		[0.25, 0.3, 0.48, 0.48, 0.38, 0.38],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// ── Text fade helper ──
	const textFade = (
		inF: number,
		outF: number,
		fadeInDur = 18,
		fadeOutDur = 14,
	) => {
		const fadeIn = interpolate(frame, [inF, inF + fadeInDur], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.quad),
		});
		const fadeOut = interpolate(frame, [outF - fadeOutDur, outF], [1, 0], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		});
		return Math.min(fadeIn, fadeOut);
	};

	// ── Scene opacities ──
	const s1Op = textFade(8, S1_END - 4);
	const s2Op = textFade(S2_START + 10, S2_END - 4);
	const s3Op = textFade(S3_START + 14, durationInFrames - 8);

	// ── S2 staggered lines (appear in sequence) ──
	const lineDelays = [0, 55, 110];
	const lineOps = lineDelays.map((delay) =>
		interpolate(
			frame,
			[S2_START + 10 + delay, S2_START + 10 + delay + 22],
			[0, 1],
			{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
		),
	);

	// ── S3 staggered CTA elements ──
	const ctaBase = S3_START + 20;
	const radarOp = interpolate(frame, [ctaBase, ctaBase + 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const questionOp = interpolate(frame, [ctaBase + 40, ctaBase + 60], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const pillOp = interpolate(frame, [ctaBase + 80, ctaBase + 100], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// ── Music: 1s fade in, 3s fade out ──
	const musicVol = (f: number) => {
		const fadeIn = interpolate(f, [0, fps], [0, 0.44], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		});
		const fadeOut = interpolate(
			f,
			[durationInFrames - 90, durationInFrames],
			[0.44, 0],
			{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
		);
		if (f < fps) return fadeIn;
		if (f > durationInFrames - 90) return fadeOut;
		return 0.44;
	};

	// ── Text styles ──
	const heroText: React.CSSProperties = {
		fontFamily: interFont,
		fontSize: 120,
		fontWeight: 900,
		color: "#FFFFFF",
		lineHeight: 1.1,
		letterSpacing: -3,
		textShadow: "0 4px 20px rgba(0,0,0,0.85), 0 0 60px rgba(0,0,0,0.5)",
		whiteSpace: "pre-line",
		textAlign: "center",
	};

	const bodyText: React.CSSProperties = {
		fontFamily: interFont,
		fontSize: 56,
		fontWeight: 700,
		color: "#FFFFFF",
		lineHeight: 1.4,
		letterSpacing: -1,
		textShadow: "0 3px 14px rgba(0,0,0,0.8)",
		whiteSpace: "pre-line",
		textAlign: "center",
	};

	const videoBase: React.CSSProperties = {
		width: "100%",
		height: "100%",
		objectFit: "cover",
	};

	// ── Safe zone ──
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

	// ── Hook copy per variant ──
	const hookCopy: Record<MayoVariant, React.ReactNode> = {
		V1: (
			<div
				style={{
					...heroText,
					fontSize: 140,
					letterSpacing: -4,
					color: "#FFFFFF",
				}}
			>
				Mayo.
			</div>
		),
		V2: (
			<>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 40,
						fontWeight: 700,
						color: "#D97706",
						letterSpacing: 3,
						textTransform: "uppercase",
						textShadow: "0 2px 12px rgba(0,0,0,0.7)",
						marginBottom: 20,
						textAlign: "center",
					}}
				>
					Mayo.
				</div>
				<div style={{ ...heroText, fontSize: 80 }}>
					{"La costa cantábrica\ntodavía sin turistas."}
				</div>
			</>
		),
	};

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B" }}>
			{/* ── Music ── */}
			<Audio
				src={staticFile(`audio/music/${musicTrack}.mp3`)}
				volume={musicVol}
			/>

			{/* ── VIDEO CLIP 1: Cliffs & sea from above (S1 + S2) ── */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: clip1Op,
					transform: `scale(${zoomClip1})`,
					transformOrigin: "50% 50%",
				}}
			>
				<Video src={staticFile(CLIP1)} muted loop style={videoBase} />
			</div>

			{/* ── VIDEO CLIP 2: Rocky coast aerial (S3) — premount before crossfade ── */}
			{frame > S2_END - 10 && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						opacity: clip2Op,
						transform: `scale(${zoomClip2})`,
						transformOrigin: "50% 50%",
					}}
				>
					<Video src={staticFile(CLIP2)} muted loop style={videoBase} />
				</div>
			)}

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
					height: "20%",
					background:
						"linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)",
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
						"linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
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
				{hookCopy[hookVariant]}
			</div>

			{/* ══════════ SCENE 2 — DESCRIPTION (staggered lines) ══════════ */}
			<div
				style={{
					...safeZone,
					opacity: s2Op,
					zIndex: 5,
					textAlign: "center",
					gap: 0,
				}}
			>
				<div
					style={{
						width: 44,
						height: 4,
						backgroundColor: "#D97706",
						borderRadius: 2,
						boxShadow: "0 0 14px rgba(217,119,6,0.5)",
						margin: "0 auto 32px",
					}}
				/>
				{[
					"La costa cantábrica todavía\nsin turistas.",
					"Galicia: hierba verde y\nplayas vacías.",
					"Asturias sin los coches\ndel agosto.",
				].map((line, i) => (
					<div
						key={i}
						style={{
							...bodyText,
							fontSize: i === 0 ? 58 : 52,
							color: i === 2 ? "rgba(255,255,255,0.85)" : "#FFFFFF",
							marginBottom: i < 2 ? 24 : 0,
							opacity: lineOps[i],
						}}
					>
						{line}
					</div>
				))}
			</div>

			{/* ══════════ SCENE 3 — CTA ══════════ */}
			<div
				style={{
					...safeZone,
					zIndex: 5,
					textAlign: "center",
					gap: 0,
					opacity: s3Op,
				}}
			>
				{/* Radar pitch */}
				<div
					style={{
						opacity: radarOp,
						textAlign: "center",
						marginBottom: 36,
					}}
				>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 36,
							fontWeight: 700,
							color: "#D97706",
							letterSpacing: 1,
							textShadow: "0 2px 12px rgba(0,0,0,0.7)",
							marginBottom: 14,
						}}
					>
						El radar tiene los mejores spots
					</div>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 68,
							fontWeight: 900,
							color: "#FFFFFF",
							letterSpacing: -2,
							lineHeight: 1.2,
							textShadow: "0 4px 16px rgba(0,0,0,0.85)",
							whiteSpace: "pre-line",
						}}
					>
						{"de la costa norte\ncatalogados."}
					</div>
				</div>

				{/* Engagement question */}
				<div
					style={{
						opacity: questionOp,
						marginBottom: 36,
					}}
				>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 50,
							fontWeight: 700,
							color: "rgba(255,255,255,0.85)",
							lineHeight: 1.35,
							textShadow: "0 3px 12px rgba(0,0,0,0.75)",
							whiteSpace: "pre-line",
							textAlign: "center",
						}}
					>
						{"¿Ya habéis estado\npor el norte este mes? 👇"}
					</div>
				</div>

				{/* CTA pill */}
				<div
					style={{
						opacity: pillOp,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 14,
					}}
				>
					<Img
						src={staticFile("images/app-logo.png")}
						style={{
							width: 80,
							height: 80,
							borderRadius: 18,
							boxShadow:
								"0 4px 24px rgba(0,0,0,0.5), 0 0 32px rgba(217,119,6,0.2)",
						}}
					/>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 34,
							fontWeight: 700,
							color: "rgba(255,255,255,0.7)",
							letterSpacing: 0,
							textShadow: "0 2px 10px rgba(0,0,0,0.6)",
						}}
					>
						Gratis en iOS y Android
					</div>
					<div
						style={{
							backgroundColor: "rgba(217,119,6,0.18)",
							border: "1.5px solid rgba(217,119,6,0.5)",
							borderRadius: 50,
							padding: "14px 44px",
						}}
					>
						<div
							style={{
								fontFamily: interFont,
								fontSize: 30,
								fontWeight: 700,
								color: "#D97706",
								letterSpacing: 1,
								whiteSpace: "nowrap",
							}}
						>
							Link en bio
						</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
