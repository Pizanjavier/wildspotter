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

export const MIENTRAS_TODOS_BUSCAN_FRAMES = 600;

export type MientrasTodosBuscanProps = {
	hookVariant: "MT1" | "MT2";
	musicTrack: "rising-tide" | "open-road" | "epic-drums";
};

const CROWD_A: Record<MientrasTodosBuscanProps["hookVariant"], string> = {
	MT1: "videos/rvs_parked_outdoors.mp4",
	MT2: "videos/ai_Campervan_Gathering_in_Golden_Hour.mp4",
};

const CROWD_B: Record<MientrasTodosBuscanProps["hookVariant"], string> = {
	MT1: "videos/crowded_parking_aerial.mp4",
	MT2: "videos/rvs_parked_outdoors.mp4",
};

const CALM_FOOTAGE = "videos/drone_forest.mp4";
const NIGHT_FOOTAGE = "videos/ai_Stars_Timelapse_Van_Night.mp4";
const CTA_FOOTAGE = "videos/ai_Campervan_Sunset_Time_Lapse_Video.mp4";

const CROSS_DUR = 20;

const LabelBar: React.FC<{
	text: string;
	color: string;
	opacity: number;
}> = ({ text, color, opacity }) => (
	<div
		style={{
			position: "absolute",
			top: 160,
			left: 0,
			right: 0,
			display: "flex",
			justifyContent: "center",
			opacity,
		}}
	>
		<div
			style={{
				backgroundColor: "rgba(0,0,0,0.65)",
				borderRadius: 12,
				padding: "14px 36px",
				borderLeft: `5px solid ${color}`,
			}}
		>
			<div
				style={{
					fontFamily: interFont,
					fontSize: 36,
					fontWeight: 700,
					color,
					letterSpacing: 1,
					textTransform: "uppercase",
				}}
			>
				{text}
			</div>
		</div>
	</div>
);

export const MientrasTodosBuscan: React.FC<MientrasTodosBuscanProps> = ({
	hookVariant = "MT1",
	musicTrack = "rising-tide",
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	const crowdASrc = CROWD_A[hookVariant];
	const crowdBSrc = CROWD_B[hookVariant];

	// Crossfade points between footage layers
	const cross1 = 130; // crowdA → calm
	const cross2 = 260; // calm → crowdB
	const cross3 = 380; // crowdB → night
	const cross4 = 480; // night → CTA

	// Continuous Ken Burns
	const globalZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.1], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	// Layer opacities — 5 distinct layers, direct crossfades
	const opCrowdA = interpolate(frame, [cross1, cross1 + CROSS_DUR], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const opCrowdB = Math.min(
		interpolate(frame, [cross2, cross2 + CROSS_DUR], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		interpolate(frame, [cross3, cross3 + CROSS_DUR], [1, 0], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);
	const opCalm = Math.min(
		interpolate(frame, [cross1, cross1 + CROSS_DUR], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		interpolate(frame, [cross2, cross2 + CROSS_DUR], [1, 0], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);
	const opNight = Math.min(
		interpolate(frame, [cross3, cross3 + CROSS_DUR], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		interpolate(frame, [cross4, cross4 + CROSS_DUR], [1, 0], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);
	const opCta = interpolate(frame, [cross4, cross4 + CROSS_DUR], [0, 1], {
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

	// Text + label timing helpers
	const textFade = (inF: number, outF: number) => {
		const fadeIn = interpolate(frame, [inF, inF + 20], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		});
		const fadeOut = interpolate(frame, [outF - 15, outF], [1, 0], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		});
		return Math.min(fadeIn, fadeOut);
	};

	const s1Op = textFade(0, cross1);
	const s2Op = textFade(cross1 + 15, cross2);
	const s3Op = textFade(cross2 + 15, cross3);
	const s4Op = textFade(cross3 + 15, cross4);

	const ctaTextOp = interpolate(frame, [cross4 + 25, cross4 + 50], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const ctaLogoOp = interpolate(frame, [cross4 + 55, cross4 + 75], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const bodyText: React.CSSProperties = {
		fontFamily: interFont,
		fontSize: 64,
		fontWeight: 900,
		color: "#FFFFFF",
		lineHeight: 1.25,
		WebkitTextStroke: "2px black",
		paintOrder: "stroke fill",
		textShadow: "0 3px 15px rgba(0,0,0,0.6)",
	};

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

			{/* Footage layer: crowd A (S1) */}
			<div style={layerStyle(opCrowdA)}>
				<Video src={staticFile(crowdASrc)} muted loop style={videoStyle} />
			</div>

			{/* Footage layer: calm forest (S2) */}
			{frame > cross1 - 5 && frame < cross2 + CROSS_DUR + 5 && (
				<div style={layerStyle(opCalm)}>
					<Video src={staticFile(CALM_FOOTAGE)} muted loop style={videoStyle} />
				</div>
			)}

			{/* Footage layer: crowd B (S3) — different clip */}
			{frame > cross2 - 5 && frame < cross3 + CROSS_DUR + 5 && (
				<div style={layerStyle(opCrowdB)}>
					<Video src={staticFile(crowdBSrc)} muted loop style={videoStyle} />
				</div>
			)}

			{/* Footage layer: night stars (S4) */}
			{frame > cross3 - 5 && frame < cross4 + CROSS_DUR + 5 && (
				<div style={layerStyle(opNight)}>
					<Video src={staticFile(NIGHT_FOOTAGE)} muted loop style={videoStyle} />
				</div>
			)}

			{/* Footage layer: CTA sunset */}
			{frame > cross4 - 5 && (
				<div style={layerStyle(opCta)}>
					<Video src={staticFile(CTA_FOOTAGE)} muted loop style={videoStyle} />
				</div>
			)}

			{/* Dim overlay for crowd scenes */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundColor: `rgba(0,0,0,${interpolate(Math.max(opCrowdA, opCrowdB), [0, 1], [0, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
				}}
			/>

			{/* S1 — "Ellos: Buscando parking a las 21:00" */}
			<LabelBar text="Ellos" color="#EF4444" opacity={s1Op} />
			<div
				style={{
					position: "absolute",
					bottom: 450,
					left: 50,
					right: 50,
					textAlign: "center",
					opacity: s1Op,
				}}
			>
				<div style={bodyText}>
					Buscando parking a las 21:00
				</div>
			</div>

			{/* S2 — "Tú: Ya llevas dos horas aquí" */}
			<LabelBar text="Tú" color="#4ADE80" opacity={s2Op} />
			<div
				style={{
					position: "absolute",
					bottom: 450,
					left: 50,
					right: 50,
					textAlign: "center",
					opacity: s2Op,
				}}
			>
				<div style={bodyText}>
					Ya llevas dos horas aquí
				</div>
			</div>

			{/* S3 — "Ellos: Peleando por el mismo sitio" */}
			<LabelBar text="Ellos" color="#EF4444" opacity={s3Op} />
			<div
				style={{
					position: "absolute",
					bottom: 450,
					left: 50,
					right: 50,
					textAlign: "center",
					opacity: s3Op,
				}}
			>
				<div style={bodyText}>
					Peleando por el mismo sitio
				</div>
			</div>

			{/* S4 — "Tú: Mirando estrellas" */}
			<LabelBar text="Tú" color="#4ADE80" opacity={s4Op} />
			<div
				style={{
					position: "absolute",
					bottom: 450,
					left: 50,
					right: 50,
					textAlign: "center",
					opacity: s4Op,
				}}
			>
				<div style={bodyText}>
					Mirando estrellas
				</div>
			</div>

			{/* S5 — CTA */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: opCta,
					background:
						"radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 380,
					left: 50,
					right: 50,
					textAlign: "center",
					opacity: ctaTextOp,
				}}
			>
				<div
					style={{
						fontFamily: interFont,
						fontSize: 56,
						fontWeight: 900,
						color: "#FFFFFF",
						lineHeight: 1.3,
						textShadow: "0 3px 20px rgba(0,0,0,0.7)",
					}}
				>
					La ventaja no es la furgo.
					<br />
					<span style={{ color: "#D97706" }}>Es el radar.</span>
				</div>
			</div>
			<div
				style={{
					position: "absolute",
					bottom: 340,
					left: "50%",
					transform: "translateX(-50%)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 20,
					opacity: ctaLogoOp,
				}}
			>
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 150,
						height: 150,
						borderRadius: 34,
						boxShadow: "0 8px 35px rgba(0,0,0,0.5)",
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
		</AbsoluteFill>
	);
};
