import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

export const DATO_HERO_FRAMES = 450;

type DatoHeroProps = {
	variant: "H1" | "H2" | "H3";
	musicTrack?: string;
};

export const DatoHero: React.FC<DatoHeroProps> = ({
	variant,
	musicTrack = "sci-fi-score",
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const counterStart = 45;
	const counterEnd = 150;

	let targetNumber = 0;
	let text1 = "";
	
	if (variant === "H1") {
		targetNumber = 83006;
		text1 = "spots analizados en España";
	} else if (variant === "H2") {
		targetNumber = 393;
		text1 = "spots con score > 70 en toda España";
	} else {
		targetNumber = 7;
		text1 = "capas de análisis por spot";
	}

	const slogan = "Los mejores spots no los comparte nadie. Los calculamos.";

	const currentNumber = interpolate(
		frame,
		[counterStart, counterEnd],
		[0, targetNumber],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" }
	);

	const displayedNumber = Math.floor(currentNumber).toLocaleString("es-ES");

	const t1Start = 150;
	const t2Start = 240;
	const sloganStart = 330;

	const heroScale = interpolate(
		frame,
		[t2Start, t2Start + 20],
		[1, 0.75],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" }
	);
	
	const heroY = interpolate(
		frame,
		[t2Start, t2Start + 20],
		[0, -100],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" }
	);

	const t1Opacity = interpolate(
		frame,
		[t1Start, t1Start + 15],
		[0, 1],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" }
	);

	const t2Opacity = interpolate(
		frame,
		[t2Start, t2Start + 15],
		[0, 1],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" }
	);

	const sloganOpacity = interpolate(
		frame,
		[sloganStart, sloganStart + 15],
		[0, 1],
		{ extrapolateRight: "clamp", extrapolateLeft: "clamp" }
	);

	const renderText2 = () => {
		if (variant === "H1") {
			return (
				<div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
					<span>
						<span style={{ color: "#4ADE80", fontWeight: 600 }}>393</span> con score {">"} 70
					</span>
					<span>
						<span style={{ color: "#4ADE80", fontWeight: 600 }}>41</span> con score {">"} 80
					</span>
				</div>
			);
		} else if (variant === "H2") {
			return (
				<span>
					De 83.006 candidatos, solo <span style={{ color: "#4ADE80", fontWeight: 600 }}>393</span> pasan el filtro.
				</span>
			);
		} else {
			return (
				<span>
					Radar. Terreno. Satélite. Legal. Contexto. Uso del suelo. <span style={{ color: "#4ADE80", fontWeight: 600 }}>Score</span>.
				</span>
			);
		}
	};

	return (
		<AbsoluteFill style={{ backgroundColor: "#000000", color: "#FFFFFF" }}>
			
			{musicTrack && (
				<Audio 
					src={staticFile(`audio/music/${musicTrack}.mp3`)} 
					volume={(f) => interpolate(f, [400, 450], [0.3, 0], { extrapolateRight: "clamp" })}
				/>
			)}
			
			<Sequence from={counterEnd}>
				<Audio src={staticFile("audio/score-reveal.mp3")} volume={0.8} />
			</Sequence>

			{frame >= counterStart && (
				<div
					style={{
						position: "absolute",
						width: "100%",
						top: "35%",
						transform: `translateY(${heroY}px) scale(${heroScale})`,
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<div
						style={{
							fontFamily: "'JetBrains Mono', monospace",
							fontWeight: 700,
							fontSize: "160px",
							lineHeight: 1,
							color: "#FFFFFF",
						}}
					>
						{displayedNumber}
					</div>

					<div
						style={{
							marginTop: "40px",
							opacity: t1Opacity,
							fontFamily: "'Inter', sans-serif",
							fontWeight: 400,
							fontSize: "48px",
							color: "#666666",
						}}
					>
						{text1}
					</div>

					{frame >= t2Start && (
						<div
							style={{
								marginTop: "50px",
								opacity: t2Opacity,
								fontFamily: "'Inter', sans-serif",
								fontWeight: 400,
								fontSize: "48px",
								color: "#666666",
								lineHeight: 1.4,
								maxWidth: "800px",
								textAlign: "center",
							}}
						>
							{renderText2()}
						</div>
					)}
				</div>
			)}
			
			{frame >= sloganStart && (
				<div
					style={{
						position: "absolute",
						bottom: "250px",
						left: 0,
						width: "100%",
						opacity: sloganOpacity,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "50px",
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
							letterSpacing: "-2px",
						}}
					>
						{slogan}
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
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
	);
};
