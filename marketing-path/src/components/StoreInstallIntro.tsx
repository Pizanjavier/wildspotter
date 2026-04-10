import {
	AbsoluteFill,
	Easing,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: interFont } = loadInter("normal", {
	weights: ["400", "600", "700"],
	subsets: ["latin"],
});

/** Duration of the store intro scene in frames (3.5s @ 30fps) */
export const STORE_INTRO_FRAMES = 105;

/**
 * Simulated app store install screen.
 * Recognizable as "app store" but intentionally generic (no Apple/Google branding).
 */
export const StoreInstallIntro: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// --- Card entrance ---
	const cardIn = spring({ frame, fps, delay: 2, config: { damping: 16, stiffness: 120 } });
	const cardY = interpolate(cardIn, [0, 1], [80, 0]);

	// --- Button states ---
	// Phase 1: "OBTENER" visible (frame 0-25)
	// Phase 2: Touch indicator + press (frame 25-32)
	// Phase 3: Progress ring (frame 32-68)
	// Phase 4: "ABRIR" button (frame 68-82)
	// Phase 5: Touch + press ABRIR (frame 82-88)
	// Phase 6: Icon zoom + flash (frame 88-105)

	const touchIn = interpolate(frame, [20, 25], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const press1 = frame >= 27 && frame < 32
		? interpolate(frame, [27, 29, 32], [1, 0.92, 1], { extrapolateRight: "clamp" })
		: 1;

	const isProgress = frame >= 32 && frame < 68;
	const progress = interpolate(frame, [32, 66], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	const isAbrir = frame >= 68 && frame < 88;
	const abrirIn = interpolate(frame, [68, 74], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const touch2In = interpolate(frame, [78, 82], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const press2 = frame >= 84 && frame < 88
		? interpolate(frame, [84, 86, 88], [1, 0.92, 1], { extrapolateRight: "clamp" })
		: 1;

	// --- Exit: icon zoom + flash ---
	const isExit = frame >= 88;
	const exitProgress = interpolate(frame, [88, 105], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.in(Easing.cubic),
	});
	const exitScale = interpolate(exitProgress, [0, 1], [1, 12]);
	const flashOpacity = interpolate(frame, [96, 105], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const cardFadeOut = interpolate(frame, [88, 96], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Button content
	const renderButton = () => {
		if (isProgress) {
			const r = 16;
			const circ = 2 * Math.PI * r;
			return (
				<div style={{ width: 44, height: 44, position: "relative" }}>
					<svg width={44} height={44} viewBox="0 0 44 44">
						<circle cx={22} cy={22} r={r} fill="none" stroke="rgba(217,119,6,0.2)" strokeWidth={4} />
						<circle
							cx={22} cy={22} r={r} fill="none"
							stroke="#D97706" strokeWidth={4} strokeLinecap="round"
							strokeDasharray={circ}
							strokeDashoffset={circ * (1 - progress)}
							transform="rotate(-90 22 22)"
						/>
					</svg>
				</div>
			);
		}
		if (isAbrir) {
			return (
				<div style={{
					padding: "12px 40px",
					background: "#D97706",
					borderRadius: 22,
					fontFamily: interFont,
					fontSize: 28,
					fontWeight: 700,
					color: "#FFFFFF",
					letterSpacing: 1,
					opacity: abrirIn,
					transform: `scale(${press2})`,
				}}>
					ABRIR
				</div>
			);
		}
		return (
			<div style={{
				padding: "12px 40px",
				background: "rgba(217,119,6,0.15)",
				border: "2px solid #D97706",
				borderRadius: 22,
				fontFamily: interFont,
				fontSize: 28,
				fontWeight: 700,
				color: "#D97706",
				letterSpacing: 1,
				transform: `scale(${press1})`,
			}}>
				OBTENER
			</div>
		);
	};

	return (
		<AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
			{/* Subtle radial glow */}
			<div style={{
				position: "absolute",
				top: "35%", left: "50%",
				transform: "translate(-50%, -50%)",
				width: 800, height: 800, borderRadius: "50%",
				background: "radial-gradient(circle, rgba(217,119,6,0.06) 0%, transparent 60%)",
				filter: "blur(40px)",
			}} />

			{/* Store card */}
			<div style={{
				position: "absolute",
				top: "50%", left: "50%",
				transform: `translate(-50%, -50%) translateY(${cardY}px)`,
				opacity: cardIn * cardFadeOut,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 32,
				width: 700,
			}}>
				{/* App icon */}
				<Img
					src={staticFile("images/app-logo.png")}
					style={{
						width: 200, height: 200,
						borderRadius: 44,
						boxShadow: "0 12px 60px rgba(180,80,10,0.45)",
					}}
				/>

				{/* App name */}
				<div style={{
					fontFamily: interFont,
					fontSize: 52, fontWeight: 700,
					color: "#FFFFFF", letterSpacing: 1,
					textShadow: "0 2px 12px rgba(0,0,0,0.5)",
				}}>
					WildSpotter
				</div>

				{/* Category + rating row */}
				<div style={{
					display: "flex", alignItems: "center", gap: 24,
					fontFamily: interFont, fontSize: 26, color: "#A0836C",
				}}>
					<span>Viajes</span>
					<span style={{ color: "rgba(160,131,108,0.3)" }}>|</span>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} style={{
								width: 18, height: 18,
								background: i <= 4 ? "#D97706" : "rgba(217,119,6,0.3)",
								clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
							}} />
						))}
						<span style={{ marginLeft: 4, color: "#A0836C" }}>4.9</span>
					</div>
				</div>

				{/* Install button */}
				<div style={{ marginTop: 16, position: "relative" }}>
					{renderButton()}

					{/* Touch indicator */}
					{((touchIn > 0 && frame < 32) || (touch2In > 0 && frame < 88)) && (
						<div style={{
							position: "absolute",
							top: "50%", left: "50%",
							transform: "translate(-50%, -50%)",
							width: 60, height: 60, borderRadius: "50%",
							background: "rgba(255,255,255,0.15)",
							border: "2px solid rgba(255,255,255,0.25)",
							opacity: frame < 32 ? touchIn : touch2In,
						}} />
					)}
				</div>

				{/* Tagline */}
				<div style={{
					fontFamily: interFont,
					fontSize: 24, fontWeight: 400,
					color: "rgba(160,131,108,0.6)",
					letterSpacing: 1,
					marginTop: 8,
				}}>
					Tu radar de spots salvajes
				</div>
			</div>

			{/* Exit: icon zooms to fill + flash */}
			{isExit && (
				<>
					<div style={{
						position: "absolute",
						top: "50%", left: "50%",
						transform: `translate(-50%, -60%) scale(${exitScale})`,
						opacity: interpolate(exitProgress, [0, 0.6, 1], [1, 1, 0], { extrapolateRight: "clamp" }),
					}}>
						<Img
							src={staticFile("images/app-logo.png")}
							style={{ width: 200, height: 200, borderRadius: 44 }}
						/>
					</div>
					<div style={{
						position: "absolute", inset: 0,
						background: "#0F0D0B",
						opacity: flashOpacity,
					}} />
				</>
			)}
		</AbsoluteFill>
	);
};
