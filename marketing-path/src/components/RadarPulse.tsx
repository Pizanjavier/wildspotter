import { interpolate, useCurrentFrame } from "remotion";

type ScanPulseProps = {
	ringCount?: number;
	color?: string;
	maxRadius?: number;
	period?: number;
	baseOpacity?: number;
	style?: React.CSSProperties;
};

export const ScanPulse: React.FC<ScanPulseProps> = ({
	ringCount = 3,
	color = "#D97706",
	maxRadius = 700,
	period = 55,
	baseOpacity = 0.5,
	style,
}) => {
	const frame = useCurrentFrame();

	const rings = Array.from({ length: ringCount }, (_, i) => {
		const offset = (i * period) / ringCount;
		const localFrame = (frame + offset) % period;
		const progress = localFrame / period;
		const radius = interpolate(progress, [0, 1], [0, maxRadius / 2]);
		const opacity = interpolate(progress, [0, 0.2, 1], [0, baseOpacity, 0]);
		return { radius, opacity, key: i };
	});

	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				pointerEvents: "none",
				...style,
			}}
		>
			{rings.map(({ radius, opacity, key }) => (
				<div
					key={key}
					style={{
						position: "absolute",
						width: radius * 2,
						height: radius * 2,
						borderRadius: "50%",
						border: `2px solid ${color}`,
						opacity,
						boxShadow: `0 0 20px ${color}44`,
					}}
				/>
			))}
			<div
				style={{
					position: "absolute",
					width: 16,
					height: 16,
					borderRadius: "50%",
					background: color,
					boxShadow: `0 0 24px 6px ${color}88`,
					opacity: 0.8,
				}}
			/>
		</div>
	);
};
