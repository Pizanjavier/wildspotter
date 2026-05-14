import {
	AbsoluteFill,
	Img,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import React from "react";

export const ANDROID_LAUNCH_FRAMES = 810; // 27s @ 30fps

type HookVariant = "AL1" | "AL2";

type AndroidLaunchProps = {
	hookVariant?: HookVariant;
	musicTrack?: string;
};

type BadgeProps = {
	store: "apple" | "android";
	opacity: number;
	scale: number;
};

const StoreBadge: React.FC<BadgeProps> = ({ store, opacity, scale }) => {
	const isAndroid = store === "android";
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "16px",
				padding: "18px 36px",
				borderRadius: "14px",
				border: `2px solid ${isAndroid ? "rgba(217,119,6,0.85)" : "rgba(255,255,255,0.25)"}`,
				backgroundColor: isAndroid
					? "rgba(217,119,6,0.15)"
					: "rgba(0,0,0,0.45)",
				transform: `scale(${scale})`,
				opacity,
				boxShadow: isAndroid
					? "0 4px 40px rgba(217,119,6,0.35), 0 0 80px rgba(217,119,6,0.15)"
					: "0 4px 30px rgba(0,0,0,0.5)",
				minWidth: "300px",
				justifyContent: "center",
			}}
		>
			{isAndroid ? (
				<svg width="38" height="38" viewBox="0 0 24 24" fill="#D97706">
					<path d="M3 20.5v-17c0-.83 1-.67 1.35-.34l13.46 8.5c.43.27.43.91 0 1.18L4.35 20.84C4 21.17 3 21.33 3 20.5z" />
				</svg>
			) : (
				<svg width="38" height="38" viewBox="0 0 24 24" fill="#FFFFFF">
					<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
				</svg>
			)}
			<div style={{ display: "flex", flexDirection: "column" }}>
				<span
					style={{
						fontFamily: "'JetBrains Mono', monospace",
						fontSize: "15px",
						color: isAndroid ? "#D97706" : "rgba(245,235,216,0.65)",
						letterSpacing: 1,
						textTransform: "uppercase",
					}}
				>
					{isAndroid ? "Google Play" : "App Store"}
				</span>
				<span
					style={{
						fontFamily: "'Inter', sans-serif",
						fontWeight: 700,
						fontSize: "34px",
						color: isAndroid ? "#FFFFFF" : "rgba(255,255,255,0.85)",
						letterSpacing: "-1px",
						lineHeight: 1.1,
					}}
				>
					{isAndroid ? "Descárgala gratis" : "Ya en iOS"}
				</span>
			</div>
		</div>
	);
};

type DataItemProps = {
	text: string;
	accent?: string;
	fontSize?: number;
	fontWeight?: number;
	opacity: number;
	translateY: number;
};

const DataItem: React.FC<DataItemProps> = ({
	text,
	accent = "#D97706",
	fontSize = 48,
	fontWeight = 600,
	opacity,
	translateY,
}) => (
	<div
		style={{
			display: "flex",
			alignItems: "center",
			gap: "20px",
			opacity,
			transform: `translateY(${translateY}px)`,
			paddingLeft: "50px",
			paddingRight: "150px",
		}}
	>
		<div
			style={{
				width: "4px",
				height: `${fontSize * 1.1}px`,
				backgroundColor: accent,
				borderRadius: "2px",
				flexShrink: 0,
				boxShadow: `0 0 12px ${accent}80`,
			}}
		/>
		<span
			style={{
				fontFamily: "'Inter', sans-serif",
				fontWeight,
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

export const AndroidLaunch: React.FC<AndroidLaunchProps> = ({
	hookVariant = "AL1",
	musicTrack = "warm-launch",
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// S1 Hook:         0   -> 200f  (6.7s)
	// S2 Data cascade: 200 -> 440f  (8s)
	// S3 Universality: 440 -> 620f  (6s)
	// S4 CTA:          620 -> 810f  (6.3s)
	const S1_END = 200;
	const S2_END = 440;
	const S3_END = 620;
	const TOTAL = ANDROID_LAUNCH_FRAMES;
	const FADE_DUR = 18;

	// Crossfade midpoint between the two clips
	const CLIP_CROSSFADE = S2_END;

	// Ken Burns — one per clip, continuous across their scenes
	const bgScaleA = interpolate(frame, [0, CLIP_CROSSFADE], [1.0, 1.1], {
		extrapolateRight: "clamp",
	});
	const bgScaleB = interpolate(frame, [CLIP_CROSSFADE, TOTAL], [1.0, 1.1], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// Clip A: hippie_van_in_mountains — covers S1 + S2 (0 -> ~440f)
	// Dimming: 80% for S1 (text-heavy hook), eases to 70% during S2 (data cascade)
	const clipAOpacity = (() => {
		const baseDim = interpolate(frame, [0, CLIP_CROSSFADE], [0.2, 0.3], {
			extrapolateRight: "clamp",
		});
		const fadeOut = interpolate(
			frame,
			[CLIP_CROSSFADE - FADE_DUR, CLIP_CROSSFADE],
			[1, 0],
			{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
		);
		if (frame >= CLIP_CROSSFADE) return 0;
		if (frame >= CLIP_CROSSFADE - FADE_DUR) return baseDim * fadeOut;
		return baseDim;
	})();

	// Clip B: stunning_cliffs_turquoise_sea — covers S3 + S4 (~440f -> end)
	// Dimming: 70% for S3, eases to 50% for S4 (brighter CTA payoff)
	const clipBOpacity = (() => {
		const fadeIn = interpolate(
			frame,
			[CLIP_CROSSFADE, CLIP_CROSSFADE + FADE_DUR],
			[0, 0.3],
			{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
		);
		const baseDim = interpolate(frame, [CLIP_CROSSFADE, TOTAL], [0.3, 0.5], {
			extrapolateRight: "clamp",
			extrapolateLeft: "clamp",
		});
		if (frame < CLIP_CROSSFADE) return 0;
		if (frame < CLIP_CROSSFADE + FADE_DUR) return fadeIn;
		return baseDim;
	})();

	// Music fade out
	const musicVolume = interpolate(frame, [TOTAL - 90, TOTAL], [0.38, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// ── Scene 1: Hook animations ─────────────────────────────────────────────
	const s1LogoScale = spring({
		frame,
		fps,
		config: { damping: 12, mass: 0.7 },
	});
	const s1LogoOpacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});

	const s1TitleDelay = 28;
	const s1TitleProgress = spring({
		frame: Math.max(0, frame - s1TitleDelay),
		fps,
		config: { damping: 14, mass: 0.8 },
	});

	// AL1: badges stagger
	const s1SubDelay = 65;
	const s1SubProgress = spring({
		frame: Math.max(0, frame - s1SubDelay),
		fps,
		config: { damping: 14 },
	});
	const appleDelay = 50;
	const appleScale = spring({
		frame: Math.max(0, frame - appleDelay),
		fps,
		config: { damping: 11, mass: 0.6 },
	});
	const appleOpacity = interpolate(
		frame,
		[appleDelay, appleDelay + 20],
		[0, 1],
		{
			extrapolateRight: "clamp",
		},
	);
	const androidDelay = 60;
	const androidScale = spring({
		frame: Math.max(0, frame - androidDelay),
		fps,
		config: { damping: 9, mass: 0.7 },
	});
	const androidOpacity = interpolate(
		frame,
		[androidDelay, androidDelay + 22],
		[0, 1],
		{ extrapolateRight: "clamp" },
	);

	// AL2: direct text
	const s1AL2TitleProgress = spring({
		frame: Math.max(0, frame - 20),
		fps,
		config: { damping: 14, mass: 0.9 },
	});
	const s1AL2SubDelay = 30;
	const s1AL2SubProgress = spring({
		frame: Math.max(0, frame - s1AL2SubDelay),
		fps,
		config: { damping: 14 },
	});
	const s1AL2PlayDelay = 50;
	const s1AL2PlayScale = spring({
		frame: Math.max(0, frame - s1AL2PlayDelay),
		fps,
		config: { damping: 10, mass: 0.65 },
	});
	const s1AL2PlayOpacity = interpolate(
		frame,
		[s1AL2PlayDelay, s1AL2PlayDelay + 20],
		[0, 1],
		{ extrapolateRight: "clamp" },
	);

	const s1TextFadeOut = interpolate(frame, [S1_END - 20, S1_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// ── Scene 2: Data cascade ────────────────────────────────────────────────
	const dataItems = [
		"83.006 spots analizados",
		"Solo 393 con score ≥ 70",
		"7 capas de análisis por spot",
		"Datos legales reales",
		"IA satelital — 25cm/px",
	];
	const DATA_STAGGER = 28;
	const DATA_START = S1_END + 20;

	const payoffDelay = DATA_START + dataItems.length * DATA_STAGGER + 25;
	const payoffProgress = spring({
		frame: Math.max(0, frame - payoffDelay),
		fps,
		config: { damping: 12, mass: 0.6 },
	});

	const s2TextFadeOut = interpolate(frame, [S2_END - 20, S2_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// ── Scene 3: Universality ────────────────────────────────────────────────
	const S3_START = S2_END + 18;
	const line1Delay = S3_START;
	const line2Delay = S3_START + 20;
	const line3Delay = S3_START + 40;
	const taglineDelay = S3_START + 60;

	const makeLine = (delay: number) =>
		spring({
			frame: Math.max(0, frame - delay),
			fps,
			config: { damping: 14, mass: 0.7 },
		});

	const l1 = makeLine(line1Delay);
	const l2 = makeLine(line2Delay);
	const l3 = makeLine(line3Delay);
	const tagline = makeLine(taglineDelay);

	const s3TextFadeOut = interpolate(frame, [S3_END - 22, S3_END], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// ── Scene 4: CTA ─────────────────────────────────────────────────────────
	const S4_START = S3_END + 12;
	const ctaLogoScale = spring({
		frame: Math.max(0, frame - S4_START),
		fps,
		config: { damping: 12, mass: 0.8 },
	});
	const ctaLogoOpacity = interpolate(frame, [S4_START, S4_START + 25], [0, 1], {
		extrapolateRight: "clamp",
	});
	const ctaBadgeDelay = S4_START + 35;
	const ctaBadgeScale = spring({
		frame: Math.max(0, frame - ctaBadgeDelay),
		fps,
		config: { damping: 10, mass: 0.6 },
	});
	const ctaBadgeOpacity = interpolate(
		frame,
		[ctaBadgeDelay, ctaBadgeDelay + 22],
		[0, 1],
		{ extrapolateRight: "clamp" },
	);
	const ctaTextDelay = S4_START + 60;
	const ctaTextProgress = spring({
		frame: Math.max(0, frame - ctaTextDelay),
		fps,
		config: { damping: 14 },
	});
	const ctaSubDelay = S4_START + 90;
	const ctaSubProgress = spring({
		frame: Math.max(0, frame - ctaSubDelay),
		fps,
		config: { damping: 14 },
	});
	const ctaTaglineDelay = S4_START + 115;
	const ctaTaglineProgress = spring({
		frame: Math.max(0, frame - ctaTaglineDelay),
		fps,
		config: { damping: 14 },
	});

	const textShadow = "0 2px 24px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.5)";

	return (
		<AbsoluteFill
			style={{ backgroundColor: "#0F0D0B", fontFamily: "'Inter', sans-serif" }}
		>
			{/* ═══ CLIP A: hippie van in mountains — S1 + S2 (0 -> crossfade) ═══ */}
			<Sequence from={0} durationInFrames={CLIP_CROSSFADE + FADE_DUR}>
				<Video
					src={staticFile(
						"videos/hippie_van_in_mountains_18444421_1080x1920_18444421.mp4",
					)}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transform: `scale(${bgScaleA})`,
						opacity: clipAOpacity,
					}}
					muted
					loop
				/>
			</Sequence>

			{/* ═══ CLIP B: stunning cliffs + turquoise sea — S3 + S4 (crossfade -> end) ═══ */}
			<Sequence
				from={CLIP_CROSSFADE - FADE_DUR}
				durationInFrames={TOTAL - CLIP_CROSSFADE + FADE_DUR * 2}
			>
				<Video
					src={staticFile(
						"videos/stunning_cliffs_and_turquoise_sea_from_above_34885409_2160x3840_34885409.mp4",
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
			</Sequence>

			{/* Global dark overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"linear-gradient(180deg, rgba(15,13,11,0.70) 0%, rgba(15,13,11,0.35) 40%, rgba(15,13,11,0.75) 100%)",
					pointerEvents: "none",
				}}
			/>

			{/* Music */}
			<Audio
				src={staticFile(`audio/music/${musicTrack}.mp3`)}
				volume={musicVolume}
			/>

			{/* ═══ SCENE 1 — Hook (0-200f, 6.7s) ═══ */}
			{frame < S1_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "44px",
						opacity: s1TextFadeOut,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "50px",
						paddingRight: "150px",
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
							boxShadow:
								"0 0 80px rgba(217,119,6,0.5), 0 0 30px rgba(0,0,0,0.6)",
						}}
					/>

					{hookVariant === "AL1" ? (
						<>
							<div
								style={{
									textAlign: "center",
									transform: `translateY(${(1 - s1TitleProgress) * 28}px)`,
									opacity: s1TitleProgress,
								}}
							>
								<div
									style={{
										fontWeight: 900,
										fontSize: "82px",
										color: "#FFFFFF",
										letterSpacing: "-3px",
										lineHeight: 1.05,
										textShadow,
									}}
								>
									WildSpotter
								</div>
								<div
									style={{
										fontWeight: 700,
										fontSize: "52px",
										color: "#D97706",
										letterSpacing: "-1.5px",
										lineHeight: 1.2,
										marginTop: "12px",
										textShadow,
									}}
								>
									Ahora en todas
									<br />
									las plataformas.
								</div>
							</div>

							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "20px",
									alignItems: "center",
									transform: `translateY(${(1 - s1SubProgress) * 20}px)`,
									opacity: s1SubProgress,
								}}
							>
								<StoreBadge
									store="apple"
									opacity={appleOpacity}
									scale={appleScale}
								/>
								<StoreBadge
									store="android"
									opacity={androidOpacity}
									scale={androidScale}
								/>
							</div>
						</>
					) : (
						<>
							<div
								style={{
									textAlign: "center",
									transform: `translateY(${(1 - s1AL2TitleProgress) * 32}px)`,
									opacity: s1AL2TitleProgress,
								}}
							>
								<div
									style={{
										fontWeight: 900,
										fontSize: "94px",
										color: "#FFFFFF",
										letterSpacing: "-3px",
										lineHeight: 1.0,
										textShadow,
									}}
								>
									Ya está
									<br />
									<span style={{ color: "#D97706" }}>en Android.</span>
								</div>
							</div>

							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: "16px",
									transform: `translateY(${(1 - s1AL2SubProgress) * 20}px)`,
									opacity: s1AL2SubProgress,
								}}
							>
								<div
									style={{
										fontFamily: "'JetBrains Mono', monospace",
										fontSize: "26px",
										fontWeight: 500,
										color: "rgba(245,235,216,0.75)",
										letterSpacing: 2,
										textTransform: "uppercase",
										textShadow: "0 2px 16px rgba(0,0,0,0.8)",
									}}
								>
									WildSpotter
								</div>
								<StoreBadge
									store="android"
									opacity={s1AL2PlayOpacity}
									scale={s1AL2PlayScale}
								/>
							</div>
						</>
					)}
				</div>
			)}

			{/* ═══ SCENE 2 — Data cascade (200-440f, 8s) ═══ */}
			{frame >= S1_END && frame < S2_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						gap: "28px",
						opacity: s2TextFadeOut,
						paddingBottom: "450px",
						paddingTop: "250px",
					}}
				>
					{dataItems.map((text, i) => {
						const delay = DATA_START + i * DATA_STAGGER;
						const progress = spring({
							frame: Math.max(0, frame - delay),
							fps,
							config: { damping: 13, mass: 0.6 },
						});
						return (
							<DataItem
								key={text}
								text={text}
								opacity={progress}
								translateY={(1 - progress) * 22}
							/>
						);
					})}

					<div
						style={{
							marginTop: "32px",
							paddingLeft: "50px",
							paddingRight: "150px",
							opacity: payoffProgress,
							transform: `translateY(${(1 - payoffProgress) * 18}px)`,
						}}
					>
						<div
							style={{
								fontWeight: 900,
								fontSize: "72px",
								color: "#D97706",
								letterSpacing: "-2px",
								lineHeight: 1.1,
								textShadow:
									"0 2px 28px rgba(0,0,0,0.9), 0 0 50px rgba(217,119,6,0.2)",
							}}
						>
							Gratis.
							<br />
							En tu Android.
						</div>
					</div>
				</div>
			)}

			{/* ═══ SCENE 3 — Universality (440-620f, 6s) ═══ */}
			{frame >= S2_END && frame < S3_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "8px",
						opacity: s3TextFadeOut,
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "50px",
						paddingRight: "150px",
						textAlign: "center",
					}}
				>
					<div
						style={{
							fontWeight: 900,
							fontSize: "88px",
							color: "#FFFFFF",
							letterSpacing: "-3px",
							lineHeight: 1.0,
							opacity: l1,
							transform: `translateY(${(1 - l1) * 30}px)`,
							textShadow,
						}}
					>
						iOS. Android.
					</div>

					<div
						style={{
							fontWeight: 900,
							fontSize: "88px",
							color: "#FFFFFF",
							letterSpacing: "-3px",
							lineHeight: 1.0,
							opacity: l2,
							transform: `translateY(${(1 - l2) * 30}px)`,
							textShadow,
						}}
					>
						Cualquier furgo.
					</div>

					<div
						style={{
							fontWeight: 900,
							fontSize: "88px",
							color: "#FFFFFF",
							letterSpacing: "-3px",
							lineHeight: 1.0,
							opacity: l3,
							transform: `translateY(${(1 - l3) * 30}px)`,
							marginBottom: "52px",
							textShadow,
						}}
					>
						Cualquier ruta.
					</div>

					<div
						style={{
							fontWeight: 500,
							fontSize: "46px",
							color: "#D97706",
							letterSpacing: "-0.5px",
							lineHeight: 1.3,
							opacity: tagline,
							transform: `translateY(${(1 - tagline) * 20}px)`,
							textShadow: "0 2px 20px rgba(0,0,0,0.85)",
						}}
					>
						El mismo radar.
						<br />
						En tu bolsillo.
					</div>
				</div>
			)}

			{/* ═══ SCENE 4 — CTA (620-810f, 6.3s) ═══ */}
			{frame >= S3_END && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "40px",
						paddingBottom: "450px",
						paddingTop: "250px",
						paddingLeft: "50px",
						paddingRight: "150px",
					}}
				>
					<Img
						src={staticFile("images/app-logo.png")}
						style={{
							width: 110,
							height: 110,
							borderRadius: 24,
							transform: `scale(${ctaLogoScale})`,
							opacity: ctaLogoOpacity,
							boxShadow:
								"0 0 60px rgba(217,119,6,0.4), 0 0 20px rgba(0,0,0,0.5)",
						}}
					/>

					<div
						style={{
							width: "60px",
							height: "3px",
							backgroundColor: "#D97706",
							borderRadius: "2px",
							opacity: ctaLogoOpacity,
							boxShadow: "0 0 16px rgba(217,119,6,0.6)",
							marginTop: "-20px",
						}}
					/>

					<StoreBadge
						store="android"
						opacity={ctaBadgeOpacity}
						scale={ctaBadgeScale}
					/>

					<div
						style={{
							fontWeight: 900,
							fontSize: "76px",
							color: "#FFFFFF",
							letterSpacing: "-2.5px",
							lineHeight: 1.0,
							textAlign: "center",
							opacity: ctaTextProgress,
							transform: `translateY(${(1 - ctaTextProgress) * 20}px)`,
							textShadow,
						}}
					>
						Descárgala gratis
					</div>

					<div
						style={{
							fontFamily: "'JetBrains Mono', monospace",
							fontSize: "28px",
							fontWeight: 400,
							color: "#A0836C",
							letterSpacing: 0,
							textAlign: "center",
							opacity: ctaSubProgress,
							transform: `translateY(${(1 - ctaSubProgress) * 12}px)`,
							textShadow: "0 2px 16px rgba(0,0,0,0.7)",
						}}
					>
						wildspotter.app · link en bio
					</div>

					<div
						style={{
							fontFamily: "'JetBrains Mono', monospace",
							fontSize: "26px",
							fontWeight: 700,
							color: "#D97706",
							letterSpacing: 1,
							textAlign: "center",
							opacity: ctaTaglineProgress,
							transform: `translateY(${(1 - ctaTaglineProgress) * 10}px)`,
							textShadow: "0 2px 16px rgba(0,0,0,0.8)",
							textTransform: "uppercase",
						}}
					>
						83.006 spots · 0 reseñas.
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
