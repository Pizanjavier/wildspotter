import { AbsoluteFill, Img, staticFile, OffthreadVideo } from "remotion";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: monoFont } = loadJetBrains("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});
const { fontFamily: bodyFont } = loadInter("normal", {
	weights: ["400", "700", "800"],
	subsets: ["latin"],
});

export const StoryPuenteUrgencia: React.FC = () => {
	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B", overflow: "hidden" }}>

			{/* ── Video background: night van stars timelapse ── */}
			<OffthreadVideo
				src={staticFile("videos/ai_Stars_Timelapse_Van_Night.mp4")}
				muted
				style={{
					position: "absolute",
					width: "110%",
					height: "110%",
					top: "-5%",
					left: "-5%",
					objectFit: "cover",
					opacity: 0.4, // dim 60%
				}}
			/>

			{/* ── Dark tint overlay ── */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"linear-gradient(180deg, rgba(10,8,6,0.72) 0%, rgba(10,8,6,0.45) 40%, rgba(10,8,6,0.72) 100%)",
					zIndex: 1,
				}}
			/>

			{/* ── Scan-line texture ── */}
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

			{/* ── Top fade for IG header chrome ── */}
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

			{/* ── Bottom clean zone: 38% height for IG link sticker ── */}
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

			{/* ── Main content — centered in upper-middle ── */}
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
				{/* Amber accent bar */}
				<div
					style={{
						width: 48,
						height: 4,
						backgroundColor: "#D97706",
						borderRadius: 2,
						boxShadow: "0 0 20px rgba(217,119,6,0.5)",
						marginBottom: 32,
					}}
				/>

				{/* Big number */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 120,
						fontWeight: 700,
						color: "#D97706",
						letterSpacing: -3,
						lineHeight: 1.0,
						textShadow:
							"0 0 60px rgba(217,119,6,0.35), 0 4px 30px rgba(0,0,0,0.9)",
					}}
				>
					83.006
				</div>

				{/* "spots analizados" label */}
				<div
					style={{
						fontFamily: bodyFont,
						fontSize: 56,
						fontWeight: 700,
						color: "#FFFFFF",
						letterSpacing: -1,
						marginTop: 8,
						textShadow: "0 3px 20px rgba(0,0,0,0.8)",
					}}
				>
					spots analizados
				</div>

				{/* Divider */}
				<div
					style={{
						width: 56,
						height: 2,
						backgroundColor: "rgba(217,119,6,0.35)",
						borderRadius: 1,
						margin: "36px auto",
					}}
				/>

				{/* Secondary message */}
				<div
					style={{
						fontFamily: bodyFont,
						fontSize: 48,
						fontWeight: 700,
						color: "rgba(255,255,255,0.72)",
						textAlign: "center",
						lineHeight: 1.35,
						letterSpacing: -1,
						textShadow: "0 3px 16px rgba(0,0,0,0.75)",
						whiteSpace: "pre-line",
					}}
				>
					{"Este puente no dependas\nde los mismos sitios."}
				</div>

				{/* Faint WILDSPOTTER label */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 22,
						fontWeight: 400,
						color: "rgba(255,255,255,0.25)",
						letterSpacing: 5,
						marginTop: 36,
					}}
				>
					WILDSPOTTER
				</div>
			</div>

			{/* ── Logo watermark top-right ── */}
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
