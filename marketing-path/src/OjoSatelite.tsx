import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

export const OJO_SATELITE_FRAMES = 660;

type OjoSateliteProps = {
	variant: "I1" | "I2";
	musicTrack?: string;
};

export const OjoSatelite: React.FC<OjoSateliteProps> = ({
	variant,
	musicTrack = "sci-fi-score",
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	let spotName = "";
	let pnoaImg = "";
	let cartoImg = "";
	let finalScore = 0;
	let subscores: Array<{ label: string; value: string }> = [];

	if (variant === "I1") {
		spotName = "Cala del Peral";
		pnoaImg = "images/spots/4128183590_pnoa.jpg";
		cartoImg = "images/maps/map-san-miguel.jpg"; // We keep placeholder map
		finalScore = 61;
		subscores = [
			{ label: "surface_quality:", value: "7/10" },
			{ label: "vehicle_access:", value: "6/10" },
			{ label: "open_space:", value: "8/10" },
			{ label: "van_presence:", value: "1/10" },
			{ label: "obstruction_absence:", value: "7/10" },
		];
	} else {
		spotName = "Mirador de Juan León";
		pnoaImg = "images/spots/1493201126_pnoa.jpg";
		cartoImg = "images/maps/map-amadorio.jpg"; // We keep placeholder map
		finalScore = 75;
		subscores = [
			{ label: "surface_quality:", value: "7/10" },
			{ label: "vehicle_access:", value: "6/10" },
			{ label: "open_space:", value: "8/10" },
			{ label: "van_presence:", value: "0/10" },
			{ label: "obstruction_absence:", value: "6/10" },
		];
	}

	const introTextOpacity = interpolate(frame, [90, 105], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	const introTextFadeOut = interpolate(frame, [435, 450], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	
	const scanProgress = interpolate(frame, [90, 210], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	const scanOpacity = interpolate(frame, [90, 100, 200, 210], [0, 0.6, 0.6, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

	const subscoreCompress = spring({ frame: frame - 330, fps, config: { damping: 14 } });
	const subscoreOpacity = interpolate(frame, [435, 450], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

	const finalScoreScale = spring({ frame: frame - 330, fps, config: { damping: 12 } });
	const finalScoreOpacity = interpolate(frame, [330, 345], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	const finalScoreFadeOut = interpolate(frame, [435, 450], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

	const mapRevealProgress = spring({ frame: frame - 450, fps, config: { damping: 14 } });
	const baseKenBurns = interpolate(frame, [0, 450], [1, 1.1], { extrapolateRight: "clamp" });
	const currentPnoaScale = frame > 450 ? interpolate(mapRevealProgress, [0, 1], [1.1, 0.4]) : baseKenBurns;
	const pnoaY = interpolate(mapRevealProgress, [0, 1], [0, -150]);
	const pnoaBorderRadius = interpolate(mapRevealProgress, [0, 1], [0, 32]);

	const mapOpacity = interpolate(mapRevealProgress, [0, 1], [0, 1]);
	const mapScale = interpolate(mapRevealProgress, [0, 1], [1.1, 1]);

	const pinOpacity = interpolate(frame, [480, 495], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

	const ctaOpacity = interpolate(frame, [540, 555], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
	const mapFadeOut = interpolate(frame, [540, 560], [1, 0.4], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

	return (
		<AbsoluteFill style={{ backgroundColor: "#0A0F1C" }}>
			{musicTrack && (
				<Audio 
					src={staticFile(`audio/music/${musicTrack}.mp3`)} 
					volume={(f) => interpolate(f, [610, 660], [0.5, 0], { extrapolateRight: "clamp" })}
				/>
			)}

			<AbsoluteFill style={{ overflow: "hidden" }}>
				{/* CARTO Map Background */}
				<AbsoluteFill style={{ opacity: mapOpacity, transform: `scale(${mapScale})` }}>
					<Img 
						src={staticFile(cartoImg)} 
						style={{ width: "100%", height: "100%", objectFit: "cover", opacity: mapFadeOut }}
						onError={(e) => {
							(e.target as HTMLImageElement).style.visibility = "hidden";
						}}
					/>
				</AbsoluteFill>

				{/* PNOA Image */}
				<AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
					<div
						style={{
							width: "100%",
							height: "100%",
							transform: `translateY(${pnoaY}px) scale(${currentPnoaScale})`,
							borderRadius: `${pnoaBorderRadius}px`,
							overflow: "hidden",
							boxShadow: frame > 450 ? "0 20px 50px rgba(0,0,0,0.8)" : "none",
						}}
					>
						<Img 
							src={staticFile(pnoaImg)} 
							style={{ width: "100%", height: "100%", objectFit: "cover" }} 
							onError={(e) => {
								(e.target as HTMLImageElement).style.visibility = "hidden";
							}}
						/>
						
						{/* Scan Line */}
						<div
							style={{
								position: "absolute",
								left: 0,
								top: `${scanProgress}%`,
								width: "100%",
								height: "3px",
								backgroundColor: "#4ADE80",
								boxShadow: "0 0 20px #4ADE80",
								opacity: scanOpacity,
							}}
						/>
					</div>
				</AbsoluteFill>

				{/* UI OVERLAYS - Fade out completely at 450 */}
				<AbsoluteFill style={{ opacity: introTextFadeOut }}>
					
					{/* Top text */}
					<div
						style={{
							position: "absolute",
							top: "200px",
							width: "100%",
							textAlign: "center",
							opacity: introTextOpacity,
							fontFamily: "'Inter', sans-serif",
							fontWeight: 600,
							fontSize: "48px",
							color: "#FFFFFF",
							textShadow: "0 4px 20px rgba(0,0,0,0.8)",
						}}
					>
						Esto es lo que ve nuestra IA.
					</div>

					{/* Terminal Subscores */}
					<div
						style={{
							position: "absolute",
							left: "60px",
							top: "400px",
							display: "flex",
							flexDirection: "column",
							gap: `${interpolate(subscoreCompress, [0, 1], [30, 10])}px`,
							opacity: subscoreOpacity,
						}}
					>
						{subscores.map((score, index) => {
							const appearFrame = 210 + index * 20;
							const opacity = spring({ frame: frame - appearFrame, fps, config: { damping: 14 } });
							return (
								<div
									key={score.label}
									style={{
										opacity,
										fontFamily: "'JetBrains Mono', monospace",
										fontSize: "32px",
										color: "#4ADE80",
										backgroundColor: "rgba(0,0,0,0.7)",
										padding: "16px 24px",
										borderRadius: "8px",
										transform: `scale(${interpolate(subscoreCompress, [0, 1], [1, 0.8])})`,
										transformOrigin: "left center",
									}}
								>
									{score.label} <span style={{ color: "#FFFFFF" }}>{score.value}</span>
								</div>
							);
						})}
					</div>

					{/* Final AI Score */}
					<div
						style={{
							position: "absolute",
							right: "80px",
							top: "400px",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							opacity: finalScoreOpacity,
							transform: `scale(${finalScoreScale})`,
						}}
					>
						<div
							style={{
								width: "300px",
								height: "300px",
								borderRadius: "150px",
								border: "6px solid #22D3EE",
								backgroundColor: "rgba(10, 15, 28, 0.8)",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								color: "#FFFFFF",
								fontFamily: "'Inter', sans-serif",
							}}
						>
							<div style={{ fontSize: "28px", color: "#A0AABF", marginBottom: "10px" }}>AI Score</div>
							<div style={{ fontSize: "72px", fontWeight: 700, lineHeight: 1 }}>{finalScore}</div>
							<div style={{ fontSize: "36px", color: "#A0AABF" }}>/100</div>
						</div>
						
						<div
							style={{
								marginTop: "30px",
								fontFamily: "'JetBrains Mono', monospace",
								fontSize: "20px",
								color: "#A0AABF",
								backgroundColor: "rgba(0,0,0,0.8)",
								padding: "16px 24px",
								borderRadius: "8px",
								textAlign: "center",
								lineHeight: 1.4,
							}}
						>
							Modelo: Claude Haiku 4.5<br />
							Fuente: IGN PNOA 25cm/px
						</div>
					</div>
				</AbsoluteFill>

				{/* Map Pin */}
				{frame >= 450 && (
					<div
						style={{
							position: "absolute",
							left: "50%",
							top: "55%",
							transform: "translate(-50%, -50%)",
							opacity: pinOpacity,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "16px",
						}}
					>
						<div
							style={{
								width: "48px",
								height: "48px",
								backgroundColor: "#D97706",
								borderRadius: "50% 50% 50% 0",
								transform: "rotate(-45deg)",
								boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
							}}
						/>
						<div
							style={{
								fontFamily: "'Inter', sans-serif",
								fontWeight: 700,
								fontSize: "42px",
								color: "#FFFFFF",
								backgroundColor: "rgba(0,0,0,0.8)",
								padding: "16px 32px",
								borderRadius: "24px",
								textShadow: "0 2px 10px rgba(0,0,0,0.5)",
							}}
						>
							{spotName}
						</div>
					</div>
				)}

				{/* CTA */}
				{frame >= 540 && (
					<div
						style={{
							position: "absolute",
							bottom: "200px",
							left: 0,
							width: "100%",
							opacity: ctaOpacity,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "40px",
						}}
					>
						<div
							style={{
								fontFamily: "'Inter', sans-serif",
								fontWeight: 700,
								fontSize: "52px",
								color: "#FFFFFF",
								textAlign: "center",
								padding: "0 60px",
								lineHeight: 1.2,
								textShadow: "0 4px 20px rgba(0,0,0,0.8)",
							}}
						>
							Cada spot analizado por IA.<br />Ninguno por opinión.
						</div>

						<div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "20px 40px", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: "24px" }}>
							<Img 
								src={staticFile("images/app-logo.png")} 
								style={{ width: "80px", height: "80px", borderRadius: "16px" }} 
							/>
							<div
								style={{
									fontFamily: "'JetBrains Mono', monospace",
									fontWeight: 600,
									fontSize: "36px",
									color: "#FFFFFF",
								}}
							>
								wildspotter.app
							</div>
						</div>
					</div>
				)}

			</AbsoluteFill>
		</AbsoluteFill>
	);
};
