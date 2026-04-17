import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "600", "700", "900"],
	subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});

const PHONE_W = 880;
const PHONE_H = 1700;
const PHONE_X = (1080 - PHONE_W) / 2;
const PHONE_Y = 110;
const CORNER = 60;

// Radar pulse ring
const RadarRing: React.FC<{ delay: number; cx: number; cy: number }> = ({
	delay,
	cx,
	cy,
}) => {
	const frame = useCurrentFrame();
	const progress = interpolate(frame - delay, [0, 45], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	if (frame < delay) return null;
	return (
		<circle
			cx={cx}
			cy={cy}
			r={60 + progress * 260}
			fill="none"
			stroke={`rgba(217,119,6,${0.55 * (1 - progress)})`}
			strokeWidth={2.5}
		/>
	);
};

// Score card
const ScoreCard: React.FC<{
	name: string;
	score: number;
	meta: string;
	delay: number;
	index: number;
}> = ({ name, score, meta, delay, index }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const cardIn = spring({
		frame,
		fps,
		delay,
		config: { damping: 18, stiffness: 160 },
	});
	const tx = interpolate(cardIn, [0, 1], [PHONE_W + 100, 0]);
	const opacity = interpolate(cardIn, [0, 0.25], [0, 1], {
		extrapolateRight: "clamp",
	});

	const displayScore = Math.floor(
		interpolate(frame, [delay + 6, delay + 22], [0, score], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);

	const scoreColor =
		score >= 80 ? "#4ADE80" : score >= 60 ? "#D97706" : "#FBBF24";

	return (
		<div
			style={{
				position: "absolute",
				top: 148 + index * 118,
				left: 28,
				right: 28,
				height: 104,
				background: "linear-gradient(135deg, #2D2620 0%, #261F1A 100%)",
				borderRadius: 20,
				border: "1px solid rgba(160,131,108,0.18)",
				display: "flex",
				alignItems: "center",
				padding: "0 22px",
				gap: 18,
				transform: `translateX(${tx}px)`,
				opacity,
				boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
			}}
		>
			{/* Score circle */}
			<div
				style={{
					width: 68,
					height: 68,
					borderRadius: "50%",
					background: `${scoreColor}18`,
					border: `2.5px solid ${scoreColor}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					boxShadow: `0 0 20px ${scoreColor}30`,
				}}
			>
				<span
					style={{
						fontFamily: jetbrainsFont,
						fontSize: 32,
						fontWeight: 700,
						color: scoreColor,
					}}
				>
					{displayScore}
				</span>
			</div>

			{/* Text */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 28,
						fontWeight: 700,
						color: "#F5EFE8",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{name}
				</div>
				<div
					style={{
						fontFamily: jetbrainsFont,
						fontSize: 16,
						color: "#7A6050",
						marginTop: 5,
					}}
				>
					{meta}
				</div>
			</div>

			<div style={{ fontSize: 20, color: "#5C4A3A" }}>›</div>
		</div>
	);
};

export const Scene4Scan: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const phoneIn = spring({
		frame,
		fps,
		delay: 0,
		config: { damping: 22, stiffness: 100 },
	});
	const phoneY = interpolate(phoneIn, [0, 1], [500, 0]);
	const phoneScale = interpolate(phoneIn, [0, 1], [0.9, 1]);

	const scanning = frame > 18 && frame < 65;
	const btnScale =
		frame > 15 && frame < 20
			? 0.92
			: scanning
				? 1 + Math.sin(frame * 0.4) * 0.02
				: 1;

	const resultsIn = spring({
		frame,
		fps,
		delay: 58,
		config: { damping: 200 },
	});
	const sheetY = interpolate(resultsIn, [0, 1], [700, 0]);

	const foundIn = spring({ frame, fps, delay: 53, config: { damping: 200 } });

	// Map scan sweep line
	const scanLineY = scanning
		? interpolate(frame, [18, 65], [200, 680], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			})
		: 0;

	const SCAN_CX = PHONE_W / 2;
	const SCAN_CY = 420;

	// Background video zoom
	const bgZoom = interpolate(frame, [0, 200], [1.0, 1.06], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
			{/* Road trip footage as ambient background */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					transform: `scale(${bgZoom})`,
					transformOrigin: "50% 50%",
				}}
			>
				<Video
					src={staticFile("videos/rv_mountain_road.mp4")}
					muted
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						opacity: 0.15,
					}}
				/>
			</div>

			{/* Heavy dark overlay — phone is the focus */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse 80% 70% at 50% 48%, rgba(15,13,11,0.4) 0%, rgba(15,13,11,0.92) 100%)",
				}}
			/>

			{/* Outer glow behind phone */}
			<div
				style={{
					position: "absolute",
					top: PHONE_Y + 100,
					left: PHONE_X - 40,
					width: PHONE_W + 80,
					height: PHONE_H - 200,
					borderRadius: CORNER + 20,
					background:
						"radial-gradient(ellipse at 50% 40%, rgba(217,119,6,0.1) 0%, transparent 70%)",
					transform: `translateY(${phoneY}px) scale(${phoneScale})`,
				}}
			/>

			{/* Phone frame */}
			<div
				style={{
					position: "absolute",
					top: PHONE_Y,
					left: PHONE_X,
					width: PHONE_W,
					height: PHONE_H,
					borderRadius: CORNER,
					background: "#1A1614",
					border: "2.5px solid rgba(160,131,108,0.25)",
					overflow: "hidden",
					transform: `translateY(${phoneY}px) scale(${phoneScale})`,
					boxShadow:
						"0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
				}}
			>
				{/* Notch */}
				<div
					style={{
						position: "absolute",
						top: 0,
						left: "50%",
						transform: "translateX(-50%)",
						width: 160,
						height: 36,
						background: "#0F0D0B",
						borderBottomLeftRadius: 20,
						borderBottomRightRadius: 20,
						zIndex: 10,
					}}
				/>

				{/* Real CARTO map background */}
				<Img
					src={staticFile("images/map-cabo-de-gata.jpg")}
					style={{
						position: "absolute",
						inset: 0,
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "center 35%",
						opacity: 0.88,
					}}
				/>
				{/* Dark vignette overlay */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(180deg, rgba(20,15,10,0.45) 0%, rgba(20,15,10,0.2) 40%, rgba(20,15,10,0.55) 100%)",
					}}
				/>

				{/* SVG radar overlay */}
				<svg
					style={{ position: "absolute", inset: 0 }}
					width={PHONE_W}
					height={PHONE_H}
				>
					{/* Radar scan sweep line */}
					{scanning && (
						<line
							x1={60}
							y1={scanLineY}
							x2={PHONE_W - 60}
							y2={scanLineY}
							stroke="rgba(217,119,6,0.3)"
							strokeWidth={1.5}
						/>
					)}

					{/* Radar rings */}
					{scanning && (
						<>
							<RadarRing delay={18} cx={SCAN_CX} cy={SCAN_CY} />
							<RadarRing delay={28} cx={SCAN_CX} cy={SCAN_CY} />
							<RadarRing delay={38} cx={SCAN_CX} cy={SCAN_CY} />
							<RadarRing delay={48} cx={SCAN_CX} cy={SCAN_CY} />
						</>
					)}

					{/* Spot markers after scan */}
					{frame > 58 &&
						[
							{ x: 310, y: 260, score: 91, d: 58 },
							{ x: 575, y: 400, score: 84, d: 63 },
							{ x: 440, y: 330, score: 78, d: 68 },
							{ x: 680, y: 285, score: 86, d: 73 },
							{ x: 240, y: 460, score: 72, d: 78 },
						].map((spot, i) => {
							const mIn = spring({
								frame,
								fps,
								delay: spot.d,
								config: { damping: 8, stiffness: 220 },
							});
							const color = spot.score >= 80 ? "#4ADE80" : "#D97706";
							return (
								<g
									key={i}
									transform={`translate(${spot.x}, ${spot.y}) scale(${mIn})`}
								>
									<circle r={16} fill={`${color}25`} />
									<circle r={8} fill={color} />
									<circle
										r={8}
										fill="none"
										stroke={`${color}80`}
										strokeWidth={2}
									>
										<animate
											attributeName="r"
											values="8;20;8"
											dur="2s"
											repeatCount="indefinite"
										/>
										<animate
											attributeName="opacity"
											values="0.8;0;0.8"
											dur="2s"
											repeatCount="indefinite"
										/>
									</circle>
								</g>
							);
						})}
				</svg>

				{/* Search bar */}
				<div
					style={{
						position: "absolute",
						top: 50,
						left: 28,
						right: 28,
						height: 60,
						background: "rgba(42,33,24,0.92)",
						borderRadius: 18,
						border: "1px solid rgba(160,131,108,0.2)",
						display: "flex",
						alignItems: "center",
						padding: "0 22px",
						gap: 12,
						zIndex: 5,
					}}
				>
					<svg width={20} height={20} viewBox="0 0 24 24" fill="none">
						<circle cx="11" cy="11" r="7" stroke="#7A6050" strokeWidth="2" />
						<path
							d="M16.5 16.5L21 21"
							stroke="#7A6050"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
					<span
						style={{
							fontFamily: interFont,
							fontSize: 22,
							color: "#7A6050",
						}}
					>
						Buscar ubicación...
					</span>
				</div>

				{/* Filter chips */}
				<div
					style={{
						position: "absolute",
						top: 122,
						left: 28,
						display: "flex",
						gap: 10,
						zIndex: 5,
					}}
				>
					{["Filtros", "≤8% slope"].map((chip, i) => (
						<div
							key={chip}
							style={{
								background:
									i === 0
										? "rgba(217,119,6,0.15)"
										: "rgba(42,33,24,0.8)",
								border: `1px solid ${i === 0 ? "rgba(217,119,6,0.4)" : "rgba(160,131,108,0.2)"}`,
								borderRadius: 50,
								padding: "8px 18px",
								fontFamily: interFont,
								fontSize: 18,
								fontWeight: 600,
								color: i === 0 ? "#D97706" : "#A0836C",
							}}
						>
							{chip}
						</div>
					))}
				</div>

				{/* Scan button */}
				<div
					style={{
						position: "absolute",
						top: 530,
						left: "50%",
						transform: `translateX(-50%) scale(${btnScale})`,
						background: "linear-gradient(135deg, #D97706, #B45309)",
						borderRadius: 50,
						padding: "20px 48px",
						display: "flex",
						alignItems: "center",
						gap: 14,
						boxShadow: scanning
							? "0 0 50px rgba(217,119,6,0.5), 0 6px 24px rgba(0,0,0,0.5)"
							: "0 6px 24px rgba(0,0,0,0.5)",
						whiteSpace: "nowrap",
						zIndex: 5,
					}}
				>
					<svg width={24} height={24} viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="3" fill="white" />
						<circle
							cx="12"
							cy="12"
							r="7"
							stroke="white"
							strokeWidth="1.5"
							strokeOpacity="0.6"
						/>
						<circle
							cx="12"
							cy="12"
							r="11"
							stroke="white"
							strokeWidth="1"
							strokeOpacity="0.3"
						/>
					</svg>
					<span
						style={{
							fontFamily: interFont,
							fontSize: 26,
							fontWeight: 700,
							color: "#FFFFFF",
						}}
					>
						{scanning ? "Escaneando..." : "Escanear zona"}
					</span>
				</div>

				{/* "X spots found" label */}
				<div
					style={{
						position: "absolute",
						top: 618,
						left: 0,
						right: 0,
						textAlign: "center",
						fontFamily: jetbrainsFont,
						fontSize: 22,
						fontWeight: 700,
						color: "#4ADE80",
						letterSpacing: 1,
						opacity: foundIn,
						zIndex: 5,
					}}
				>
					● 5 spots encontrados
				</div>

				{/* Bottom sheet */}
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: 580,
						background:
							"linear-gradient(180deg, #1E1A16 0%, #1A1614 100%)",
						borderTopLeftRadius: 32,
						borderTopRightRadius: 32,
						transform: `translateY(${sheetY}px)`,
						borderTop: "1px solid rgba(160,131,108,0.18)",
						zIndex: 6,
					}}
				>
					{/* Handle */}
					<div
						style={{
							width: 52,
							height: 5,
							borderRadius: 3,
							background: "#4A3C2E",
							margin: "14px auto 0",
						}}
					/>

					{/* Section title */}
					<div
						style={{
							padding: "20px 28px 6px",
							fontFamily: interFont,
							fontSize: 28,
							fontWeight: 700,
							color: "#F5EFE8",
							letterSpacing: -0.3,
						}}
					>
						Resultados del escaneo
					</div>

					<ScoreCard
						name="Cala del Pino"
						score={91}
						meta="dead_end · dirt · 3% slope"
						delay={65}
						index={0}
					/>
					<ScoreCard
						name="Mirador del Águila"
						score={84}
						meta="viewpoint · gravel · 5% slope"
						delay={72}
						index={1}
					/>
					<ScoreCard
						name="Camino de la Fuente"
						score={78}
						meta="clearing · grass · 2% slope"
						delay={79}
						index={2}
					/>
				</div>

				{/* Tab bar */}
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: 86,
						background: "#1A1614",
						borderTop: "1px solid rgba(160,131,108,0.12)",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-around",
						zIndex: 7,
						opacity: interpolate(resultsIn, [0, 1], [0, 1]),
					}}
				>
					{[
						{ label: "MAPA", active: true },
						{ label: "SPOTS", active: false },
						{ label: "GUIA", active: false },
						{ label: "CONFIG", active: false },
					].map((tab) => (
						<div
							key={tab.label}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 5,
							}}
						>
							<div
								style={{
									width: 28,
									height: 28,
									borderRadius: 8,
									background: tab.active ? "#D97706" : "transparent",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							/>
							<span
								style={{
									fontFamily: jetbrainsFont,
									fontSize: 13,
									fontWeight: 700,
									color: tab.active ? "#D97706" : "#5C4A3A",
									letterSpacing: 2,
								}}
							>
								{tab.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</AbsoluteFill>
	);
};
