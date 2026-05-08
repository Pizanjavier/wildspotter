import { Video } from "@remotion/media";
import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { ScanPulse } from "../components/RadarPulse";

const WARM_BG = "#0F0D0B";
const AMBER = "#D97706";
const MUTED = "#A0836C";

type Scene5Props = {
	videoSrc: string;
};

export const Scene5CTA: React.FC<Scene5Props> = ({ videoSrc }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const questionOpacity = spring({
		frame: frame - 5,
		fps,
		config: { damping: 18, stiffness: 120 },
		durationInFrames: 25,
	});

	const questionScale = spring({
		frame: frame - 5,
		fps,
		config: { damping: 12, stiffness: 180 },
		durationInFrames: 25,
	});

	const logoOpacity = spring({
		frame: frame - 35,
		fps,
		config: { damping: 20, stiffness: 100 },
		durationInFrames: 25,
	});

	const ctaOpacity = spring({
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
			<AbsoluteFill style={{ opacity: 0.18 }}>
				<Video
					src={staticFile(videoSrc)}
					muted
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transform: `scale(${bgScale})`,
					}}
				/>
			</AbsoluteFill>

			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 50% 45%, transparent 0%, ${WARM_BG}cc 50%, ${WARM_BG} 100%)`,
				}}
			/>

			<ScanPulse
				color={AMBER}
				ringCount={2}
				maxRadius={500}
				period={70}
				baseOpacity={0.15}
			/>

			<AbsoluteFill
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 28,
					paddingBottom: 200,
				}}
			>
				<div
					style={{
						fontFamily: "Inter, sans-serif",
						fontSize: 84,
						fontWeight: 900,
						color: "#FFFFFF",
						opacity: questionOpacity,
						transform: `scale(${interpolate(questionScale, [0, 1], [0.8, 1])})`,
						letterSpacing: -2,
						textShadow: `0 4px 24px rgba(0,0,0,0.6)`,
					}}
				>
					¿Dónde está?
				</div>

				<div style={{ opacity: logoOpacity }}>
					<Img
						src={staticFile("images/app-logo.png")}
						style={{ width: 120, height: 120, borderRadius: 24 }}
					/>
				</div>

				<div
					style={{
						fontFamily: "Inter, sans-serif",
						fontSize: 44,
						fontWeight: 700,
						color: AMBER,
						opacity: logoOpacity,
						letterSpacing: -0.5,
					}}
				>
					Solo en WildSpotter
				</div>

				<div
					style={{
						fontFamily: "Inter, sans-serif",
						fontSize: 34,
						fontWeight: 400,
						color: MUTED,
						opacity: ctaOpacity,
					}}
				>
					Link en bio
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
