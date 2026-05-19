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

export const DOS_POINT_CERO_FRAMES = 870; // 29s @ 30fps — generous reading time

// Scene boundaries — each scene gets ~5-6s for comfortable reading
const S1_END = 170;  // 0-170f (5.7s) — "WildSpotter 2.0. Ya disponible."
const S2_END = 370;  // 170-370f (6.7s) — map-popup demo
const S3_END = 570;  // 370-570f (6.7s) — spot-detail + monitor legal
const S4_END = 720;  // 570-720f (5s) — "Gratis. Sin registro."
const S5_END = DOS_POINT_CERO_FRAMES; // 720-870f (5s) — CTA

const FADE_DUR = 18;
const CLIP_CROSSFADE = S3_END; // scenic drive -> tranquil beach crossfade

type FeatureLineProps = {
	text: string;
	accent?: string;
	progress: number;
	fontSize?: number;
};

const FeatureLine: React.FC<FeatureLineProps> = ({
	text,
	accent = "#D97706",
	progress,
	fontSize = 50,
}) => (
	<div
		style={{
			display: "flex",
			alignItems: "center",
			gap: "18px",
			opacity: progress,
			transform: `translateY(${(1 - progress) * 22}px)`,
		}}
	>
		<div
			style={{
				width: "4px",
				height: `${fontSize * 1.1}px`,
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
				fontSize: `${fontSize}px`,
				color: "#FFFFFF",
				lineHeight: 1.25,
				letterSpacing: "-0.5px",
				textShadow: "0 2px 20px rgba(0,0,0,0.9)",
			}}
		>
			{text}
		</span>
	</div>
);

type PhoneFrameProps = {
	screenshotSrc: string;
	progress: number;
	glowColor?: string;
	width?: number;
};

const PhoneFrame: React.FC<PhoneFrameProps> = ({
	screenshotSrc,
	progress,
	glowColor = "rgba(217,119,6,0.35)",
	width = 360,
}) => (
	<div
		style={{
			opacity: progress,
			transform: `scale(${0.88 + progress * 0.12}) translateY(${(1 - progress) * 28}px)`,
		}}
	>
		{/* Phone shell */}
		<div
			style={{
				width: `${width}px`,
				borderRadius: "36px",
				overflow: "hidden",
				border: "4px solid rgba(255,255,255,0.12)",
				boxShadow: `0 16px 80px rgba(0,0,0,0.8), 0 0 60px ${glowColor}`,
				background: "#0A0F1C",
				position: "relative",
			}}
		>
			{/* Notch */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: "50%",
					transform: "translateX(-50%)",
					width: "120px",
					height: "18px",
					backgroundColor: "#000000",
					borderBottomLeftRadius: "10px",
					borderBottomRightRadius: "10px",
					zIndex: 2,
				}}
			/>
			<Img
				src={staticFile(screenshotSrc)}
				style={{ width: "100%", display: "block" }}
			/>
		</div>
	</div>
);

export const DosPointCero: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const textShadow = "0 2px 24px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.5)";

	// ── Music volume ─────────────────────────────────────────────────────────────
	const musicVolume = interpolate(
		frame,
		[0, 20, S5_END - 90, S5_END],
		[0, 0.40, 0.40, 0],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
	);

	// ── Clip A: ai_Spanish_Countryside_Van_Video — S1 through S4 ───────────────
	const bgScaleA = interpolate(frame, [0, CLIP_CROSSFADE], [1.0, 1.10], {
		extrapolateRight: "clamp",
	});

	const clipAOpacity = (() => {
		// Dims by scene: S1=25%, S2+S3=30% (screenshots are focus), S4=22%
		if (frame >= CLIP_CROSSFADE) return 0;
		const fadeOut = interpolate(
			frame,
			[CLIP_CROSSFADE - FADE_DUR, CLIP_CROSSFADE],
			[1, 0],
			{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
		);
		const baseDim = (() => {
			if (frame < S1_END) return 0.25;
			if (frame < S2_END) return 0.28;
			if (frame < S3_END) return 0.28;
			return 0.22;
		})();
		if (frame >= CLIP_CROSSFADE - FADE_DUR) return baseDim * fadeOut;
		return baseDim;
	})();

	// ── Clip B: lonely_beach — S5 CTA ─────────────────────────────────────────
	const bgScaleB = interpolate(
		frame,
		[CLIP_CROSSFADE, S5_END],
		[1.0, 1.08],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
	);

	const clipBOpacity = (() => {
		if (frame < CLIP_CROSSFADE) return 0;
		const fadeIn = interpolate(
			frame,
			[CLIP_CROSSFADE, CLIP_CROSSFADE + FADE_DUR],
			[0, 0.35],
			{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
		);
		if (frame < CLIP_CROSSFADE + FADE_DUR) return fadeIn;
		return 0.35;
	})();

	// Scene fade-outs
	const s1FadeOut = interpolate(frame, [S1_END - FADE_DUR, S1_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s2FadeOut = interpolate(frame, [S2_END - FADE_DUR, S2_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s3FadeOut = interpolate(frame, [S3_END - FADE_DUR, S3_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s4FadeOut = interpolate(frame, [S4_END - FADE_DUR, S4_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// ── Scene 1 animations: big reveal ─────────────────────────────────────────
	const s1LogoScale = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 11, mass: 0.7 } });
	const s1LogoOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
	const s1Line1 = spring({ frame: Math.max(0, frame - 35), fps, config: { damping: 13, mass: 0.8 } });
	const s1Line2 = spring({ frame: Math.max(0, frame - 60), fps, config: { damping: 13, mass: 0.8 } });
	const s1Sub = spring({ frame: Math.max(0, frame - 88), fps, config: { damping: 15, mass: 0.6 } });

	// ── Scene 2 animations: map-popup feature ──────────────────────────────────
	const S2_START = S1_END + 10;
	const s2Label = spring({ frame: Math.max(0, frame - S2_START), fps, config: { damping: 14, mass: 0.7 } });
	const s2Title = spring({ frame: Math.max(0, frame - (S2_START + 20)), fps, config: { damping: 13, mass: 0.75 } });
	const s2Body = spring({ frame: Math.max(0, frame - (S2_START + 40)), fps, config: { damping: 13, mass: 0.75 } });
	const s2Phone = spring({ frame: Math.max(0, frame - (S2_START + 65)), fps, config: { damping: 11, mass: 0.85 } });

	// ── Scene 3 animations: spot-detail + monitor legal ────────────────────────
	const S3_START = S2_END + 10;
	const s3Phone = spring({ frame: Math.max(0, frame - S3_START), fps, config: { damping: 11, mass: 0.85 } });
	const s3Title = spring({ frame: Math.max(0, frame - (S3_START + 20)), fps, config: { damping: 13, mass: 0.75 } });
	const s3Line1 = spring({ frame: Math.max(0, frame - (S3_START + 45)), fps, config: { damping: 13, mass: 0.75 } });
	const s3Line2 = spring({ frame: Math.max(0, frame - (S3_START + 68)), fps, config: { damping: 13, mass: 0.75 } });

	// ── Scene 4 animations: municipality ──────────────────────────────────────
	const S4_START = S3_END + 10;
	const s4Line1 = spring({ frame: Math.max(0, frame - S4_START), fps, config: { damping: 13, mass: 0.8 } });
	const s4Line2 = spring({ frame: Math.max(0, frame - (S4_START + 28)), fps, config: { damping: 13, mass: 0.8 } });

	// ── Scene 5 CTA animations ─────────────────────────────────────────────────
	const S5_START = S4_END + 12;
	const s5LogoScale = spring({ frame: Math.max(0, frame - S5_START), fps, config: { damping: 12, mass: 0.8 } });
	const s5LogoOpacity = interpolate(frame, [S5_START, S5_START + 22], [0, 1], { extrapolateRight: "clamp" });
	const s5BrandName = spring({ frame: Math.max(0, frame - (S5_START + 28)), fps, config: { damping: 14, mass: 0.7 } });
	const dividerProgress = spring({ frame: Math.max(0, frame - (S5_START + 48)), fps, config: { damping: 14, mass: 0.5 } });
	const dividerWidth = interpolate(dividerProgress, [0, 1], [0, 200]);
	const s5Pill = spring({ frame: Math.max(0, frame - (S5_START + 68)), fps, config: { damping: 12, mass: 0.7 } });
	const s5CTA = spring({ frame: Math.max(0, frame - (S5_START + 90)), fps, config: { damping: 14, mass: 0.7 } });

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B", fontFamily: "'Inter', sans-serif" }}>

			{/* ═══ CLIP A: ai_Spanish_Countryside_Van_Video — S1 through S4 ═══ */}
			<Video
				src={staticFile("videos/scenic_forest_drive_on_a_dirt_road_32990645_1440x1920_32990645.mp4")}
				style={{
					position: "absolute",
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: "center 40%",
					transform: `scale(${bgScaleA})`,
					opacity: clipAOpacity,
				}}
				muted
				loop
			/>

			{/* ═══ CLIP B: lonely_beach — S5 CTA ═══ */}
			<Video
				src={staticFile(
					"videos/tranquil_beach_with_rolling_waves_34804521_2160x3840_34804521.mp4",
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

			{/* Global gradient overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"linear-gradient(180deg, rgba(15,13,11,0.75) 0%, rgba(15,13,11,0.30) 40%, rgba(15,13,11,0.80) 100%)",
					pointerEvents: "none",
				}}
			/>

			{/* Music */}
			<Audio
				src={staticFile("audio/music/pulse-reveal.mp3")}
				volume={musicVolume}
			/>

			{/* ═══ SCENE 1 — "WildSpotter 2.0. Ya disponible." (0-160f, 5.3s) ═══ */}
			{frame < S1_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "32px",
						opacity: s1FadeOut,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "50px",
						paddingRight: "150px",
						textAlign: "center",
					}}
				>
					<Img
						src={staticFile("images/app-logo.png")}
						style={{
							width: 120,
							height: 120,
							borderRadius: 26,
							transform: `scale(${s1LogoScale})`,
							opacity: s1LogoOpacity,
							boxShadow: "0 0 80px rgba(217,119,6,0.55), 0 0 30px rgba(0,0,0,0.6)",
						}}
					/>

					<div
						style={{
							opacity: s1Line1,
							transform: `translateY(${(1 - s1Line1) * 30}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 900,
								fontSize: "100px",
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
							opacity: s1Line2,
							transform: `translateY(${(1 - s1Line2) * 28}px)`,
						}}
					>
						<div
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontWeight: 700,
								fontSize: "90px",
								color: "#D97706",
								letterSpacing: "-3px",
								lineHeight: 1.0,
								textShadow: "0 2px 28px rgba(0,0,0,0.9), 0 0 50px rgba(217,119,6,0.35)",
							}}
						>
							2.0
						</div>
					</div>

					<div
						style={{
							opacity: s1Sub,
							transform: `translateY(${(1 - s1Sub) * 20}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 600,
								fontSize: "52px",
								color: "rgba(255,255,255,0.88)",
								letterSpacing: "-0.5px",
								lineHeight: 1.2,
								textShadow,
							}}
						>
							Ya disponible.
						</div>
					</div>
				</div>
			)}

			{/* ═══ SCENE 2 — map-popup demo (160-340f, 6s) ═══ */}
			{frame >= S1_END && frame < S2_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
						justifyContent: "center",
						gap: "24px",
						opacity: s2FadeOut,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "60px",
						paddingRight: "150px",
					}}
				>
					{/* Section label */}
					<div
						style={{
							opacity: s2Label,
							transform: `translateY(${(1 - s2Label) * 16}px)`,
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
							Nueva función
						</div>
					</div>

					<div
						style={{
							opacity: s2Title,
							transform: `translateY(${(1 - s2Title) * 22}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 800,
								fontSize: "72px",
								color: "#FFFFFF",
								letterSpacing: "-2px",
								lineHeight: 1.1,
								textShadow,
							}}
						>
							Toca un spot
							<br />
							en el mapa.
						</div>
					</div>

					<div
						style={{
							opacity: s2Body,
							transform: `translateY(${(1 - s2Body) * 20}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 500,
								fontSize: "46px",
								color: "#D97706",
								letterSpacing: "-0.5px",
								lineHeight: 1.3,
								textShadow: "0 2px 18px rgba(0,0,0,0.85)",
							}}
						>
							Score, foto satélite
							<br />y situación legal.{" "}
							<span style={{ color: "rgba(255,255,255,0.75)" }}>Al instante.</span>
						</div>
					</div>

					<PhoneFrame
						screenshotSrc="images/app-screenshots-2.0/map-popup.png"
						progress={s2Phone}
						glowColor="rgba(217,119,6,0.3)"
						width={380}
					/>
				</div>
			)}

			{/* ═══ SCENE 3 — spot-detail + monitor legal (340-510f, 5.7s) ═══ */}
			{frame >= S2_END && frame < S3_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "24px",
						opacity: s3FadeOut,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "60px",
						paddingRight: "60px",
					}}
				>
					{/* Phone on the left */}
					<PhoneFrame
						screenshotSrc="images/app-screenshots-2.0/spot-detail.png"
						progress={s3Phone}
						glowColor="rgba(217,119,6,0.25)"
						width={340}
					/>

					{/* Text on the right */}
					<div
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							gap: "28px",
							paddingLeft: "16px",
							paddingRight: "90px",
						}}
					>
						<div
							style={{
								opacity: s3Title,
								transform: `translateY(${(1 - s3Title) * 22}px)`,
							}}
						>
							<div
								style={{
									fontWeight: 800,
									fontSize: "64px",
									color: "#FFFFFF",
									letterSpacing: "-2px",
									lineHeight: 1.1,
									textShadow,
								}}
							>
								Monitor
								<br />
								<span style={{ color: "#D97706" }}>Legal</span>
							</div>
						</div>

						<FeatureLine
							text="89 fuentes oficiales"
							progress={s3Line1}
							fontSize={42}
						/>
						<FeatureLine
							text="17 comunidades autónomas"
							progress={s3Line2}
							accent="#A0836C"
							fontSize={42}
						/>
					</div>
				</div>
			)}

			{/* ═══ SCENE 4 — "Cada spot muestra su municipio" (510-600f, 3s) ═══ */}
			{frame >= S3_END && frame < S4_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "20px",
						opacity: s4FadeOut,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "50px",
						paddingRight: "150px",
						textAlign: "center",
					}}
				>
					<div
						style={{
							opacity: s4Line1,
							transform: `translateY(${(1 - s4Line1) * 28}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 800,
								fontSize: "80px",
								color: "#FFFFFF",
								letterSpacing: "-2.5px",
								lineHeight: 1.05,
								textShadow,
							}}
						>
							Gratis.
							<br />
							Sin registro.
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
								fontWeight: 500,
								fontSize: "48px",
								color: "#D97706",
								letterSpacing: "-0.5px",
								lineHeight: 1.3,
								textShadow: "0 2px 18px rgba(0,0,0,0.85)",
							}}
						>
							Cada spot con su municipio
							<br />y provincia.
						</div>
					</div>
				</div>
			)}

			{/* ═══ SCENE 5 — CTA (600-720f, 4s) ═══ */}
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
					}}
				>
					<Img
						src={staticFile("images/app-logo.png")}
						style={{
							width: 130,
							height: 130,
							borderRadius: 28,
							transform: `scale(${s5LogoScale})`,
							opacity: s5LogoOpacity,
							boxShadow:
								"0 0 80px rgba(217,119,6,0.55), 0 0 30px rgba(0,0,0,0.6)",
						}}
					/>

					<div
						style={{
							opacity: s5BrandName,
							transform: `translateY(${(1 - s5BrandName) * 18}px)`,
						}}
					>
						<div
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontWeight: 700,
								fontSize: "52px",
								color: "#FFFFFF",
								letterSpacing: "4px",
								textAlign: "center",
								textShadow,
							}}
						>
							WildSpotter
						</div>
					</div>

					{/* Animated amber divider */}
					<div
						style={{
							width: `${dividerWidth}px`,
							height: "3px",
							backgroundColor: "#D97706",
							borderRadius: "2px",
							boxShadow: "0 0 20px rgba(217,119,6,0.7)",
						}}
					/>

					{/* CTA pill */}
					<div
						style={{
							opacity: s5Pill,
							transform: `scale(${0.9 + s5Pill * 0.1}) translateY(${(1 - s5Pill) * 16}px)`,
						}}
					>
						<div
							style={{
								backgroundColor: "#D97706",
								borderRadius: "50px",
								paddingTop: "20px",
								paddingBottom: "20px",
								paddingLeft: "48px",
								paddingRight: "48px",
								boxShadow: "0 4px 40px rgba(217,119,6,0.5)",
							}}
						>
							<span
								style={{
									fontFamily: "'JetBrains Mono', monospace",
									fontWeight: 700,
									fontSize: "36px",
									color: "#0F0D0B",
									letterSpacing: "0.5px",
									whiteSpace: "nowrap",
								}}
							>
								Actualiza ahora
							</span>
						</div>
					</div>

					<div
						style={{
							opacity: s5CTA,
							transform: `translateY(${(1 - s5CTA) * 14}px)`,
						}}
					>
						<div
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontWeight: 400,
								fontSize: "30px",
								color: "#A0836C",
								letterSpacing: 0,
								textAlign: "center",
								textShadow: "0 2px 16px rgba(0,0,0,0.7)",
							}}
						>
							Gratis en iOS y Android · link en bio
						</div>
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
