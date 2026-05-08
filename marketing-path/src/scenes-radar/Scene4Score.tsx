import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ScoreRing } from "../components/ScoreRing";
import { DataCard } from "../components/DataCard";

const WARM_BG = "#0F0D0B";
const AMBER = "#D97706";
const GREEN = "#4ADE80";

type LegalData = {
	natura: boolean;
	park: boolean;
	coastal: boolean;
	cadastre: string;
};

type Scene4Props = {
	satelliteImage: string;
	score: number;
	wildBonus: number;
	legal: LegalData;
};

export const Scene4Score: React.FC<Scene4Props> = ({
	satelliteImage,
	score,
	wildBonus,
	legal,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bonusOpacity = spring({
		frame: frame - 80,
		fps,
		config: { damping: 12, stiffness: 150 },
		durationInFrames: 25,
	});

	const bonusScale = spring({
		frame: frame - 80,
		fps,
		config: { damping: 10, stiffness: 200 },
		durationInFrames: 25,
	});

	const legalCards = [
		{ label: "Natura 2000", value: legal.natura ? "Dentro" : "Fuera" },
		{ label: "Parque Nacional", value: legal.park ? "Dentro" : "Fuera" },
		{ label: "Ley de Costas", value: legal.coastal ? "Dentro" : "Fuera" },
		{ label: "Catastro", value: legal.cadastre },
	];

	return (
		<AbsoluteFill style={{ background: WARM_BG }}>
			<AbsoluteFill style={{ opacity: 0.35 }}>
				<Img
					src={staticFile(satelliteImage)}
					style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(4px) saturate(0.8)" }}
				/>
			</AbsoluteFill>
			<AbsoluteFill style={{ background: `${WARM_BG}99` }} />

			<AbsoluteFill
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					paddingTop: 250,
					paddingBottom: 450,
					gap: 24,
				}}
			>
				<ScoreRing score={score} size={340} startFrame={5} fillDuration={55} />

				{/* Wild bonus badge */}
				<div
					style={{
						opacity: bonusOpacity,
						transform: `scale(${interpolate(bonusScale, [0, 1], [0.7, 1])})`,
						fontFamily: "JetBrains Mono, monospace",
						fontSize: 32,
						fontWeight: 700,
						color: AMBER,
						padding: "10px 24px",
						background: "#1E1A17",
						borderRadius: 12,
						border: `1px solid ${AMBER}44`,
						boxShadow: `0 0 20px ${AMBER}22`,
						letterSpacing: 1,
					}}
				>
					+{wildBonus} BONUS SALVAJE
				</div>

				{/* Legal cards grid */}
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: 10,
						justifyContent: "center",
						marginTop: 8,
						maxWidth: 560,
					}}
				>
					{legalCards.map((card, i) => (
						<DataCard
							key={card.label}
							label={card.label}
							value={card.value}
							accentColor={GREEN}
							indicator="check"
							startFrame={45 + i * 15}
							width={260}
						/>
					))}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
