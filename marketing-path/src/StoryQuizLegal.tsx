import { AbsoluteFill, Img, staticFile, OffthreadVideo } from "remotion";
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

export type QuizVariant = "QL1" | "QL2" | "QL3" | "QL4";

export type StoryQuizLegalProps = {
	variant: QuizVariant;
};

type QuizData = {
	question: string;
	subtitle: string;
	bgVideo: string;
	bgDim: number;
	tagColor: string;
	tagText: string;
};

const QUIZ_DATA: Record<QuizVariant, QuizData> = {
	QL1: {
		question: "¿Puedes\naparcar aqui?",
		subtitle: "Zona costera mediterranea",
		bgVideo: "videos/Aerial_Spanish_Mediterranean_coast.mp4",
		bgDim: 0.45,
		tagColor: "#EF4444",
		tagText: "NATURA 2000",
	},
	QL2: {
		question: "¿Puedes\naparcar aqui?",
		subtitle: "Claro en bosque de pinos",
		bgVideo: "videos/drone_forest.mp4",
		bgDim: 0.4,
		tagColor: "#4ADE80",
		tagText: "ZONA LIBRE",
	},
	QL3: {
		question: "¿Puedes\naparcar aqui?",
		subtitle: "Playa con acceso por camino de tierra",
		bgVideo: "videos/ai_Spanish_Beach_VW_Van_Golden_Hour.mp4",
		bgDim: 0.4,
		tagColor: "#D97706",
		tagText: "LEY DE COSTAS",
	},
	QL4: {
		question: "¿Sabes que es\nNatura 2000?",
		subtitle: "1.636 zonas protegidas en Espana",
		bgVideo: "videos/drone_mountains.mp4",
		bgDim: 0.45,
		tagColor: "#EF4444",
		tagText: "ZONA PROTEGIDA",
	},
};

export const StoryQuizLegal: React.FC<StoryQuizLegalProps> = ({ variant }) => {
	const d = QUIZ_DATA[variant];

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B", overflow: "hidden" }}>
			{/* Video background */}
			<OffthreadVideo
				src={staticFile(d.bgVideo)}
				muted
				style={{
					position: "absolute",
					width: "112%",
					height: "112%",
					top: "-6%",
					left: "-6%",
					objectFit: "cover",
					opacity: 1 - d.bgDim,
				}}
			/>

			{/* Color tint overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"linear-gradient(180deg, rgba(15,13,11,0.75) 0%, rgba(15,13,11,0.5) 35%, rgba(15,13,11,0.6) 65%, rgba(15,13,11,0.95) 100%)",
					zIndex: 1,
				}}
			/>

			{/* Scan-line texture */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage:
						"repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 8px)",
					pointerEvents: "none",
					zIndex: 2,
				}}
			/>

			{/* Top fade for IG header */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "14%",
					background:
						"linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)",
					zIndex: 3,
				}}
			/>

			{/* Bottom clean zone for quiz sticker */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "36%",
					background:
						"linear-gradient(0deg, rgba(10,8,6,0.97) 0%, rgba(10,8,6,0.92) 40%, rgba(10,8,6,0.55) 72%, transparent 100%)",
					zIndex: 3,
				}}
			/>

			{/* Content — centered */}
			<div
				style={{
					position: "absolute",
					top: "14%",
					bottom: "38%",
					left: 0,
					right: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 4,
					paddingLeft: 52,
					paddingRight: 52,
				}}
			>
				{/* Legal zone tag pill */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						backgroundColor: `${d.tagColor}22`,
						border: `2px solid ${d.tagColor}66`,
						borderRadius: 30,
						paddingLeft: 22,
						paddingRight: 22,
						paddingTop: 10,
						paddingBottom: 10,
						marginBottom: 36,
					}}
				>
					<div
						style={{
							width: 10,
							height: 10,
							borderRadius: 5,
							backgroundColor: d.tagColor,
							boxShadow: `0 0 12px ${d.tagColor}88`,
						}}
					/>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 24,
							fontWeight: 700,
							color: d.tagColor,
							letterSpacing: 3,
						}}
					>
						{d.tagText}
					</div>
				</div>

				{/* Main question */}
				<div
					style={{
						fontFamily: bodyFont,
						fontSize: 86,
						fontWeight: 800,
						color: "#FFFFFF",
						textAlign: "center",
						lineHeight: 1.1,
						letterSpacing: -3,
						textShadow:
							"0 4px 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.6)",
						whiteSpace: "pre-line",
					}}
				>
					{d.question}
				</div>

				{/* Amber divider */}
				<div
					style={{
						width: 56,
						height: 3,
						backgroundColor: "#D97706",
						borderRadius: 2,
						boxShadow: "0 0 16px #D9770688",
						marginTop: 32,
						marginBottom: 24,
					}}
				/>

				{/* Subtitle */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 30,
						fontWeight: 400,
						color: "#A0836C",
						textAlign: "center",
						letterSpacing: 1,
						textShadow: "0 2px 16px rgba(0,0,0,0.8)",
					}}
				>
					{d.subtitle}
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
