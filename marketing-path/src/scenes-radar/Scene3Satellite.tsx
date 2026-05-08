import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const WARM_BG = "#0F0D0B";
const AMBER = "#D97706";
const MUTED = "#A0836C";

type Scene3Props = {
	satelliteImage: string;
};

export const Scene3Satellite: React.FC<Scene3Props> = ({ satelliteImage }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const revealProgress = spring({
		frame: frame - 15,
		fps,
		config: { damping: 18, stiffness: 80 },
		durationInFrames: 70,
	});

	const clipRadius = interpolate(revealProgress, [0, 1], [0, 75]);
	const imgScale = interpolate(revealProgress, [0, 1], [1.8, 1.0]);
	const blur = interpolate(revealProgress, [0, 0.5, 1], [16, 4, 0]);

	const shakeActive = frame > 70 && frame < 82;
	const shakeX = shakeActive ? Math.sin(frame * 8) * 4 * (1 - (frame - 70) / 12) : 0;
	const shakeY = shakeActive ? Math.cos(frame * 6) * 3 * (1 - (frame - 70) / 12) : 0;

	const labelOpacity = spring({
		frame: frame - 90,
		fps,
		config: { damping: 20, stiffness: 100 },
		durationInFrames: 25,
	});

	const crosshairOpacity = interpolate(frame, [20, 40], [0, 0.6], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ background: WARM_BG }}>
			<AbsoluteFill
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					transform: `translate(${shakeX}px, ${shakeY}px)`,
				}}
			>
				<div
					style={{
						width: 750,
						height: 750,
						borderRadius: 20,
						overflow: "hidden",
						clipPath: `circle(${clipRadius}% at 50% 50%)`,
						border: `3px solid ${AMBER}88`,
						boxShadow: `0 0 60px ${AMBER}33, 0 0 120px ${AMBER}11`,
					}}
				>
					<Img
						src={staticFile(satelliteImage)}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							transform: `scale(${imgScale})`,
							filter: `blur(${blur}px) saturate(1.2)`,
						}}
					/>
				</div>

				{/* Crosshair */}
				<div
					style={{
						position: "absolute",
						width: 60,
						height: 60,
						opacity: crosshairOpacity,
					}}
				>
					<div style={{ position: "absolute", top: 0, left: "50%", width: 2, height: 20, background: AMBER, transform: "translateX(-50%)" }} />
					<div style={{ position: "absolute", bottom: 0, left: "50%", width: 2, height: 20, background: AMBER, transform: "translateX(-50%)" }} />
					<div style={{ position: "absolute", left: 0, top: "50%", width: 20, height: 2, background: AMBER, transform: "translateY(-50%)" }} />
					<div style={{ position: "absolute", right: 0, top: "50%", width: 20, height: 2, background: AMBER, transform: "translateY(-50%)" }} />
				</div>
			</AbsoluteFill>

			{/* Amber ring border glow */}
			<AbsoluteFill
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					pointerEvents: "none",
				}}
			>
				<div
					style={{
						width: 756,
						height: 756,
						borderRadius: 23,
						border: `2px solid ${AMBER}44`,
						boxShadow: `inset 0 0 40px ${AMBER}11`,
						opacity: revealProgress,
					}}
				/>
			</AbsoluteFill>

			{/* Label */}
			<div
				style={{
					position: "absolute",
					bottom: 480,
					left: 0,
					right: 0,
					display: "flex",
					justifyContent: "center",
					opacity: labelOpacity,
				}}
			>
				<div
					style={{
						fontFamily: "JetBrains Mono, monospace",
						fontSize: 28,
						color: MUTED,
						letterSpacing: 2,
						padding: "8px 20px",
						background: "#1E1A17cc",
						borderRadius: 8,
						border: `1px solid #3D353044`,
					}}
				>
					PNOA · 25cm/px · Ortofoto real
				</div>
			</div>
		</AbsoluteFill>
	);
};
