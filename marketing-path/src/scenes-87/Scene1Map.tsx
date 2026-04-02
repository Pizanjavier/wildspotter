import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: interFont } = loadInter("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

// Spot dot positions along the Murcia coastline
const COAST_SPOTS = [
  { x: 820, y: 120, d: 8 },
  { x: 790, y: 185, d: 10 },
  { x: 830, y: 230, d: 13 },
  { x: 860, y: 160, d: 15 },
  { x: 800, y: 280, d: 17 },
  { x: 835, y: 310, d: 19 },
  { x: 770, y: 340, d: 21 },
  { x: 810, y: 380, d: 23 },
  { x: 750, y: 420, d: 25 },
  { x: 720, y: 460, d: 27 },
  { x: 680, y: 500, d: 29 },
  { x: 650, y: 540, d: 31 },
  { x: 610, y: 580, d: 33 },
  { x: 690, y: 510, d: 35 },
  { x: 730, y: 440, d: 37 },
  { x: 560, y: 640, d: 39 },
  { x: 500, y: 680, d: 41 },
  { x: 440, y: 720, d: 43 },
  { x: 480, y: 750, d: 45 },
  { x: 540, y: 700, d: 47 },
  { x: 400, y: 770, d: 49 },
  { x: 600, y: 350, d: 51 },
  { x: 520, y: 420, d: 53 },
  { x: 450, y: 500, d: 55 },
  { x: 380, y: 600, d: 57 },
  { x: 700, y: 300, d: 59 },
  { x: 660, y: 380, d: 61 },
  { x: 550, y: 480, d: 63 },
  { x: 350, y: 650, d: 65 },
  { x: 300, y: 720, d: 67 },
];

const SpotDot: React.FC<{ x: number; y: number; delay: number }> = ({
  x,
  y,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame,
    fps,
    delay,
    config: { damping: 8, stiffness: 220 },
  });

  if (appear < 0.01) return null;

  const pulse = Math.sin((frame - delay) * 0.15) * 0.3 + 1;
  const glowSize = 6 + pulse * 4;

  return (
    <g transform={`translate(${x}, ${y}) scale(${appear})`}>
      <circle r={glowSize} fill="none" stroke="rgba(217,119,6,0.25)" strokeWidth={1.5} />
      <circle r={14} fill="rgba(217,119,6,0.08)" />
      <circle r={4.5} fill="#D97706" />
      <circle r={2} fill="#FBBF24" opacity={0.8} />
    </g>
  );
};

const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [5, 80], [-50, 1970], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < 5 || frame > 80) return null;
  return (
    <line x1={0} y1={y} x2={1080} y2={y} stroke="rgba(217,119,6,0.15)" strokeWidth={2} />
  );
};

export const Scene1Map: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 130], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  // Animated counter 0→87 — drives the main number display
  const counterTarget = 87;
  const counterValue = Math.min(
    counterTarget,
    Math.floor(
      interpolate(frame, [5, 75], [0, counterTarget], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );

  const titleIn = spring({ frame, fps, delay: 0, config: { damping: 200 } });
  const subtitleIn = spring({ frame, fps, delay: 12, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0A0A0A" }}>
      {/* Dark map with Ken Burns zoom */}
      <div
        style={{
          position: "absolute",
          inset: -50,
          transform: `scale(${zoom})`,
          transformOrigin: "55% 45%",
        }}
      >
        <Img
          src={staticFile("images/map-murcia-dark.jpg")}
          style={{
            width: "calc(100% + 100px)",
            height: "calc(100% + 100px)",
            objectFit: "cover",
            opacity: 0.75,
          }}
        />
      </div>

      {/* Amber coast glow */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "-10%",
          width: "60%",
          height: "70%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(217,119,6,0.06) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* SVG overlay */}
      <svg
        style={{ position: "absolute", inset: 0 }}
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
      >
        <ScanLine />
        {COAST_SPOTS.map((spot, i) => (
          <SpotDot key={i} x={spot.x} y={spot.y} delay={spot.d} />
        ))}
      </svg>

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 550,
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.5) 55%, transparent 100%)",
        }}
      />

      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 400,
          background: "linear-gradient(0deg, rgba(10,10,10,0.9) 0%, transparent 100%)",
        }}
      />

      {/* Main number — animated counter in amber, the hero element */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 65,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 160,
            fontWeight: 700,
            color: "#D97706",
            lineHeight: 1,
            letterSpacing: -4,
            textShadow: "0 0 60px rgba(217,119,6,0.35), 0 4px 40px rgba(0,0,0,0.9)",
          }}
        >
          {counterValue}
        </div>
      </div>

      {/* "spots" label below the number */}
      <div
        style={{
          position: "absolute",
          top: 290,
          left: 65,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 82,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1,
            letterSpacing: -2,
            textShadow: "0 4px 40px rgba(0,0,0,0.9)",
          }}
        >
          spots
        </div>
      </div>

      {/* "en esta zona." */}
      <div
        style={{
          position: "absolute",
          top: 385,
          left: 65,
          opacity: subtitleIn,
          transform: `translateY(${interpolate(subtitleIn, [0, 1], [25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 48,
            fontWeight: 700,
            color: "#A0836C",
            letterSpacing: -1,
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          en esta zona.
        </div>
      </div>

      {/* Bottom geo label */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [60, 80], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 22,
            color: "#7A6050",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Costa Calida &middot; Murcia
        </div>
      </div>
    </AbsoluteFill>
  );
};
