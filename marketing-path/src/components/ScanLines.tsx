import { useCurrentFrame } from "remotion";

type ScanLinesProps = {
	opacity?: number;
	/** If provided, lines drift vertically — adds subtle motion */
	animated?: boolean;
	color?: string;
};

/**
 * CRT-style scan line overlay. Pure CSS — no animation classes.
 * The `animated` prop slowly scrolls the lines downward via inline style.
 */
export const ScanLines: React.FC<ScanLinesProps> = ({
	opacity = 0.08,
	animated = true,
	color = "rgba(0,0,0,1)",
}) => {
	const frame = useCurrentFrame();

	// Drift: cycle every 120 frames (4 seconds), offset in px
	const offset = animated ? (frame % 120) * (4 / 120) : 0;

	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				pointerEvents: "none",
				zIndex: 50,
				opacity,
				backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          ${color} 3px,
          ${color} 4px
        )`,
				backgroundPositionY: `${offset}px`,
			}}
		/>
	);
};
