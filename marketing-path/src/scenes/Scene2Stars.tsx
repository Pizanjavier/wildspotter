import {
	AbsoluteFill,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "900"],
	subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
	weights: ["400", "700"],
	subsets: ["latin"],
});

const Star: React.FC<{ delay: number }> = ({ delay }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const pop = spring({
		frame,
		fps,
		delay,
		config: { damping: 8, stiffness: 250 },
	});
	const finalScale = interpolate(pop, [0, 0.7, 1], [0, 1.4, 1]);

	return (
		<div
			style={{
				fontSize: 80,
				transform: `scale(${finalScale})`,
				filter: "drop-shadow(0 0 18px rgba(217,119,6,0.7))",
				color: "#D97706",
				lineHeight: 1,
			}}
		>
			★
		</div>
	);
};

export const Scene2Stars: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const ratingIn = spring({ frame, fps, delay: 22, config: { damping: 200 } });
	const reviewsIn = spring({
		frame,
		fps,
		delay: 30,
		config: { damping: 200 },
	});

	const reviewCount = Math.floor(
		interpolate(frame, [30, 55], [0, 200], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);

	const slamIn = spring({
		frame,
		fps,
		delay: 55,
		config: { damping: 10, stiffness: 320 },
	});
	const slamScale = interpolate(slamIn, [0, 0.6, 1], [1.5, 1.1, 1]);
	const slamOpacity = interpolate(slamIn, [0, 0.2], [0, 1], {
		extrapolateRight: "clamp",
	});

	const shakeX =
		frame > 55 && frame < 66
			? Math.sin(frame * 2.8) *
				interpolate(frame, [55, 66], [10, 0], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				})
			: 0;
	const shakeY =
		frame > 55 && frame < 66
			? Math.cos(frame * 3.5) *
				interpolate(frame, [55, 66], [6, 0], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				})
			: 0;

	const cardIn = spring({ frame, fps, delay: 0, config: { damping: 200 } });

	// Slow zoom on parking footage (continuation from Scene1)
	const bgZoom = interpolate(frame, [0, 140], [1.12, 1.22], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				overflow: "hidden",
				background: "#0F0D0B",
				transform: `translate(${shakeX}px, ${shakeY}px)`,
			}}
		>
			{/* Continued parking footage — zoomed tighter, darker */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					transform: `scale(${bgZoom})`,
					transformOrigin: "50% 50%",
				}}
			>
				<Video
					src={staticFile("videos/ai_Campervan_Gathering_in_Golden_Hour.mp4")}
					muted
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						opacity: 0.25,
					}}
				/>
			</div>

			{/* Heavy dark overlay — text focus */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse at 50% 45%, rgba(15,13,11,0.55) 0%, rgba(15,13,11,0.88) 100%)",
				}}
			/>

			{/* Park4night card mock */}
			<div
				style={{
					position: "absolute",
					top: 350,
					left: 60,
					right: 60,
					background: "rgba(42,33,24,0.92)",
					backdropFilter: "blur(12px)",
					borderRadius: 24,
					border: "1px solid rgba(160,131,108,0.2)",
					padding: "32px 36px",
					opacity: cardIn,
					transform: `translateY(${interpolate(cardIn, [0, 1], [40, 0])}px)`,
					boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
				}}
			>
				{/* Park4night label */}
				<div
					style={{
						fontFamily: interFont,
						fontSize: 22,
						fontWeight: 700,
						color: "#A0836C",
						letterSpacing: 3,
						textTransform: "uppercase",
						marginBottom: 20,
					}}
				>
					Otras apps · Playa Los Genoveses
				</div>

				{/* Stars row */}
				<div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
					{[0, 5, 10, 15, 20].map((delay, i) => (
						<Star key={i} delay={delay} />
					))}
				</div>

				{/* Rating + reviews */}
				<div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
					<div
						style={{
							fontFamily: jetbrainsFont,
							fontSize: 110,
							fontWeight: 700,
							color: "#D97706",
							lineHeight: 1,
							opacity: ratingIn,
						}}
					>
						4.8
					</div>
					<div
						style={{
							fontFamily: jetbrainsFont,
							fontSize: 34,
							color: "#A0836C",
							opacity: reviewsIn,
						}}
					>
						({reviewCount} reviews)
					</div>
				</div>
			</div>

			{/* Slam text */}
			<div
				style={{
					position: "absolute",
					bottom: 350,
					left: 60,
					right: 60,
					opacity: slamOpacity,
					transform: `scale(${slamScale})`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 92,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.1,
						letterSpacing: -2,
						textShadow:
							"0 0 60px rgba(217,119,6,0.2), 0 4px 30px rgba(0,0,0,0.9)",
					}}
				>
					Y no cabe
					<br />
					<span style={{ color: "#D97706" }}>ni un coche.</span>
				</div>

				{/* Divider */}
				<div
					style={{
						width: 80,
						height: 4,
						borderRadius: 2,
						background: "#D97706",
						marginTop: 28,
						opacity: 0.6,
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};
