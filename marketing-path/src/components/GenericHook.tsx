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

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "900"],
	subsets: ["latin"],
});

type GenericHookProps = {
	title: React.ReactNode;
	subtitle: string;
	subtitle2?: string;
	videoSrc: string;
	dimOpacity?: number;
	sceneDuration?: number;
};

/**
 * Reusable hook scene: text-over-video with title at top, subtitle(s) at bottom.
 * Matches the visual style of ParkingLleno Scene1Hook.
 */
export const GenericHook: React.FC<GenericHookProps> = ({
	title,
	subtitle,
	subtitle2,
	videoSrc,
	dimOpacity = 0.35,
	sceneDuration = 130,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const titleIn = spring({ frame, fps, config: { damping: 200 } });
	const titleY = interpolate(titleIn, [0, 1], [50, 0]);

	const zoom = interpolate(frame, [0, sceneDuration], [1.0, 1.12], {
		extrapolateRight: "clamp",
	});

	const lateIn = interpolate(frame, [80, 95], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const lateY = interpolate(frame, [80, 95], [20, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ overflow: "hidden", background: "#0F0D0B" }}>
			{/* Video background with Ken Burns zoom */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					transform: `scale(${zoom})`,
					transformOrigin: "50% 50%",
				}}
			>
				<Video
					src={staticFile(videoSrc)}
					muted
					style={{ width: "100%", height: "100%", objectFit: "cover" }}
				/>
			</div>

			{/* Dark warm tint overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `rgba(26,22,20,${dimOpacity})`,
					mixBlendMode: "multiply",
				}}
			/>

			{/* Top vignette */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 500,
					background:
						"linear-gradient(180deg, rgba(15,13,11,0.92) 0%, rgba(15,13,11,0.6) 50%, transparent 100%)",
				}}
			/>

			{/* Bottom vignette */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 500,
					background:
						"linear-gradient(0deg, rgba(15,13,11,0.92) 0%, rgba(15,13,11,0.6) 50%, transparent 100%)",
				}}
			/>

			{/* Title */}
			<div
				style={{
					position: "absolute",
					top: 110,
					left: 70,
					right: 70,
					opacity: titleIn,
					transform: `translateY(${titleY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 82,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.1,
						letterSpacing: -1,
						textShadow:
							"0 4px 30px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7)",
					}}
				>
					{title}
				</div>
			</div>

			{/* Late reveal subtitle(s) */}
			<div
				style={{
					position: "absolute",
					bottom: 180,
					left: 70,
					right: 70,
					opacity: lateIn,
					transform: `translateY(${lateY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 48,
						fontWeight: 700,
						color: "rgba(255,255,255,0.85)",
						textShadow:
							"0 3px 20px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.7)",
					}}
				>
					{subtitle}
				</div>
				{subtitle2 && (
					<div
						style={{
							fontFamily: interFont,
							fontSize: 48,
							fontWeight: 700,
							color: "rgba(255,255,255,0.85)",
							marginTop: 4,
							textShadow:
								"0 3px 20px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.7)",
						}}
					>
						{subtitle2}
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};
