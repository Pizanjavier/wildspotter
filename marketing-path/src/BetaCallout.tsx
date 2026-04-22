import React from "react";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, Img, staticFile } from "remotion";

export const BETA_CALLOUT_FRAMES = 180; // 6 seconds

export const BetaCallout: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Animations
	const hookIn = spring({
		frame,
		fps,
		config: { damping: 12 },
		durationInFrames: 15,
	});

	const secondaryIn = spring({
		frame: frame - 45,
		fps,
		config: { damping: 12 },
	});

	const buttonIn = spring({
		frame: frame - 90,
		fps,
		config: { damping: 12 },
	});

	return (
		<AbsoluteFill className="bg-[#0F0D0B] flex flex-col items-center justify-center font-sans overflow-hidden">
			{/* Stylish Background Image */}
			<AbsoluteFill>
				<Img 
					src={staticFile("images/map-spain-dark.jpg")} 
					style={{ 
						width: '100%', 
						height: '100%', 
						objectFit: 'cover', 
						opacity: 0.3,
						transform: `scale(${1 + frame * 0.001})` // Subtle slow zoom
					}} 
				/>
				{/* Dark gradient overlay to ensure text legibility */}
				<AbsoluteFill className="bg-gradient-to-t from-[#0F0D0B] via-[#0F0D0B]/70 to-[#0F0D0B]/30" />
			</AbsoluteFill>

			<AbsoluteFill className="p-12 flex flex-col items-center justify-center text-center">
				{/* Top Hook */}
				<div 
					className="text-[#E8D9BF] text-6xl font-black uppercase tracking-tight leading-[1.1] mb-8 drop-shadow-2xl"
					style={{
						opacity: hookIn,
						transform: `translateY(${(1 - hookIn) * 50}px)`,
					}}
				>
					Buscamos 20 <br/>
					<span className="text-[#849a62]">testers de Android</span><br/>
					para WildSpotter
				</div>

				{/* Cta Hook */}
				<div
					className="text-[#B7A089] text-4xl font-medium leading-relaxed max-w-[800px] mb-12"
					style={{
						opacity: secondaryIn,
						transform: `translateY(${(1 - secondaryIn) * 30}px)`,
					}}
				>
					Mantenla instalada 14 días y llévate una licencia <strong className="text-white">Premium de por vida</strong>.
				</div>

				{/* Call to action element */}
				<div
					className="bg-[#2F6B4A] text-white px-12 py-6 rounded-3xl text-5xl font-bold uppercase tracking-widest shadow-[0_20px_40px_rgba(47,107,74,0.4)]"
					style={{
						opacity: buttonIn,
						transform: `scale(${buttonIn})`,
					}}
				>
					Comenta "BETA"
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
