import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ScanPulse } from "../components/RadarPulse";

const WARM_BG = "#0F0D0B";
const AMBER = "#D97706";
const MUTED = "#A0836C";

type Scene1Props = {
	videoSrc: string;
};

export const Scene1Scanning: React.FC<Scene1Props> = ({ videoSrc }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const textOpacity = spring({
		frame: frame - 30,
		fps,
		config: { damping: 20, stiffness: 100 },
		durationInFrames: 30,
	});

	const subtitleOpacity = spring({
		frame: frame - 55,
		fps,
		config: { damping: 20, stiffness: 100 },
		durationInFrames: 25,
	});

	const bgScale = interpolate(frame, [0, 120], [1.0, 1.06], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: WARM_BG }}>
			<AbsoluteFill style={{ opacity: 0.15 }}>
				<Video
					src={staticFile(videoSrc)}
					muted
					style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${bgScale})` }}
				/>
			</AbsoluteFill>

			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 50% 50%, transparent 0%, ${WARM_BG}ee 60%, ${WARM_BG} 100%)`,
				}}
			/>

			<ScanPulse color={AMBER} ringCount={3} maxRadius={800} period={60} baseOpacity={0.4} />

			<AbsoluteFill
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 16,
				}}
			>
				<div
					style={{
						fontFamily: "Inter, sans-serif",
						fontSize: 80,
						fontWeight: 700,
						color: AMBER,
						opacity: textOpacity,
						letterSpacing: -1,
						textShadow: `0 4px 24px ${AMBER}44`,
					}}
				>
					Escaneando zona...
				</div>
				<div
					style={{
						fontFamily: "Inter, sans-serif",
						fontSize: 36,
						fontWeight: 400,
						color: MUTED,
						opacity: subtitleOpacity,
						textAlign: "center",
						maxWidth: 700,
						lineHeight: 1.4,
					}}
				>
					Analizando terreno, zonas legales y satélite
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
