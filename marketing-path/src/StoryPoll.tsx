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

export type PollVariant = "PL1" | "PL2" | "PL3" | "PL4" | "PL5" | "PL6" | "PL7";

export type StoryPollProps = {
	variant: PollVariant;
};

type PollData = {
	question: string;
	bgVideo: string;
	bgDim: number;
	tintColor: string;
	accentColor: string;
};

const POLL_DATA: Record<PollVariant, PollData> = {
	PL1: {
		question: "¿Costa o montaña\neste finde?",
		bgVideo: "videos/Aerial_Spanish_Mediterranean_coast.mp4",
		bgDim: 0.55,
		tintColor: "#0A1A28",
		accentColor: "#22D3EE",
	},
	PL2: {
		question: "¿Bosque\no playa?",
		bgVideo: "videos/drone_forest.mp4",
		bgDim: 0.5,
		tintColor: "#0A1A10",
		accentColor: "#4ADE80",
	},
	PL3: {
		question: "¿Meseta\no costa?",
		bgVideo: "videos/ai_Spanish_Countryside_Van_Video.mp4",
		bgDim: 0.5,
		tintColor: "#1A1208",
		accentColor: "#D97706",
	},
	PL4: {
		question: "¿Alguna vez\nte han multado?",
		bgVideo: "videos/police_car.mp4",
		bgDim: 0.6,
		tintColor: "#1A0A0A",
		accentColor: "#EF4444",
	},
	PL5: {
		question: "¿Sola o en\ncomunidad?",
		bgVideo: "videos/rvs_parked_outdoors.mp4",
		bgDim: 0.5,
		tintColor: "#0F0D0B",
		accentColor: "#D97706",
	},
	PL6: {
		question: "¿Furgo o\nautocaravana?",
		bgVideo: "videos/rv_mountain_road.mp4",
		bgDim: 0.5,
		tintColor: "#0F0D0B",
		accentColor: "#22D3EE",
	},
	PL7: {
		question: "Este puente de mayo...\n¿A dónde os lleva\nla furgo?",
		bgVideo: "videos/Aerial_Spanish_Mediterranean_coast.mp4",
		bgDim: 0.5,
		tintColor: "#0A1A28",
		accentColor: "#D97706",
	},
};

export const StoryPoll: React.FC<StoryPollProps> = ({ variant }) => {
	const d = POLL_DATA[variant];

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B", overflow: "hidden" }}>
			{/* Video background */}
			<OffthreadVideo
				src={staticFile(d.bgVideo)}
				muted
				style={{
					position: "absolute",
					width: "110%",
					height: "110%",
					top: "-5%",
					left: "-5%",
					objectFit: "cover",
					opacity: 1 - d.bgDim,
				}}
			/>

			{/* Dark overlay for readability */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `linear-gradient(180deg, ${d.tintColor}CC 0%, ${d.tintColor}88 40%, ${d.tintColor}DD 100%)`,
					zIndex: 1,
				}}
			/>

			{/* Scan-line texture */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage:
						"repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 8px)",
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
						"linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
					zIndex: 3,
				}}
			/>

			{/* Bottom clean zone for poll sticker */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "38%",
					background:
						"linear-gradient(0deg, rgba(10,8,6,0.97) 0%, rgba(10,8,6,0.93) 45%, rgba(10,8,6,0.6) 75%, transparent 100%)",
					zIndex: 3,
				}}
			/>

			{/* Question text — centered in upper-middle area */}
			<div
				style={{
					position: "absolute",
					top: "18%",
					bottom: "40%",
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
				{/* Accent bar */}
				<div
					style={{
						width: 48,
						height: 4,
						backgroundColor: d.accentColor,
						borderRadius: 2,
						boxShadow: `0 0 20px ${d.accentColor}66`,
						marginBottom: 36,
					}}
				/>

				<div
					style={{
						fontFamily: bodyFont,
						fontSize: 82,
						fontWeight: 800,
						color: "#FFFFFF",
						textAlign: "center",
						lineHeight: 1.15,
						letterSpacing: -2,
						textShadow:
							"0 4px 30px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.5)",
						whiteSpace: "pre-line",
					}}
				>
					{d.question}
				</div>

				{/* Small WildSpotter label below */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 24,
						fontWeight: 400,
						color: "rgba(255,255,255,0.3)",
						letterSpacing: 4,
						marginTop: 32,
					}}
				>
					WILDSPOTTER
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
