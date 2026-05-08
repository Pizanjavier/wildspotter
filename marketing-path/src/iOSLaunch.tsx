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

export const IOS_LAUNCH_FRAMES = 660; // 22s @ 30fps

type IOSLaunchProps = {
	musicTrack?: string;
};

export const IOSLaunch: React.FC<IOSLaunchProps> = ({
	musicTrack = "golden-fields",
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// --- Scene timing (22s total) ---
	const scene1End = 210; // 0-7s: "Ya está aquí."
	const scene2End = 420; // 7-14s: Feature list
	// scene3: 420-660 (8s CTA + badge)

	const textShadow = "0 2px 24px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.5)";

	// --- Scene 1: "Ya está aquí." ---
	const s1LogoProgress = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
	const s1TitleDelay = 25;
	const s1TitleProgress = spring({
		frame: Math.max(0, frame - s1TitleDelay),
		fps,
		config: { damping: 14, mass: 0.8 },
	});
	const s1SubDelay = 55;
	const s1SubProgress = spring({
		frame: Math.max(0, frame - s1SubDelay),
		fps,
		config: { damping: 14 },
	});
	const s1FadeOut = interpolate(frame, [scene1End - 20, scene1End], [1, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// --- Scene 2: Feature words ---
	const features = [
		"Mapa completo de España",
		"Puntuaciones 0–100",
		"Datos legales reales",
		"Radar de spots salvajes",
		"100% gratis",
	];
	const featureInterval = 36; // 1.2s each
	const featureStart = scene1End + 10;

	// --- Scene 3: CTA ---
	const s3Start = scene2End + 10;
	const s3BadgeProgress = spring({
		frame: Math.max(0, frame - s3Start),
		fps,
		config: { damping: 12, mass: 0.6 },
	});
	const s3TextProgress = spring({
		frame: Math.max(0, frame - s3Start - 25),
		fps,
		config: { damping: 14 },
	});
	const s3AndroidProgress = spring({
		frame: Math.max(0, frame - s3Start - 55),
		fps,
		config: { damping: 14 },
	});

	// --- Ken Burns per scene ---
	const bgScale1 = interpolate(frame, [0, scene1End], [1.0, 1.1], {
		extrapolateRight: "clamp",
	});
	const bgScale2 = interpolate(frame, [scene1End, scene2End], [1.0, 1.1], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const bgScale3 = interpolate(frame, [scene2End, IOS_LAUNCH_FRAMES], [1.0, 1.08], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// Scene fade-in/out for smooth transitions
	const s1Opacity = interpolate(frame, [scene1End - 15, scene1End], [0.35, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s2FadeIn = interpolate(frame, [scene1End, scene1End + 15], [0, 0.2], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s2FadeOut = interpolate(frame, [scene2End - 15, scene2End], [0.2, 0], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});
	const s2Opacity = Math.min(s2FadeIn, frame < scene2End - 15 ? 0.2 : s2FadeOut);
	const s3FadeIn = interpolate(frame, [scene2End, scene2End + 15], [0, 0.35], {
		extrapolateRight: "clamp",
		extrapolateLeft: "clamp",
	});

	// Music fade out
	const musicVolume = interpolate(
		frame,
		[IOS_LAUNCH_FRAMES - 90, IOS_LAUNCH_FRAMES],
		[0.35, 0],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" },
	);

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B" }}>
			{/* === VIDEO BACKGROUNDS — each only mounts during its scene === */}

			{/* Scene 1: Couple inside van with lake (frames 0 → scene1End) */}
			<Sequence from={0} durationInFrames={scene1End}>
				<Video
					src={staticFile("videos/couple-inside-van-with-lake-outside.mp4")}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transform: `scale(${bgScale1})`,
						opacity: frame < scene1End - 15 ? 0.35 : s1Opacity,
					}}
					muted
				/>
			</Sequence>

			{/* Scene 2: RVs parked outdoors (scene1End → scene2End) */}
			<Sequence from={scene1End} durationInFrames={scene2End - scene1End}>
				<Video
					src={staticFile("videos/rvs_parked_outdoors.mp4")}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transform: `scale(${bgScale2})`,
						opacity: s2Opacity,
					}}
					muted
				/>
			</Sequence>

			{/* Scene 3: Couple coffee outside caravan (scene2End → end) */}
			<Sequence from={scene2End} durationInFrames={IOS_LAUNCH_FRAMES - scene2End}>
				<Video
					src={staticFile("videos/couple-cofee-outside-caravan.mp4")}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transform: `scale(${bgScale3})`,
						opacity: s3FadeIn,
					}}
					muted
				/>
			</Sequence>

			{/* Dark overlay for text readability */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"linear-gradient(180deg, rgba(15,13,11,0.55) 0%, rgba(15,13,11,0.25) 35%, rgba(15,13,11,0.65) 100%)",
				}}
			/>

			{/* Music */}
			<Audio
				src={staticFile(`audio/music/${musicTrack}.mp3`)}
				volume={musicVolume}
			/>

			{/* === SCENE 1: "Ya está aquí." === */}
			{frame < scene1End && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						opacity: s1FadeOut,
						gap: "36px",
					}}
				>
					<Img
						src={staticFile("images/app-logo.png")}
						style={{
							width: 130,
							height: 130,
							borderRadius: 28,
							transform: `scale(${s1LogoProgress})`,
							boxShadow: "0 0 80px rgba(217,119,6,0.4), 0 0 30px rgba(0,0,0,0.6)",
						}}
					/>
					<div
						style={{
							fontFamily: "'Inter', sans-serif",
							fontWeight: 900,
							fontSize: "88px",
							color: "#FFFFFF",
							textAlign: "center",
							transform: `translateY(${(1 - s1TitleProgress) * 30}px)`,
							opacity: s1TitleProgress,
							letterSpacing: "-3px",
							lineHeight: 1.05,
							padding: "0 60px",
							textShadow,
						}}
					>
						Ya está aquí.
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "14px",
							transform: `translateY(${(1 - s1SubProgress) * 20}px)`,
							opacity: s1SubProgress,
						}}
					>
						<svg
							width="36"
							height="36"
							viewBox="0 0 24 24"
							fill="#D97706"
						>
							<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
						</svg>
						<span
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontSize: "28px",
								fontWeight: 500,
								color: "#D97706",
								textTransform: "uppercase",
								letterSpacing: 4,
								textShadow: "0 2px 20px rgba(0,0,0,0.8)",
							}}
						>
							Ya en App Store
						</span>
					</div>
				</div>
			)}

			{/* === SCENE 2: Feature words === */}
			{frame >= scene1End && frame < scene2End && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "0px",
					}}
				>
					{features.map((feat, i) => {
						const fStart = featureStart + i * featureInterval;
						const fProgress = spring({
							frame: Math.max(0, frame - fStart),
							fps,
							config: { damping: 12, mass: 0.5 },
						});
						const isLast = i === features.length - 1;
						return (
							<div
								key={feat}
								style={{
									fontFamily: "'Inter', sans-serif",
									fontWeight: isLast ? 900 : 600,
									fontSize: isLast ? "66px" : "54px",
									color: isLast ? "#D97706" : "#FFFFFF",
									textAlign: "center",
									opacity: fProgress,
									transform: `translateY(${(1 - fProgress) * 25}px)`,
									padding: "14px 60px",
									lineHeight: 1.3,
									letterSpacing: isLast ? "-1px" : "-1px",
									textShadow,
								}}
							>
								{feat}
							</div>
						);
					})}
				</div>
			)}

			{/* === SCENE 3: CTA + App Store badge === */}
			{frame >= scene2End && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "44px",
					}}
				>
					{/* App Store badge — rounded rectangle style */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "18px",
							padding: "20px 40px",
							borderRadius: "14px",
							border: "2px solid rgba(217,119,6,0.7)",
							backgroundColor: "rgba(0,0,0,0.6)",
							transform: `scale(${s3BadgeProgress})`,
							opacity: s3BadgeProgress,
							boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
						}}
					>
						{/* Apple icon */}
						<svg
							width="44"
							height="44"
							viewBox="0 0 24 24"
							fill="#FFFFFF"
						>
							<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
						</svg>
						<div style={{ display: "flex", flexDirection: "column" }}>
							<span
								style={{
									fontFamily: "'JetBrains Mono', monospace",
									fontSize: "16px",
									color: "rgba(245,235,216,0.7)",
									letterSpacing: 1,
									textTransform: "uppercase",
								}}
							>
								Disponible en
							</span>
							<span
								style={{
									fontFamily: "'Inter', sans-serif",
									fontWeight: 700,
									fontSize: "38px",
									color: "#FFFFFF",
									letterSpacing: "-1px",
								}}
							>
								App Store
							</span>
						</div>
					</div>

					{/* Logo + name + tagline */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "14px",
							opacity: s3TextProgress,
							transform: `translateY(${(1 - s3TextProgress) * 15}px)`,
						}}
					>
						<Img
							src={staticFile("images/app-logo.png")}
							style={{
								width: 76,
								height: 76,
								borderRadius: 16,
								boxShadow: "0 0 30px rgba(217,119,6,0.3)",
							}}
						/>
						<div
							style={{
								fontFamily: "'Inter', sans-serif",
								fontWeight: 900,
								fontSize: "52px",
								color: "#FFFFFF",
								letterSpacing: "-2px",
								textShadow,
							}}
						>
							WildSpotter
						</div>
						<div
							style={{
								fontFamily: "'Inter', sans-serif",
								fontWeight: 400,
								fontSize: "30px",
								color: "rgba(245,235,216,0.75)",
								textAlign: "center",
								lineHeight: 1.4,
								padding: "0 80px",
								textShadow: "0 2px 16px rgba(0,0,0,0.7)",
							}}
						>
							Encuentra lo que nadie ha compartido.
						</div>
					</div>

					{/* Android teaser */}
					<div
						style={{
							opacity: s3AndroidProgress,
							transform: `translateY(${(1 - s3AndroidProgress) * 10}px)`,
							fontFamily: "'JetBrains Mono', monospace",
							fontSize: "22px",
							color: "rgba(183,160,137,0.6)",
							letterSpacing: 2,
							textTransform: "uppercase",
							textShadow: "0 2px 12px rgba(0,0,0,0.6)",
						}}
					>
						Android muy pronto
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
