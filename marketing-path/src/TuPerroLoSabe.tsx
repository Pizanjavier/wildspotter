import { Audio, Video } from "@remotion/media";
import {
	AbsoluteFill,
	Easing,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "700", "900"],
	subsets: ["latin"],
});

export const TU_PERRO_LO_SABE_FRAMES = 590;

export type TuPerroLoSabeProps = {
	hookVariant: "P1" | "P2";
	musicTrack: "golden-fields" | "morning-calm" | "open-road";
};

const FOOTAGE_A: Record<TuPerroLoSabeProps["hookVariant"], string> = {
	P1: "videos/dog-beach-happy.mp4",
	P2: "videos/dog-beach-with-woman.mp4",
};

const FOOTAGE_B: Record<TuPerroLoSabeProps["hookVariant"], string> = {
	P1: "videos/dog-beach-with-woman.mp4",
	P2: "videos/dog-beach-happy.mp4",
};

const CROSS_DUR = 20;

const TikTokText: React.FC<{
	children: React.ReactNode;
	fontSize?: number;
	bottom?: number;
	top?: number;
}> = ({ children, fontSize = 72, bottom, top }) => (
	<div
		style={{
			position: "absolute",
			...(bottom !== undefined ? { bottom } : {}),
			...(top !== undefined ? { top } : {}),
			left: 40,
			right: 40,
			textAlign: "center",
		}}
	>
		<div
			style={{
				fontFamily: interFont,
				fontSize,
				fontWeight: 900,
				color: "#FFFFFF",
				lineHeight: 1.2,
				WebkitTextStroke: "3px black",
				paintOrder: "stroke fill",
				textShadow: "0 4px 20px rgba(0,0,0,0.6)",
			}}
		>
			{children}
		</div>
	</div>
);

export const TuPerroLoSabe: React.FC<TuPerroLoSabeProps> = ({
	hookVariant = "P1",
	musicTrack = "golden-fields",
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	const footageA = FOOTAGE_A[hookVariant];
	const footageB = FOOTAGE_B[hookVariant];
	const footageC = "videos/van_in_spot_calm_couple_dog_night.mp4";

	// Transition points — footage crossfades
	const crossAB = 200;
	const crossBC = 340;

	// Continuous Ken Burns across entire composition
	const globalZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.12], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	// Layer opacities — direct crossfade, never through black
	const opA = interpolate(frame, [crossAB, crossAB + CROSS_DUR], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const opB = Math.min(
		interpolate(frame, [crossAB, crossAB + CROSS_DUR], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		interpolate(frame, [crossBC, crossBC + CROSS_DUR], [1, 0], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);
	const opC = interpolate(frame, [crossBC, crossBC + CROSS_DUR], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const videoStyle: React.CSSProperties = {
		width: "100%",
		height: "100%",
		objectFit: "cover",
	};

	const layerStyle = (opacity: number): React.CSSProperties => ({
		position: "absolute",
		inset: 0,
		opacity,
		transform: `scale(${globalZoom})`,
		transformOrigin: "50% 50%",
	});

	// Text timing
	const text1Op = interpolate(frame, [25, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const text1Out = interpolate(frame, [crossAB - 15, crossAB], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const text2Op = interpolate(frame, [crossAB + 25, crossAB + 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const text2Out = interpolate(frame, [crossBC - 30, crossBC - 10], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const text3In = interpolate(frame, [crossBC + 20, crossBC + 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const text3Out = interpolate(frame, [crossBC + 130, crossBC + 150], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const text3Op = Math.min(text3In, text3Out);

	const ctaOp = interpolate(frame, [crossBC + 145, crossBC + 165], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ backgroundColor: "#000" }}>
			{/* Music */}
			<Audio
				src={staticFile(`audio/music/${musicTrack}.mp3`)}
				volume={(f) => {
					const fadeIn = interpolate(f, [0, fps], [0, 0.4], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					});
					const fadeOut = interpolate(
						f,
						[durationInFrames - 3 * fps, durationInFrames],
						[0.4, 0],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					);
					if (f < fps) return fadeIn;
					if (f > durationInFrames - 3 * fps) return fadeOut;
					return 0.4;
				}}
			/>

			{/* Video layer A — dog beach clip 1 */}
			<div style={layerStyle(opA)}>
				<Video src={staticFile(footageA)} muted loop style={videoStyle} />
			</div>

			{/* Video layer B — dog beach clip 2 */}
			{frame > crossAB - 5 && (
				<div style={layerStyle(opB)}>
					<Video src={staticFile(footageB)} muted loop style={videoStyle} />
				</div>
			)}

			{/* Video layer C — couple+dog night */}
			{frame > crossBC - 5 && (
				<div style={layerStyle(opC)}>
					<Video src={staticFile(footageC)} muted loop style={videoStyle} />
				</div>
			)}

			{/* Bottom gradient for text readability */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 700,
					background:
						"linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)",
				}}
			/>

			{/* Text 1: "Él no necesita WiFi." */}
			<div style={{ opacity: Math.min(text1Op, text1Out) }}>
				<TikTokText fontSize={76} top={380}>
					Él no necesita WiFi.
				</TikTokText>
			</div>

			{/* Text 2: "Solo necesita esto." */}
			<div style={{ opacity: Math.min(text2Op, text2Out) }}>
				<TikTokText fontSize={76} top={380}>
					Solo necesita esto.
				</TikTokText>
			</div>

			{/* Text 3: "Playas sin nombre..." */}
			<div style={{ opacity: text3Op }}>
				<TikTokText fontSize={60} bottom={450}>
					Playas sin nombre.
					<br />
					Caminos sin final.
					<br />
					Noches sin ruido.
				</TikTokText>
			</div>

			{/* CTA: "Tu perro lo sabe." + logo */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: ctaOp,
					background:
						"radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)",
				}}
			/>
			<div style={{ opacity: ctaOp }}>
				<div
					style={{
						position: "absolute",
						top: 340,
						left: 40,
						right: 40,
						textAlign: "center",
					}}
				>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 80,
							fontWeight: 900,
							color: "#FFFFFF",
							WebkitTextStroke: "3px black",
							paintOrder: "stroke fill",
							textShadow: "0 4px 20px rgba(0,0,0,0.6)",
						}}
					>
						Tu perro lo sabe.
					</div>
				</div>
				<div
					style={{
						position: "absolute",
						bottom: 370,
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 20,
					}}
				>
					<Img
						src={staticFile("images/app-logo.png")}
						style={{
							width: 140,
							height: 140,
							borderRadius: 32,
							boxShadow: "0 6px 30px rgba(0,0,0,0.5)",
						}}
					/>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 36,
							fontWeight: 700,
							color: "#FFFFFF",
							letterSpacing: 1,
						}}
					>
						WildSpotter
					</div>
					<div
						style={{
							fontFamily: interFont,
							fontSize: 24,
							fontWeight: 400,
							color: "rgba(255,255,255,0.5)",
							letterSpacing: 2,
						}}
					>
						LINK IN BIO
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
