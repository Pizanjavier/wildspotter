import { useCurrentFrame, interpolate } from "remotion";

const GLITCH_CHARS = "!@#$%^&*<>?|{}[]0123456789ABCDEFX";

type GlitchTextProps = {
	text: string;
	/** Frame (local, within Sequence) when the decrypt animation begins */
	startFrame?: number;
	/** How many frames the decrypt phase lasts before settling */
	decryptDuration?: number;
	style?: React.CSSProperties;
	/** RGB channel offset amount in px (default 3) */
	rgbOffset?: number;
	/** How many frames the RGB offset lasts after reveal (default 10) */
	rgbDuration?: number;
};

/**
 * Text that "decrypts" from random characters to the final value.
 * Uses deterministic randomness so rendering is frame-accurate.
 */
export const GlitchText: React.FC<GlitchTextProps> = ({
	text,
	startFrame = 0,
	decryptDuration = 20,
	style,
	rgbOffset = 3,
	rgbDuration = 10,
}) => {
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;

	// Before animation starts: show nothing (opacity 0)
	const baseOpacity = interpolate(localFrame, [-1, 0], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Generate scrambled text: each character settles left-to-right
	const displayText = text
		.split("")
		.map((char, i) => {
			if (char === " ") return " ";
			// This character's settle frame: stagger across decryptDuration
			const settleAt = startFrame + Math.round((i / text.length) * decryptDuration);
			if (frame >= settleAt) return char;
			// Still scrambling: deterministic random based on frame + position
			const seed = (frame * 31 + i * 17) % GLITCH_CHARS.length;
			return GLITCH_CHARS[seed];
		})
		.join("");

	// RGB channel offset — brief chromatic aberration right after reveal
	const rgbProgress = interpolate(
		localFrame,
		[decryptDuration, decryptDuration + rgbDuration],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);
	const offset = rgbOffset * rgbProgress;

	if (localFrame < 0) return null;

	return (
		<span style={{ position: "relative", display: "inline-block", ...style, opacity: baseOpacity }}>
			{/* Red channel — offset left */}
			{offset > 0.5 && (
				<span
					style={{
						position: "absolute",
						inset: 0,
						color: "rgba(255,0,0,0.6)",
						transform: `translateX(${-offset}px)`,
						pointerEvents: "none",
					}}
				>
					{displayText}
				</span>
			)}
			{/* Blue channel — offset right */}
			{offset > 0.5 && (
				<span
					style={{
						position: "absolute",
						inset: 0,
						color: "rgba(0,200,255,0.6)",
						transform: `translateX(${offset}px)`,
						pointerEvents: "none",
					}}
				>
					{displayText}
				</span>
			)}
			{/* Main channel */}
			<span style={{ position: "relative" }}>{displayText}</span>
		</span>
	);
};
