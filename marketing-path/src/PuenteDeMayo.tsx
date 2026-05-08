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

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "800", "900"],
	subsets: ["latin"],
});

// 2-video structure: problem footage (S1-S2) → payoff footage (S3-S4)
// Single crossfade at the midpoint. No PowerPoint switching.
//
// S1 Hook:    0   → 110   (3.7s)
// S2 Problem: 110 → 235   (4.2s)
//   ── crossfade at 235 ──
// S3 Pivot:   235 → 355   (4.0s)
// S4 CTA:     355 → 520   (5.5s)
// Total: 520 frames (~17.3s)

export const PUENTE_DE_MAYO_FRAMES = 520;

export type PuenteDeMayoProps = {
	musicTrack?: "pulse-reveal" | "rising-tide";
};

const CROSS_DUR = 20;
const MID_POINT = 235;

export const PuenteDeMayo: React.FC<PuenteDeMayoProps> = ({
	musicTrack = "pulse-reveal",
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	// 2-layer crossfade: problem footage fades out, payoff fades in
	const problemOp = interpolate(
		frame,
		[MID_POINT, MID_POINT + CROSS_DUR],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);
	const payoffOp = interpolate(
		frame,
		[MID_POINT, MID_POINT + CROSS_DUR],
		[0, 1],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// Dim: darker for text-heavy scenes, lighter for CTA
	const dimValue = interpolate(
		frame,
		[0, 110, MID_POINT, 355, durationInFrames],
		[0.4, 0.55, 0.55, 0.35, 0.35],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	const videoBase: React.CSSProperties = {
		width: "100%",
		height: "100%",
		objectFit: "cover",
	};

	const layerStyle = (opacity: number): React.CSSProperties => ({
		position: "absolute",
		inset: 0,
		opacity,
		transform: `scale(${zoom})`,
		transformOrigin: "50% 50%",
	});

	// Text fade helper
	const textFade = (inF: number, outF: number) => {
		const fadeIn = interpolate(frame, [inF, inF + 18], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		});
		const fadeOut = interpolate(frame, [outF - 14, outF], [1, 0], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		});
		return Math.min(fadeIn, fadeOut);
	};

	const s1TextOp = textFade(8, 110);
	const s2TextOp = textFade(128, MID_POINT);
	const s3TextOp = textFade(MID_POINT + CROSS_DUR, 355);

	const ctaBase = 370;
	const ctaLine1Op = interpolate(frame, [ctaBase, ctaBase + 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaLogoOp = interpolate(frame, [ctaBase + 30, ctaBase + 50], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaIosOp = interpolate(frame, [ctaBase + 55, ctaBase + 72], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const heroText: React.CSSProperties = {
		fontFamily: interFont,
		fontSize: 76,
		fontWeight: 900,
		color: "#FFFFFF",
		lineHeight: 1.2,
		letterSpacing: -2,
		textShadow: "0 4px 24px rgba(0,0,0,0.85), 0 0 60px rgba(0,0,0,0.5)",
		whiteSpace: "pre-line",
		textAlign: "center",
	};

	const subText: React.CSSProperties = {
		fontFamily: interFont,
		fontSize: 52,
		fontWeight: 700,
		color: "#FFFFFF",
		lineHeight: 1.3,
		letterSpacing: -1,
		textShadow: "0 3px 16px rgba(0,0,0,0.8)",
		whiteSpace: "pre-line",
		textAlign: "center",
	};

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B" }}>
			{/* ── Music ── */}
			<Audio
				src={staticFile(`audio/music/${musicTrack}.mp3`)}
				volume={(f) => {
					const fadeIn = interpolate(f, [0, fps], [0, 0.45], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					});
					const fadeOut = interpolate(
						f,
						[durationInFrames - 90, durationInFrames],
						[0.45, 0],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					);
					if (f < fps) return fadeIn;
					if (f > durationInFrames - 90) return fadeOut;
					return 0.45;
				}}
			/>

			{/* ── VIDEO LAYER 1: Problem footage (S1 + S2) ── */}
			{/* Crowded campervans at a packed coastal spot — fresh vertical footage */}
			<div style={layerStyle(problemOp)}>
				<Video
					src={staticFile(
						"videos/hippie_camper_van_18325890_2160x3840_18325890.mp4",
					)}
					muted
					loop
					style={videoBase}
				/>
			</div>

			{/* ── VIDEO LAYER 2: Payoff footage (S3 + S4) ── */}
			{/* Orange VW camper on scenic coastal drive — the dream */}
			{frame > MID_POINT - 10 && (
				<div style={layerStyle(payoffOp)}>
					<Video
						src={staticFile(
							"videos/orange_vw_camper_van_on_scenic_coastal_drive_37075748_1080x1920_37075748.mp4",
						)}
						muted
						loop
						style={videoBase}
					/>
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

			{/* ── Vignettes ── */}
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
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "25%",
					background:
						"linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)",
					zIndex: 2,
				}}
			/>

			{/* ══════════ SCENE 1 — HOOK ══════════ */}
			<div
				style={{
					position: "absolute",
					top: "22%",
					left: 56,
					right: 56,
					textAlign: "center",
					opacity: s1TextOp,
					zIndex: 5,
				}}
			>
				<div
					style={{
						width: 44,
						height: 4,
						backgroundColor: "#D97706",
						borderRadius: 2,
						boxShadow: "0 0 16px #D9770666",
						margin: "0 auto 28px",
					}}
				/>
				<div style={heroText}>{"Y este puente de mayo."}</div>
				<div
					style={{
						...heroText,
						fontSize: 70,
						color: "#D97706",
						marginTop: 12,
					}}
				>
					{"¿Ya sabes dónde\nvas a dormir?"}
				</div>
			</div>

			{/* ══════════ SCENE 2 — PROBLEM ══════════ */}
			<div
				style={{
					position: "absolute",
					top: "20%",
					left: 56,
					right: 56,
					textAlign: "center",
					opacity: s2TextOp,
					zIndex: 5,
				}}
			>
				<div
					style={{
						...subText,
						fontSize: 48,
						color: "rgba(255,255,255,0.65)",
						letterSpacing: 2,
						textTransform: "uppercase",
						marginBottom: 24,
					}}
				>
					Cada año igual
				</div>
				<div style={heroText}>
					{"Los mismos spots\nde siempre hasta arriba\neste puente."}
				</div>
			</div>

			{/* ══════════ SCENE 3 — PIVOT ══════════ */}
			<div
				style={{
					position: "absolute",
					top: "20%",
					left: 56,
					right: 56,
					textAlign: "center",
					opacity: s3TextOp,
					zIndex: 5,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 36,
						fontWeight: 700,
						color: "#D97706",
						letterSpacing: 2,
						textTransform: "uppercase",
						marginBottom: 20,
						textShadow: "0 2px 12px rgba(0,0,0,0.7)",
					}}
				>
					WildSpotter analizó toda España.
				</div>
				<div style={heroText}>
					{"Spots con puntuación alta\nque nadie\nha compartido."}
				</div>
			</div>

			{/* ══════════ SCENE 4 — CTA ══════════ */}

			{/* Radial glow */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: payoffOp * 0.6,
					background:
						"radial-gradient(ellipse 70% 55% at 50% 45%, rgba(217,119,6,0.12) 0%, transparent 70%)",
					zIndex: 3,
				}}
			/>

			<div
				style={{
					position: "absolute",
					top: "18%",
					left: 56,
					right: 56,
					textAlign: "center",
					opacity: ctaLine1Op,
					zIndex: 6,
				}}
			>
				<div
					style={{
						...subText,
						fontSize: 56,
						color: "rgba(255,255,255,0.9)",
					}}
				>
					{"Costa o montaña."}
				</div>
				<div
					style={{
						...heroText,
						fontSize: 88,
						color: "#D97706",
						marginTop: 6,
					}}
				>
					{"Tú decides."}
				</div>
			</div>

			{/* Divider */}
			<div
				style={{
					position: "absolute",
					top: "47%",
					left: "50%",
					transform: "translateX(-50%)",
					width: 60,
					height: 2,
					backgroundColor: "rgba(217,119,6,0.5)",
					borderRadius: 1,
					opacity: ctaLogoOp,
					zIndex: 6,
				}}
			/>

			{/* Logo + name */}
			<div
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, 0)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 18,
					opacity: ctaLogoOp,
					zIndex: 6,
				}}
			>
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 160,
						height: 160,
						borderRadius: 36,
						boxShadow:
							"0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(217,119,6,0.2)",
					}}
				/>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 44,
						fontWeight: 800,
						color: "#FFFFFF",
						letterSpacing: -1,
						textShadow: "0 3px 16px rgba(0,0,0,0.6)",
					}}
				>
					WildSpotter
				</div>
			</div>

			{/* "Gratis en iOS" pill */}
			<div
				style={{
					position: "absolute",
					bottom: "12%",
					left: "50%",
					transform: "translateX(-50%)",
					opacity: ctaIosOp,
					zIndex: 6,
				}}
			>
				<div
					style={{
						backgroundColor: "rgba(217,119,6,0.18)",
						border: "1.5px solid rgba(217,119,6,0.55)",
						borderRadius: 50,
						padding: "18px 52px",
					}}
				>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 34,
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
		</AbsoluteFill>
	);
};
