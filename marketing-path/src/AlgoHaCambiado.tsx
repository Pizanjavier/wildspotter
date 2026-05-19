import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import React from "react";

export const ALGO_HA_CAMBIADO_FRAMES = 810; // 27s @ 30fps

// Scene boundaries — screenshots get more time
const S1_END = 130; // 0-130f (4.3s) — Big stats: 83.006 / 17 / 89
const S2_END = 270; // 130-270f (4.7s) — Legal depth: CCAA + parks + 150 docs
const S3_END = 460; // 270-460f (6.3s) — Popup feature + screenshot (long hold)
const S4_END = 650; // 460-650f (6.3s) — Map colors + municipality + screenshot (long hold)
const S5_END = ALGO_HA_CAMBIADO_FRAMES; // 650-810f (5.3s) — "WildSpotter 2.0 llega esta semana"

const FADE_DUR = 18;
const CLIP_CROSSFADE = S3_END; // clip A -> clip B midpoint

type StatItemProps = {
	value: string;
	label: string;
	progress: number;
	accent?: string;
	fontSize?: number;
};

const StatItem: React.FC<StatItemProps> = ({
	value,
	label,
	progress,
	accent = "#D97706",
	fontSize = 96,
}) => (
	<div
		style={{
			opacity: progress,
			transform: `translateY(${(1 - progress) * 30}px)`,
			display: "flex",
			flexDirection: "column",
			gap: "6px",
		}}
	>
		<div
			style={{
				fontFamily: "'JetBrains Mono', monospace",
				fontWeight: 700,
				fontSize: `${fontSize}px`,
				color: "#FFFFFF",
				letterSpacing: "-3px",
				lineHeight: 1.0,
				textShadow: `0 0 60px ${accent}40, 0 4px 24px rgba(0,0,0,0.9)`,
			}}
		>
			{value}
		</div>
		<div
			style={{
				fontFamily: "'Inter', sans-serif",
				fontWeight: 500,
				fontSize: "36px",
				color: accent,
				letterSpacing: "0.5px",
				lineHeight: 1.2,
				textShadow: "0 2px 12px rgba(0,0,0,0.8)",
			}}
		>
			{label}
		</div>
	</div>
);

type FeatureBulletProps = {
	text: string;
	progress: number;
	accent?: string;
};

const FeatureBullet: React.FC<FeatureBulletProps> = ({
	text,
	progress,
	accent = "#D97706",
}) => (
	<div
		style={{
			display: "flex",
			alignItems: "center",
			gap: "20px",
			opacity: progress,
			transform: `translateX(${(1 - progress) * -30}px)`,
		}}
	>
		<div
			style={{
				width: "4px",
				height: "52px",
				backgroundColor: accent,
				borderRadius: "2px",
				flexShrink: 0,
				boxShadow: `0 0 14px ${accent}80`,
			}}
		/>
		<span
			style={{
				fontFamily: "'Inter', sans-serif",
				fontWeight: 600,
				fontSize: "50px",
				color: "#FFFFFF",
				lineHeight: 1.2,
				letterSpacing: "-0.5px",
				textShadow: "0 2px 20px rgba(0,0,0,0.9)",
			}}
		>
			{text}
		</span>
	</div>
);

export const AlgoHaCambiado: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const textShadow = "0 2px 24px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.5)";

	// ── Music ────────────────────────────────────────────────────────────────
	const musicVolume = interpolate(
		frame,
		[0, 20, S5_END - 90, S5_END],
		[0, 0.42, 0.42, 0],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
	);

	// ── Ken Burns — Clip A (S2-S3), Clip B (S4-S5) ─────────────────────────
	const bgScaleA = interpolate(frame, [S1_END, CLIP_CROSSFADE], [1.0, 1.09], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const bgScaleB = interpolate(frame, [CLIP_CROSSFADE, S5_END], [1.0, 1.08], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	const clipAOpacity = (() => {
		if (frame < S1_END) return 0;
		if (frame >= CLIP_CROSSFADE) return 0;
		const fadeIn = interpolate(frame, [S1_END, S1_END + FADE_DUR], [0, 1], {
			extrapolateRight: "clamp",
			extrapolateLeft: "clamp",
		});
		const fadeOut = interpolate(
			frame,
			[CLIP_CROSSFADE - FADE_DUR, CLIP_CROSSFADE],
			[1, 0],
			{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
		);
		if (frame < S1_END + FADE_DUR) return fadeIn;
		if (frame > CLIP_CROSSFADE - FADE_DUR) return fadeOut;
		return 1;
	})();

	const clipBOpacity = (() => {
		if (frame < CLIP_CROSSFADE) return 0;
		const fadeIn = interpolate(
			frame,
			[CLIP_CROSSFADE, CLIP_CROSSFADE + FADE_DUR],
			[0, 1],
			{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
		);
		if (frame < CLIP_CROSSFADE + FADE_DUR) return fadeIn;
		return 1;
	})();

	// Scene fade-outs
	const s1Fade = interpolate(frame, [S1_END - FADE_DUR, S1_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s2Fade = interpolate(frame, [S2_END - FADE_DUR, S2_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s3Fade = interpolate(frame, [S3_END - FADE_DUR, S3_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s4Fade = interpolate(frame, [S4_END - FADE_DUR, S4_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// ── S1: Stats ───────────────────────────────────────────────────────────
	const STAT_STAGGER = 38;
	const stat1 = spring({
		frame: Math.max(0, frame - 15),
		fps,
		config: { damping: 13, mass: 0.7 },
	});
	const stat2 = spring({
		frame: Math.max(0, frame - (15 + STAT_STAGGER)),
		fps,
		config: { damping: 13, mass: 0.7 },
	});
	const stat3 = spring({
		frame: Math.max(0, frame - (15 + STAT_STAGGER * 2)),
		fps,
		config: { damping: 13, mass: 0.7 },
	});

	// ── S2: Legal features ──────────────────────────────────────────────────
	const S2_START = S1_END + 12;
	const s2Title = spring({
		frame: Math.max(0, frame - S2_START),
		fps,
		config: { damping: 14, mass: 0.75 },
	});
	const s2Bullet1 = spring({
		frame: Math.max(0, frame - (S2_START + 30)),
		fps,
		config: { damping: 14, mass: 0.7 },
	});
	const s2Bullet2 = spring({
		frame: Math.max(0, frame - (S2_START + 55)),
		fps,
		config: { damping: 14, mass: 0.7 },
	});
	const s2Bullet3 = spring({
		frame: Math.max(0, frame - (S2_START + 80)),
		fps,
		config: { damping: 14, mass: 0.7 },
	});

	// ── S3: Popup + screenshot ──────────────────────────────────────────────
	const S3_START = S2_END + 12;
	const s3Text = spring({
		frame: Math.max(0, frame - S3_START),
		fps,
		config: { damping: 14, mass: 0.75 },
	});
	const s3Phone = spring({
		frame: Math.max(0, frame - (S3_START + 40)),
		fps,
		config: { damping: 11, mass: 0.8 },
	});

	// ── S4: Map colors + municipality ───────────────────────────────────────
	const S4_START = S3_END + 12;
	const s4Line1 = spring({
		frame: Math.max(0, frame - S4_START),
		fps,
		config: { damping: 13, mass: 0.75 },
	});
	const s4Line2 = spring({
		frame: Math.max(0, frame - (S4_START + 40)),
		fps,
		config: { damping: 13, mass: 0.75 },
	});
	const s4Phone = spring({
		frame: Math.max(0, frame - (S4_START + 70)),
		fps,
		config: { damping: 11, mass: 0.8 },
	});

	// ── S5: Title card ──────────────────────────────────────────────────────
	const S5_START = S4_END + 10;
	const s5Line1 = spring({
		frame: Math.max(0, frame - S5_START),
		fps,
		config: { damping: 12, mass: 0.8 },
	});
	const s5Line2 = spring({
		frame: Math.max(0, frame - (S5_START + 22)),
		fps,
		config: { damping: 12, mass: 0.8 },
	});
	const s5Sub = spring({
		frame: Math.max(0, frame - (S5_START + 48)),
		fps,
		config: { damping: 14, mass: 0.6 },
	});
	const s5Platform = spring({
		frame: Math.max(0, frame - (S5_START + 72)),
		fps,
		config: { damping: 14, mass: 0.6 },
	});

	return (
		<AbsoluteFill
			style={{ backgroundColor: "#0F0D0B", fontFamily: "'Inter', sans-serif" }}
		>
			{/* ═══ CLIP A: coastal drive — S2 + S3 ═══ */}
			{frame >= S1_END && frame < CLIP_CROSSFADE + FADE_DUR && (
				<Video
					src={staticFile(
						"videos/orange_vw_camper_van_on_scenic_coastal_drive_37075748_1080x1920_37075748.mp4",
					)}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "center 30%",
						transform: `scale(${bgScaleA})`,
						opacity: clipAOpacity,
					}}
					muted
					loop
				/>
			)}

			{/* ═══ CLIP B: aerial forest road — S4 + S5 ═══ */}
			{frame >= CLIP_CROSSFADE && (
				<Video
					src={staticFile(
						"videos/aerial_view_of_scenic_forest_road_in_summer_34239173_1080x1920_34239173.mp4",
					)}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transform: `scale(${bgScaleB})`,
						opacity: clipBOpacity,
					}}
					muted
					loop
				/>
			)}

			{/* Global dimming overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						frame < S1_END
							? "linear-gradient(180deg, #0F0D0B 0%, #141210 100%)"
							: "linear-gradient(180deg, rgba(15,13,11,0.78) 0%, rgba(15,13,11,0.35) 40%, rgba(15,13,11,0.82) 100%)",
					pointerEvents: "none",
				}}
			/>

			<Audio
				src={staticFile("audio/music/data-reveal.mp3")}
				volume={musicVolume}
			/>

			{/* ═══ S1 — Stats: 83.006 / 17 / 89 (0-150f, 5s) ═══ */}
			{frame < S1_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						gap: "44px",
						opacity: s1Fade,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "60px",
						paddingRight: "150px",
					}}
				>
					<StatItem
						value="83.006"
						label="spots"
						progress={stat1}
						accent="#D97706"
						fontSize={90}
					/>
					<StatItem
						value="17"
						label="comunidades"
						progress={stat2}
						accent="#A0836C"
						fontSize={90}
					/>
					<StatItem
						value="89"
						label="fuentes legales"
						progress={stat3}
						accent="#D97706"
						fontSize={90}
					/>
				</div>
			)}

			{/* ═══ S2 — Legal depth (150-300f, 5s) ═══ */}
			{frame >= S1_END && frame < S2_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
						justifyContent: "center",
						gap: "32px",
						opacity: s2Fade,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "60px",
						paddingRight: "150px",
					}}
				>
					<div
						style={{
							opacity: s2Title,
							transform: `translateY(${(1 - s2Title) * 24}px)`,
						}}
					>
						<div
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontWeight: 500,
								fontSize: "28px",
								color: "#D97706",
								letterSpacing: "2px",
								textTransform: "uppercase",
								textShadow: "0 2px 16px rgba(0,0,0,0.8)",
							}}
						>
							Monitor Legal
						</div>
					</div>

					<FeatureBullet
						text="Normativa de cada comunidad autónoma"
						progress={s2Bullet1}
					/>
					<FeatureBullet
						text="Regulaciones de Parques Nacionales"
						progress={s2Bullet2}
						accent="#A0836C"
					/>
					<FeatureBullet
						text="Más de 150 documentos analizados"
						progress={s2Bullet3}
					/>
				</div>
			)}

			{/* ═══ S3 — Popup + screenshot (300-450f, 5s) ═══ */}
			{frame >= S2_END && frame < S3_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
						justifyContent: "center",
						gap: "28px",
						opacity: s3Fade,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "60px",
						paddingRight: "150px",
					}}
				>
					<div
						style={{
							opacity: s3Text,
							transform: `translateY(${(1 - s3Text) * 24}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 800,
								fontSize: "68px",
								color: "#FFFFFF",
								letterSpacing: "-2px",
								lineHeight: 1.1,
								textShadow,
							}}
						>
							Toca un spot en el mapa.
							<br />
							<span style={{ color: "#D97706" }}>
								Situación legal al instante.
							</span>
						</div>
					</div>

					<div
						style={{
							opacity: s3Phone,
							transform: `scale(${0.88 + s3Phone * 0.12}) translateY(${(1 - s3Phone) * 30}px)`,
							alignSelf: "center",
						}}
					>
						<div
							style={{
								borderRadius: "32px",
								overflow: "hidden",
								border: "3px solid rgba(217,119,6,0.6)",
								boxShadow:
									"0 8px 60px rgba(0,0,0,0.7), 0 0 40px rgba(217,119,6,0.2)",
								width: "440px",
							}}
						>
							<Img
								src={staticFile("images/app-screenshots-2.0/spot-detail.png")}
								style={{ width: "100%", display: "block" }}
							/>
						</div>
					</div>
				</div>
			)}

			{/* ═══ S4 — Map colors + municipality (450-600f, 5s) ═══ */}
			{frame >= S3_END && frame < S4_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
						justifyContent: "center",
						gap: "28px",
						opacity: s4Fade,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "60px",
						paddingRight: "150px",
					}}
				>
					<div
						style={{
							opacity: s4Line1,
							transform: `translateY(${(1 - s4Line1) * 24}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 800,
								fontSize: "64px",
								color: "#FFFFFF",
								letterSpacing: "-2px",
								lineHeight: 1.15,
								textShadow,
							}}
						>
							Cada spot con su
							<br />
							<span style={{ color: "#D97706" }}>municipio y provincia.</span>
						</div>
					</div>

					<div
						style={{
							opacity: s4Line2,
							transform: `translateY(${(1 - s4Line2) * 22}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 600,
								fontSize: "50px",
								color: "rgba(255,255,255,0.85)",
								letterSpacing: "-0.5px",
								lineHeight: 1.25,
								textShadow,
							}}
						>
							Marcadores de colores
							<br />
							según el nivel de pernocta.
						</div>
					</div>

					<div
						style={{
							opacity: s4Phone,
							transform: `scale(${0.88 + s4Phone * 0.12}) translateY(${(1 - s4Phone) * 30}px)`,
							alignSelf: "center",
						}}
					>
						<div
							style={{
								borderRadius: "32px",
								overflow: "hidden",
								border: "3px solid rgba(217,119,6,0.6)",
								boxShadow:
									"0 8px 60px rgba(0,0,0,0.7), 0 0 40px rgba(217,119,6,0.2)",
								width: "440px",
							}}
						>
							<Img
								src={staticFile("images/app-screenshots-2.0/map-popup.png")}
								style={{ width: "100%", display: "block" }}
							/>
						</div>
					</div>
				</div>
			)}

			{/* ═══ S5 — "WildSpotter 2.0 llega esta semana" (600-750f, 5s) ═══ */}
			{frame >= S4_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "28px",
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "50px",
						paddingRight: "150px",
						textAlign: "center",
					}}
				>
					<div
						style={{
							opacity: s5Line1,
							transform: `translateY(${(1 - s5Line1) * 32}px)`,
						}}
					>
						<div
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontWeight: 700,
								fontSize: "110px",
								color: "#FFFFFF",
								letterSpacing: "-4px",
								lineHeight: 1.0,
								textShadow,
							}}
						>
							WildSpotter
						</div>
					</div>

					<div
						style={{
							opacity: s5Line2,
							transform: `translateY(${(1 - s5Line2) * 28}px)`,
						}}
					>
						<div
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontWeight: 700,
								fontSize: "110px",
								color: "#D97706",
								letterSpacing: "-4px",
								lineHeight: 1.0,
								textShadow:
									"0 2px 28px rgba(0,0,0,0.9), 0 0 50px rgba(217,119,6,0.3)",
							}}
						>
							2.0
						</div>
					</div>

					<div
						style={{
							opacity: s5Sub,
							transform: `translateY(${(1 - s5Sub) * 20}px)`,
							marginTop: "8px",
						}}
					>
						<div
							style={{
								fontWeight: 600,
								fontSize: "52px",
								color: "rgba(255,255,255,0.85)",
								letterSpacing: "-0.5px",
								lineHeight: 1.2,
								textShadow,
							}}
						>
							llega{" "}
							<span
								style={{
									color: "#D97706",
									textShadow: "0 0 30px rgba(217,119,6,0.4)",
								}}
							>
								pronto.
							</span>
						</div>
					</div>

					<div
						style={{
							opacity: s5Platform,
							transform: `translateY(${(1 - s5Platform) * 14}px)`,
							marginTop: "4px",
						}}
					>
						<div
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontWeight: 400,
								fontSize: "32px",
								color: "#A0836C",
								letterSpacing: 0,
								textShadow: "0 2px 16px rgba(0,0,0,0.7)",
							}}
						>
							Gratis en iOS y Android
						</div>
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
