import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { DataCard } from "../components/DataCard";

const WARM_BG = "#0F0D0B";
const AMBER = "#D97706";

type Scene2Props = {
	videoSrc: string;
	slope: number;
	elevation: number;
	surface: string;
	buildingsNearby: number;
	roadNoise: string;
	scenicFeature: string;
};

export const Scene2Data: React.FC<Scene2Props> = ({
	videoSrc,
	slope,
	elevation,
	surface,
	buildingsNearby,
	roadNoise,
	scenicFeature,
}) => {
	const frame = useCurrentFrame();

	const bgScale = interpolate(frame, [0, 165], [1.0, 1.05], {
		extrapolateRight: "clamp",
	});

	const dataItems = [
		{ label: "Elevación", value: `${elevation} m`, accent: AMBER },
		{ label: "Pendiente", value: `${slope}%`, accent: AMBER },
		{ label: "Superficie", value: surface, accent: AMBER },
		{ label: "Edificios en 300m", value: `${buildingsNearby}`, accent: "#4ADE80" },
		{ label: "Ruido", value: roadNoise, accent: "#4ADE80" },
		{ label: "Entorno", value: scenicFeature, accent: "#4ADE80" },
	];

	return (
		<AbsoluteFill style={{ background: WARM_BG }}>
			<AbsoluteFill style={{ opacity: 0.12 }}>
				<Video
					src={staticFile(videoSrc)}
					muted
					style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${bgScale})` }}
				/>
			</AbsoluteFill>

			<AbsoluteFill
				style={{
					background: `linear-gradient(to bottom, ${WARM_BG}dd 0%, ${WARM_BG}88 50%, ${WARM_BG}dd 100%)`,
				}}
			/>

			<AbsoluteFill
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 14,
					paddingTop: 250,
					paddingBottom: 450,
					paddingLeft: 80,
					paddingRight: 150,
				}}
			>
				<div
					style={{
						fontFamily: "Inter, sans-serif",
						fontSize: 40,
						fontWeight: 400,
						color: "#A0836C",
						letterSpacing: 2,
						textTransform: "uppercase",
						marginBottom: 16,
					}}
				>
					Datos del spot
				</div>

				{dataItems.map((item, i) => (
					<DataCard
						key={item.label}
						label={item.label}
						value={item.value}
						accentColor={item.accent}
						startFrame={15 + i * 20}
						width={520}
					/>
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
