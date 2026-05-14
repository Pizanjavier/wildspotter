import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
} from 'remotion';

// --- Premium Assets ---
const MAP_IMAGE = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1080&auto=format&fit=crop'; 

// --- Helper Components ---
const NoiseOverlay = () => (
  <AbsoluteFill
    style={{
      opacity: 0.08,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      pointerEvents: 'none',
      mixBlendMode: 'overlay',
    }}
  />
);

const PremiumCountdown = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Spring animation for entrance pop
  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  // Calculate the countdown value (24H pulsing to 23H smoothly)
  const isTransitioning = frame > fps * 8; // At 8 seconds, it flips to 23
  
  // A subtle pulse effect that beats every second
  const pulse = interpolate(
    Math.sin((frame * Math.PI * 2) / fps),
    [-1, 1],
    [0.98, 1.02]
  );

  return (
    <div
      className="flex flex-col items-center justify-center rounded-[2.5rem] border border-[#D97706]/40 bg-[#0F0D0B]/80 backdrop-blur-xl shadow-2xl"
      style={{ 
        transform: `scale(${pop * pulse}) translateY(${interpolate(pop, [0, 1], [50, 0])}px)`,
        opacity: pop,
        width: 220,
        height: 220,
      }}
    >
      <span className="font-mono text-6xl font-black text-white tracking-tighter drop-shadow-md">
        {isTransitioning ? '23' : '24'}
        <span className="text-3xl text-[#D97706] ml-1">H</span>
      </span>
      <span className="text-[#A0836C] font-sans text-sm tracking-[0.3em] uppercase mt-2 opacity-80">
        Para el acceso
      </span>
    </div>
  );
};

const CinematicText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Smooth cinematic fade up
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const yOffset = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      className="text-center px-10 relative"
      style={{ 
        opacity,
        transform: `translateY(${yOffset}px)`
      }}
    >
      <h2 className="text-[2.75rem] font-bold text-white leading-[1.1] font-sans tracking-tight">
        {text.split('...')[0]}
        <span className="text-[#D97706]">...</span>
      </h2>
    </div>
  );
};

// --- Main Component ---
export const StoryAnticipationMay10: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const TOTAL_DURATION = 15 * fps; 

  return (
    <AbsoluteFill className="bg-[#0F0D0B] overflow-hidden font-sans">
      {/* Background Map - Cinematic Drift */}
      <AbsoluteFill>
        <Img
          src={MAP_IMAGE}
          className="w-full h-full object-cover"
          style={{
            filter: 'grayscale(60%) brightness(0.3) contrast(1.2)',
            transform: `scale(${interpolate(frame, [0, TOTAL_DURATION], [1.05, 1.15])}) rotate(${interpolate(frame, [0, TOTAL_DURATION], [0, 1])}deg)`,
            transformOrigin: 'center center',
          }}
        />
        {/* Vignette & Gradient Overlay */}
        <AbsoluteFill className="bg-gradient-to-t from-[#0F0D0B] via-[#0F0D0B]/60 to-[#0F0D0B]/30" />
      </AbsoluteFill>

      <NoiseOverlay />

      {/* Content Container */}
      <AbsoluteFill className="flex flex-col items-center justify-center px-6">
        
        {/* Top Accent Line */}
        <div 
          className="w-24 h-1 bg-[#D97706] mb-12 rounded-full shadow-[0_0_15px_#D97706]"
          style={{ 
            transform: `scaleX(${spring({ frame, fps, config: { damping: 12 } })})`,
            opacity: interpolate(frame, [0, 15], [0, 1])
          }}
        />

        {/* Main Headline */}
        <CinematicText 
          text="Mañana revelamos un spot para cuando te quedas sin sitio de noche..." 
          delay={15} 
        />

        {/* Score Badge */}
        <Sequence from={40}>
          <div 
            className="mt-10 px-6 py-2.5 rounded-full border border-[#D97706]/30 bg-[#1A1614]/90 flex items-center gap-3 backdrop-blur-sm shadow-xl"
            style={{
              opacity: spring({ frame: frame - 40, fps }),
              transform: `translateY(${interpolate(spring({ frame: frame - 40, fps }), [0, 1], [20, 0])}px)`,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#D97706] shadow-[0_0_8px_#D97706] animate-pulse" />
            <span className="font-mono text-[#D97706] font-semibold text-lg tracking-widest uppercase">
              Score Asegurado: 80+
            </span>
          </div>
        </Sequence>

        {/* Countdown Visual */}
        <div className="mt-16">
          <PremiumCountdown delay={70} />
        </div>

        {/* Bottom Logo Area */}
        <AbsoluteFill className="flex flex-col items-center justify-end pb-16">
          <div 
            className="flex flex-col items-center gap-1"
            style={{ opacity: spring({ frame: frame - 90, fps, config: { damping: 20 } }) }}
          >
            <span className="text-white/90 font-black text-xl tracking-[0.2em] uppercase drop-shadow-md">
              WildSpotter
            </span>
            <span className="text-[#D97706] text-xs font-mono tracking-wider">
              DATA DRIVEN EXPLORATION
            </span>
          </div>
        </AbsoluteFill>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
