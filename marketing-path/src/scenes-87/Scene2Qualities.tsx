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
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: interFont } = loadInter("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

// Animated amber underline sweep
const AmberUnderline: React.FC<{ delay: number; width: number }> = ({
  delay,
  width,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sweep = spring({
    frame,
    fps,
    delay: delay + 10,
    config: { damping: 28, stiffness: 100 },
  });
  return (
    <div
      style={{
        height: 6,
        width: interpolate(sweep, [0, 1], [0, width]),
        borderRadius: 3,
        background:
          "linear-gradient(90deg, #D97706 0%, #FBBF24 60%, rgba(251,191,36,0.15) 100%)",
        marginTop: 10,
        boxShadow: "0 0 20px rgba(217,119,6,0.3)",
      }}
    />
  );
};

// Single quality line — just a colored bar accent + big word, no icons
const QualityLine: React.FC<{
  text: string;
  delay: number;
  underlineWidth: number;
  accentColor: string;
}> = ({ text, delay, underlineWidth, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineIn = spring({
    frame,
    fps,
    delay,
    config: { damping: 16, stiffness: 130 },
  });

  const y = interpolate(lineIn, [0, 1], [60, 0]);
  const opacity = interpolate(lineIn, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        marginBottom: 50,
        display: "flex",
        alignItems: "flex-start",
        gap: 28,
      }}
    >
      {/* Colored vertical bar accent */}
      <div
        style={{
          width: 6,
          height: 90,
          borderRadius: 3,
          background: accentColor,
          boxShadow: `0 0 16px ${accentColor}40`,
          flexShrink: 0,
          marginTop: 8,
        }}
      />

      <div>
        <div
          style={{
            fontFamily: interFont,
            fontSize: 92,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: -3,
            lineHeight: 1,
            textShadow: "0 2px 24px rgba(0,0,0,0.5)",
          }}
        >
          {text}
        </div>
        <AmberUnderline delay={delay} width={underlineWidth} />
      </div>
    </div>
  );
};

export const Scene2Qualities: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerIn = spring({
    frame,
    fps,
    delay: 0,
    config: { damping: 200 },
  });

  // Ambient particles
  const particles = Array.from({ length: 6 }, (_, i) => ({
    x: 100 + ((i * 157) % 880),
    y: 400 + ((i * 211) % 1000),
    size: 1.5 + (i % 3) * 1.5,
    phase: i * 1.7,
  }));

  const videoZoom = interpolate(frame, [0, 140], [1.0, 1.1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
      {/* Video background — mountains for "con vistas al mar" */}
      <div
        style={{
          position: "absolute",
          inset: -20,
          transform: `scale(${videoZoom})`,
          transformOrigin: "50% 40%",
        }}
      >
        <Video
          src={staticFile("videos/drone_mountains.mp4")}
          muted
          style={{
            width: "calc(100% + 40px)",
            height: "calc(100% + 40px)",
            objectFit: "cover",
            opacity: 0.2,
          }}
        />
      </div>

      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(217,119,6,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => {
        const flickerOpacity = interpolate(
          Math.sin(frame * 0.04 + p.phase),
          [-1, 1],
          [0.04, 0.25]
        );
        const floatY = Math.sin(frame * 0.025 + p.phase) * 8;
        return (
          <div
            key={`p-${p.phase.toFixed(1)}`}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y + floatY,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "#D97706",
              opacity: flickerOpacity,
              boxShadow: `0 0 ${p.size * 4}px rgba(217,119,6,0.3)`,
            }}
          />
        );
      })}

      {/* Content — vertically centered */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 70,
          right: 70,
          transform: "translateY(-55%)",
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerIn,
            transform: `translateY(${interpolate(headerIn, [0, 1], [15, 0])}px)`,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 28,
              fontWeight: 700,
              color: "#D97706",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            87 spots que son
          </div>
        </div>

        {/* Three quality words — clean, no icons */}
        <QualityLine
          text="Planos."
          delay={8}
          underlineWidth={340}
          accentColor="#FBBF24"
        />
        <QualityLine
          text="Legales."
          delay={28}
          underlineWidth={400}
          accentColor="#4ADE80"
        />
        <QualityLine
          text="Con vistas al mar."
          delay={48}
          underlineWidth={780}
          accentColor="#22D3EE"
        />
      </div>

      {/* Edge vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(10,8,7,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
