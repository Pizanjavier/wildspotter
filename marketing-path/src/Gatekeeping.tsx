import { AbsoluteFill, Img, Sequence, Video, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

export const GATEKEEPING_FRAMES = 660; // 22s @ 30fps

type GatekeepingProps = {
	variant: "K1" | "K2";
};

export const Gatekeeping: React.FC<GatekeepingProps> = ({ variant }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const textStyle: React.CSSProperties = {
		fontFamily: "'Inter', sans-serif",
		fontWeight: 900,
		fontSize: "60px",
		color: "#F8FAFC",
		textAlign: "center",
		padding: "0 40px",
		textShadow: "0px 0px 15px rgba(0,0,0,0.9), 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000", 
		lineHeight: 1.25,
		textTransform: "uppercase",
	};

	const introText = variant === "K1" 
		? "Me acusan de\ngatekeeping." 
		: "¿Compartir spots\nes ayudar\no destruir?";

	const video1Src = variant === "K1" 
		? "videos/ai_Spanish_Countryside_Van_Video.mp4" 
		: "videos/ai_Spanish_Beach_VW_Van_Golden_Hour.mp4";

	const video2Src = variant === "K1" 
		? "videos/crowded_parking_aerial.mp4" 
		: "videos/ai_Van_trying_to_park_full_parking.mp4";

	// Smooth Crossfades between identical AbsoluteFill stacking
	const fade1to2 = interpolate(frame, [120, 150], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	const fadeIn2 = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	const fade2to3 = interpolate(frame, [240, 270], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	const fadeIn3 = interpolate(frame, [240, 270], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	
	// Gradual darkening 
	const darkenBg = interpolate(frame, [390, 420], [0, 0.7], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

	return (
		<AbsoluteFill style={{ backgroundColor: "#000" }}>

			{/* Video 1 */}
			<AbsoluteFill style={{ opacity: fade1to2 }}>
				<Video 
					src={staticFile(video1Src)} 
					style={{ width: "100%", height: "100%", objectFit: "cover" }} 
					muted
				/>
			</AbsoluteFill>

			{/* Video 2 */}
			<Sequence from={120}>
				<AbsoluteFill style={{ opacity: fadeIn2 > 0 && fade2to3 > 0 ? Math.min(fadeIn2, fade2to3) : 0 }}>
					<Video 
						src={staticFile(video2Src)} 
						style={{ width: "100%", height: "100%", objectFit: "cover" }} 
						muted
					/>
				</AbsoluteFill>
			</Sequence>

			{/* Video 3 - plays till the end serving as continuity */}
			<Sequence from={240}>
				<AbsoluteFill style={{ opacity: fadeIn3 }}>
					<Video 
						src={staticFile("videos/drone_forest.mp4")} 
						style={{ width: "100%", height: "100%", objectFit: "cover" }} 
						muted
					/>
					<AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,1)", opacity: darkenBg }} />
				</AbsoluteFill>
			</Sequence>

			{/* --- TEXT LAYERS --- */}

			{/* Scene 1 Text (0-135f) */}
			{frame < 135 && (
				<AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: interpolate(frame, [115, 135], [1, 0]) }}>
					<div style={{...textStyle, whiteSpace: "pre-line"}}>{introText}</div>
				</AbsoluteFill>
			)}

			{/* Scene 2 Text (135-255f) */}
			{frame >= 135 && frame < 255 && (
				<AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: interpolate(frame, [135, 150, 240, 255], [0, 1, 1, 0]) }}>
					<div style={textStyle}>Este spot tenía 3 reviews hace un año.<br/>Hoy tiene 200.</div>
				</AbsoluteFill>
			)}

			{/* Scene 3 Text (255-390f) */}
			{frame >= 255 && frame < 390 && (
				<AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: interpolate(frame, [255, 270, 375, 390], [0, 1, 1, 0]) }}>
					<div style={textStyle}>Compartir un spot es<br/>firmar su sentencia.</div>
				</AbsoluteFill>
			)}

			{/* Scene 4 Text (390-540f) - WildSpotter Core Pitch */}
			{frame >= 390 && frame < 540 && (
				<AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px", opacity: interpolate(frame, [390, 420, 520, 540], [0, 1, 1, 0]) }}>
					<div
						style={{
							marginBottom: "60px",
							display: "flex",
							alignItems: "center",
							gap: "24px"
						}}
					>
						<Img src={staticFile("images/app-logo.png")} style={{ width: "100px", height: "100px", borderRadius: "20px" }} />
						<div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "60px", color: "#FFF" }}>
							WildSpotter
						</div>
					</div>

					<div style={{...textStyle, fontSize: "40px", textTransform: "none", textShadow: "none"}}>
						WildSpotter no comparte spots.<br/>Cada usuario descubre los suyos.
					</div>
				</AbsoluteFill>
			)}

			{/* Scene 5 Text (540-660f) - Delayed CTA */}
			{frame >= 540 && (
				<AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
					
					{/* Frame 560 provides the 1-2s black breather before launching */}
					{frame >= 560 && (
						<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "40px", opacity: interpolate(frame, [560, 580], [0, 1]) }}>
							<div style={{...textStyle, color: "#FBBF24", textShadow: "none", textTransform: "none", fontSize: "48px"}}>
								¿Gatekeeping o<br/>sentido común?
							</div>

							<div
								style={{
									fontFamily: "'Inter', sans-serif",
									fontWeight: 700,
									fontSize: "36px",
									color: "#E2E8F0",
								}}
							>
								wildspotter.app
							</div>
						</div>
					)}
				</AbsoluteFill>
			)}

		</AbsoluteFill>
	);
};
