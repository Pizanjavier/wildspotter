import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
const { fontFamily: monoFont } = loadJetBrains("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});

export type BTSVariant = "BTS1" | "BTS2" | "BTS3" | "BTS4";

export type StoryBTSProps = {
	variant: BTSVariant;
};

type BTSData = {
	topLabel: string;
	rows: { label: string; value: string; bar: number; color: string }[];
	footnote: string;
};

const PIPELINE_STAGES = [
	{ label: "Radar", value: "83.006", bar: 1.0, color: "#22D3EE" },
	{ label: "Terreno", value: "81.244", bar: 0.98, color: "#22D3EE" },
	{ label: "Legal", value: "81.244", bar: 0.98, color: "#22D3EE" },
	{ label: "Satelite IA", value: "79.018", bar: 0.95, color: "#D97706" },
	{ label: "Contexto", value: "79.018", bar: 0.95, color: "#D97706" },
	{ label: "Uso Suelo", value: "79.018", bar: 0.95, color: "#4ADE80" },
	{ label: "Score Final", value: "393", bar: 0.05, color: "#4ADE80" },
];

const SUB_SCORES = [
	{ label: "surface_quality", value: "8/10", bar: 0.8, color: "#4ADE80" },
	{ label: "open_space", value: "7/10", bar: 0.7, color: "#4ADE80" },
	{ label: "vehicle_access", value: "9/10", bar: 0.9, color: "#4ADE80" },
	{ label: "obstruction_abs", value: "6/10", bar: 0.6, color: "#D97706" },
	{ label: "van_presence", value: "3/10", bar: 0.3, color: "#EF4444" },
];

const SCORE_DIST = [
	{ label: "Score 90-100", value: "7", bar: 0.02, color: "#4ADE80" },
	{ label: "Score 80-89", value: "34", bar: 0.04, color: "#4ADE80" },
	{ label: "Score 70-79", value: "352", bar: 0.42, color: "#22D3EE" },
	{ label: "Score 60-69", value: "1.847", bar: 0.65, color: "#22D3EE" },
	{ label: "Score 50-59", value: "4.291", bar: 0.82, color: "#D97706" },
	{ label: "Score < 50", value: "76.475", bar: 1.0, color: "#EF4444" },
];

const CONTEXT_SCORES = [
	{ label: "road_noise", value: "-10", bar: 0.25, color: "#EF4444" },
	{ label: "urban_density", value: "+20", bar: 0.6, color: "#4ADE80" },
	{ label: "scenic_value", value: "+25", bar: 0.75, color: "#4ADE80" },
	{ label: "privacy", value: "+15", bar: 0.5, color: "#4ADE80" },
	{ label: "industrial", value: "0", bar: 0.0, color: "#A0836C" },
	{ label: "drinking_water", value: "+10", bar: 0.35, color: "#22D3EE" },
];

const BTS_DATA: Record<BTSVariant, BTSData> = {
	BTS1: {
		topLabel: "PIPELINE · EN DIRECTO",
		rows: PIPELINE_STAGES,
		footnote: "83.006 spots procesados en Espana",
	},
	BTS2: {
		topLabel: "IA · SUB-SCORES",
		rows: SUB_SCORES,
		footnote: "Claude Haiku 4.5 · PNOA 25cm/px",
	},
	BTS3: {
		topLabel: "DISTRIBUCION · SCORES",
		rows: SCORE_DIST,
		footnote: "Solo 393 spots con score >= 70",
	},
	BTS4: {
		topLabel: "CONTEXTO · DETALLE",
		rows: CONTEXT_SCORES,
		footnote: "Spot ejemplo · Score final: 87/100",
	},
};

const BlurOverlay: React.FC = () => (
	<div
		style={{
			position: "absolute",
			inset: 0,
			backdropFilter: "blur(3px)",
			WebkitBackdropFilter: "blur(3px)",
			pointerEvents: "none",
			zIndex: 6,
			background:
				"radial-gradient(ellipse 70% 50% at 50% 45%, transparent 0%, rgba(15,13,11,0.3) 100%)",
		}}
	/>
);

export const StoryBTS: React.FC<StoryBTSProps> = ({ variant }) => {
	const d = BTS_DATA[variant];

	return (
		<AbsoluteFill style={{ backgroundColor: "#0F0D0B", overflow: "hidden" }}>
			{/* Background glow */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse 90% 70% at 50% 38%, #0D1A22 0%, #0F0D0B 60%)",
					zIndex: 0,
				}}
			/>

			{/* Scan lines */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage:
						"repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 6px)",
					pointerEvents: "none",
					zIndex: 1,
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
					zIndex: 7,
				}}
			/>

			{/* Bottom clean zone */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "32%",
					background:
						"linear-gradient(0deg, rgba(10,8,6,0.98) 0%, rgba(10,8,6,0.92) 40%, rgba(10,8,6,0.5) 75%, transparent 100%)",
					zIndex: 7,
				}}
			/>

			{/* Data content — intentionally "leaked" / behind-the-scenes feel */}
			<div
				style={{
					position: "absolute",
					top: "15%",
					bottom: "34%",
					left: 0,
					right: 0,
					display: "flex",
					flexDirection: "column",
					zIndex: 3,
					paddingLeft: 48,
					paddingRight: 48,
				}}
			>
				{/* Top label */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 22,
						fontWeight: 400,
						color: "rgba(255,255,255,0.35)",
						letterSpacing: 5,
						marginBottom: 28,
					}}
				>
					{d.topLabel}
				</div>

				{/* Data rows */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 18,
						flex: 1,
						justifyContent: "center",
					}}
				>
					{d.rows.map((row) => (
						<div
							key={row.label}
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 6,
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "baseline",
								}}
							>
								<div
									style={{
										fontFamily: monoFont,
										fontSize: 28,
										fontWeight: 400,
										color: "#A0836C",
									}}
								>
									{row.label}
								</div>
								<div
									style={{
										fontFamily: monoFont,
										fontSize: 30,
										fontWeight: 700,
										color: row.color,
									}}
								>
									{row.value}
								</div>
							</div>
							{/* Progress bar */}
							<div
								style={{
									width: "100%",
									height: 6,
									backgroundColor: "rgba(255,255,255,0.06)",
									borderRadius: 3,
									overflow: "hidden",
								}}
							>
								<div
									style={{
										width: `${row.bar * 100}%`,
										height: "100%",
										backgroundColor: row.color,
										borderRadius: 3,
										opacity: 0.7,
										boxShadow: `0 0 12px ${row.color}44`,
									}}
								/>
							</div>
						</div>
					))}
				</div>

				{/* Footnote */}
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 20,
						fontWeight: 400,
						color: "rgba(255,255,255,0.22)",
						marginTop: 24,
						letterSpacing: 1,
					}}
				>
					{d.footnote}
				</div>
			</div>

			{/* Blur overlay — gives the "leaked screenshot" feel */}
			<BlurOverlay />

			{/* "Behind the scenes" badge */}
			<div
				style={{
					position: "absolute",
					top: "16%",
					left: 48,
					zIndex: 8,
					display: "flex",
					alignItems: "center",
					gap: 8,
					backgroundColor: "rgba(217,119,6,0.15)",
					border: "1px solid rgba(217,119,6,0.4)",
					borderRadius: 20,
					paddingLeft: 16,
					paddingRight: 16,
					paddingTop: 7,
					paddingBottom: 7,
				}}
			>
				<div
					style={{
						width: 8,
						height: 8,
						borderRadius: 4,
						backgroundColor: "#EF4444",
						boxShadow: "0 0 8px #EF444488",
					}}
				/>
				<div
					style={{
						fontFamily: monoFont,
						fontSize: 18,
						fontWeight: 700,
						color: "#D97706",
						letterSpacing: 2,
					}}
				>
					EN DIRECTO
				</div>
			</div>

			{/* Logo watermark */}
			<div
				style={{
					position: "absolute",
					top: 52,
					right: 44,
					zIndex: 8,
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
