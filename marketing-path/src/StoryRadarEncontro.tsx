import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: monoFont } = loadJetBrains("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});

// ── Variant definitions ────────────────────────────────────────────────────────

export type StoryVariant = "M1" | "M2" | "M3";

export type StoryRadarEncontroProps = {
	variant: StoryVariant;
};

type StoryData = {
	score: number;
	scoreColor: string;
	/** Short label shown above the score */
	biomeLabel: string;
	/** Three data lines shown below the score */
	line1: string;
	line2: string;
	line3: string;
	/** Base bg color for radial gradient (dark tint matching the biome) */
	tintColor: string;
	/** Secondary tint for the radial gradient inner glow */
	glowColor: string;
};

const STORY_DATA: Record<StoryVariant, StoryData> = {
	M1: {
		score: 91,
		scoreColor: "#4ADE80",
		biomeLabel: "COSTA · ZONA VIRGEN",
		line1: "A 300m de una playa sin nombre",
		line2: "0 edificios en 500m  ·  Pendiente: 2.3%",
		line3: "Zona no protegida",
		tintColor: "#0A1A28",
		glowColor: "#0D3350",
	},
	M2: {
		score: 84,
		scoreColor: "#4ADE80",
		biomeLabel: "MONTAÑA · BOSQUE",
		line1: "Final de un camino de tierra",
		line2: "Bosque de pinos  ·  850m de altitud",
		line3: "Pendiente: 1.8%",
		tintColor: "#0A1A10",
		glowColor: "#0D2E14",
	},
	M3: {
		score: 78,
		scoreColor: "#22D3EE",
		biomeLabel: "INTERIOR · MESETA",
		line1: "Meseta castellana",
		line2: "0 edificios en 500m  ·  Pendiente: 0.9%",
		line3: "Pastizal natural  ·  Zona no protegida",
		tintColor: "#1A1208",
		glowColor: "#2E1E08",
	},
};

// ── Sub-components ─────────────────────────────────────────────────────────────

/**
 * Subtle scan-line overlay — adds the "radar command center" texture
 * without distracting from the data.
 */
const ScanLines: React.FC = () => (
	<div
		style={{
			position: "absolute",
			inset: 0,
			backgroundImage:
				"repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 8px)",
			pointerEvents: "none",
			zIndex: 1,
		}}
	/>
);

/**
 * Fine dot-grid overlay for extra radar texture in the mid section.
 */
const DotGrid: React.FC = () => (
	<div
		style={{
			position: "absolute",
			top: "15%",
			bottom: "30%",
			left: 0,
			right: 0,
			backgroundImage:
				"radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
			backgroundSize: "38px 38px",
			pointerEvents: "none",
			zIndex: 1,
		}}
	/>
);

/** Top fade — protects IG header UI area */
const TopFade: React.FC = () => (
	<div
		style={{
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			height: "18%",
			background: "linear-gradient(180deg, rgba(0,0,0,0.78) 0%, transparent 100%)",
			zIndex: 2,
		}}
	/>
);

/**
 * Bottom fade — CRITICAL: keeps the bottom 30% (576px) dark and clean
 * so the user can place the native IG question sticker there.
 */
const BottomCleanZone: React.FC = () => (
	<div
		style={{
			position: "absolute",
			bottom: 0,
			left: 0,
			right: 0,
			height: "34%", // slightly more than 30% so the gradient looks natural
			background:
				"linear-gradient(0deg, rgba(10,8,6,0.97) 0%, rgba(10,8,6,0.93) 40%, rgba(10,8,6,0.72) 68%, transparent 100%)",
			zIndex: 2,
		}}
	/>
);

// ── Main component ─────────────────────────────────────────────────────────────

export const StoryRadarEncontro: React.FC<StoryRadarEncontroProps> = ({
	variant,
}) => {
	const d = STORY_DATA[variant];

	return (
		<AbsoluteFill
			style={{
				backgroundColor: "#0F0D0B",
				overflow: "hidden",
			}}
		>
			{/* Radial background gradient — biome tint */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(ellipse 90% 70% at 50% 42%, ${d.glowColor} 0%, ${d.tintColor} 35%, #0F0D0B 70%)`,
					zIndex: 0,
				}}
			/>

			{/* Texture overlays */}
			<ScanLines />
			<DotGrid />

			{/* Fade guards */}
			<TopFade />
			<BottomCleanZone />

			{/* ── Hero content block (top 15% → bottom 30% = the middle 55%) ── */}
			<div
				style={{
					position: "absolute",
					top: "15%",
					bottom: "30%",
					left: 0,
					right: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 3,
					paddingLeft: 52,
					paddingRight: 52,
				}}
			>
				{/* Biome label */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 30,
						fontWeight: 400,
						color: "rgba(255,255,255,0.42)",
						letterSpacing: 5,
						textTransform: "uppercase",
						marginBottom: 18,
						textAlign: "center",
					}}
				>
					{d.biomeLabel}
				</div>

				{/* Score number — hero element */}
				<div
					style={{
						position: "relative",
						display: "flex",
						alignItems: "baseline",
						gap: 8,
						marginBottom: 0,
					}}
				>
					{/* Glow halo behind the number */}
					<div
						style={{
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							width: 340,
							height: 340,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${d.scoreColor}22 0%, transparent 68%)`,
							pointerEvents: "none",
						}}
					/>

					<div
						style={{
							fontFamily: monoFont,
							fontSize: 260,
							fontWeight: 700,
							color: d.scoreColor,
							lineHeight: 0.85,
							letterSpacing: -12,
							textShadow: `0 0 120px ${d.scoreColor}55, 0 0 50px ${d.scoreColor}33, 0 6px 40px rgba(0,0,0,0.9)`,
							position: "relative",
						}}
					>
						{d.score}
					</div>

					<div
						style={{
							fontFamily: monoFont,
							fontSize: 54,
							fontWeight: 400,
							color: "rgba(255,255,255,0.28)",
							lineHeight: 1,
							marginBottom: 14,
							position: "relative",
						}}
					>
						/100
					</div>
				</div>

				{/* Amber accent divider */}
				<div
					style={{
						width: 64,
						height: 3,
						backgroundColor: "#D97706",
						borderRadius: 2,
						boxShadow: "0 0 16px #D9770688",
						marginTop: 28,
						marginBottom: 32,
					}}
				/>

				{/* Data lines in JetBrains Mono */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 14,
						width: "100%",
					}}
				>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 40,
							fontWeight: 700,
							color: "#FFFFFF",
							textAlign: "center",
							lineHeight: 1.3,
							textShadow: "0 2px 18px rgba(0,0,0,0.85)",
						}}
					>
						{d.line1}
					</div>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 34,
							fontWeight: 400,
							color: "#A0836C",
							textAlign: "center",
							lineHeight: 1.4,
							textShadow: "0 2px 12px rgba(0,0,0,0.7)",
						}}
					>
						{d.line2}
					</div>
					<div
						style={{
							fontFamily: monoFont,
							fontSize: 32,
							fontWeight: 400,
							color: "#A0836C",
							textAlign: "center",
							lineHeight: 1.4,
							textShadow: "0 2px 10px rgba(0,0,0,0.7)",
						}}
					>
						{d.line3}
					</div>
				</div>
			</div>

			{/* WildSpotter logo watermark — top right */}
			<div
				style={{
					position: "absolute",
					top: 52,
					right: 44,
					zIndex: 5,
					opacity: 0.6,
				}}
			>
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 60,
						height: 60,
						borderRadius: 14,
						boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};
