import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: monoFont } = loadJetBrains("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});
const { fontFamily: bodyFont } = loadInter("normal", {
	weights: ["700", "800"],
	subsets: ["latin"],
});

export type CountdownVariant = "CD1" | "CD2";

export type StoryCountdownProps = {
	variant: CountdownVariant;
};

type CountdownData = {
	topLabel: string;
	mainText: string;
	subText: string;
	accentColor: string;
	glowColor: string;
};

const COUNTDOWN_DATA: Record<CountdownVariant, CountdownData> = {
	CD1: {
		topLabel: "MAÑANA",
		mainText: "Nuevo dato\ndel radar",
		subText: "Un spot que nadie ha visto",
		accentColor: "#D97706",
		glowColor: "#2E1E08",
	},
	CD2: {
		topLabel: "MAÑANA",
		mainText: "Carousel\neducativo",
		subText: "Datos que vas a querer guardar",
		accentColor: "#22D3EE",
		glowColor: "#0D3350",
	},
};

const RadarRings: React.FC<{ color: string }> = ({ color }) => (
	<>
		{[220, 340, 480].map((size) => (
			<div
				key={size}
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					width: size,
					height: size,
					borderRadius: "50%",
					border: `1px solid ${color}18`,
					transform: "translate(-50%, -50%)",
					pointerEvents: "none",
				}}
			/>
		))}
	</>
);

export const StoryCountdown: React.FC<StoryCountdownProps> = ({ variant }) => {
	const d = COUNTDOWN_DATA[variant];

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B", overflow: "hidden" }}>
			{/* Radial glow background */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${d.glowColor} 0%, #0F0D0B 65%)`,
					zIndex: 0,
				}}
			/>

			{/* Radar rings centered */}
			<div
				style={{
					position: "absolute",
					top: "15%",
					bottom: "35%",
					left: 0,
					right: 0,
					zIndex: 1,
				}}
			>
				<RadarRings color={d.accentColor} />
			</div>

			{/* Scan lines */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage:
						"repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 8px)",
					pointerEvents: "none",
					zIndex: 2,
				}}
			/>

			{/* Dot grid */}
			<div
				style={{
					position: "absolute",
					top: "10%",
					bottom: "35%",
					left: 0,
					right: 0,
					backgroundImage:
						"radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
					backgroundSize: "42px 42px",
					pointerEvents: "none",
					zIndex: 2,
				}}
			/>

			{/* Top fade */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "14%",
					background:
						"linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
					zIndex: 3,
				}}
			/>

			{/* Bottom clean zone for countdown sticker */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "40%",
					background:
						"linear-gradient(0deg, rgba(10,8,6,0.98) 0%, rgba(10,8,6,0.95) 50%, rgba(10,8,6,0.65) 78%, transparent 100%)",
					zIndex: 3,
				}}
			/>

			{/* Content */}
			<div
				style={{
					position: "absolute",
					top: "16%",
					bottom: "42%",
					left: 0,
					right: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 4,
					paddingLeft: 56,
					paddingRight: 56,
				}}
			>
				{/* Top label pill */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 28,
						fontWeight: 700,
						color: d.accentColor,
						letterSpacing: 8,
						textTransform: "uppercase",
						backgroundColor: `${d.accentColor}15`,
						border: `1.5px solid ${d.accentColor}44`,
						borderRadius: 24,
						paddingLeft: 28,
						paddingRight: 28,
						paddingTop: 10,
						paddingBottom: 10,
						marginBottom: 44,
					}}
				>
					{d.topLabel}
				</div>

				{/* Main text */}
				<div
					style={{
						fontFamily: bodyFont,
						fontSize: 78,
						fontWeight: 800,
						color: "#FFFFFF",
						textAlign: "center",
						lineHeight: 1.12,
						letterSpacing: -2,
						whiteSpace: "pre-line",
						textShadow: "0 4px 30px rgba(0,0,0,0.9)",
					}}
				>
					{d.mainText}
				</div>

				{/* Accent bar */}
				<div
					style={{
						width: 48,
						height: 3,
						backgroundColor: d.accentColor,
						borderRadius: 2,
						boxShadow: `0 0 20px ${d.accentColor}66`,
						marginTop: 32,
						marginBottom: 28,
					}}
				/>

				{/* Subtext */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 28,
						fontWeight: 400,
						color: "#A0836C",
						textAlign: "center",
						letterSpacing: 1,
					}}
				>
					{d.subText}
				</div>
			</div>

			{/* Logo watermark */}
			<div
				style={{
					position: "absolute",
					top: 52,
					right: 44,
					zIndex: 5,
					opacity: 0.5,
				}}
			>
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 56,
						height: 56,
						borderRadius: 12,
						boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};
