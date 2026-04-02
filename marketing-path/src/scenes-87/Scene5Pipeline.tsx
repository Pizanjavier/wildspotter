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
  weights: ["600", "700", "900"],
  subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

type PipelineStage = {
  label: string;
  color: string;
  delay: number;
};

const STAGES: PipelineStage[] = [
  { label: "Radar", color: "#D97706", delay: 12 },
  { label: "Terreno", color: "#FBBF24", delay: 28 },
  { label: "Satélite", color: "#22D3EE", delay: 44 },
  { label: "Legal", color: "#EF4444", delay: 60 },
  { label: "Contexto", color: "#4ADE80", delay: 76 },
];

// Large pipeline card — just the name, a colored bar, and a check
const StageCard: React.FC<{ stage: PipelineStage; index: number }> = ({
  stage,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({
    frame,
    fps,
    delay: stage.delay,
    config: { damping: 16, stiffness: 150 },
  });

  const tx = interpolate(cardIn, [0, 1], [1080, 0]);
  const opacity = interpolate(cardIn, [0, 0.25], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fillIn = spring({
    frame,
    fps,
    delay: stage.delay + 12,
    config: { damping: 28, stiffness: 70 },
  });

  return (
    <div
      style={{
        transform: `translateX(${tx}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 24,
        marginBottom: 18,
        padding: "22px 32px",
        background:
          "linear-gradient(135deg, rgba(30,26,22,0.95) 0%, rgba(26,22,18,0.9) 100%)",
        borderRadius: 24,
        border: `1.5px solid ${stage.color}30`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Step number */}
      <div
        style={{
          fontFamily: jetbrainsFont,
          fontSize: 32,
          fontWeight: 700,
          color: stage.color,
          width: 40,
          textAlign: "center",
          flexShrink: 0,
          opacity: 0.6,
        }}
      >
        {index + 1}
      </div>

      {/* Colored bar + label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: interFont,
            fontSize: 42,
            fontWeight: 700,
            color: "#F5EFE8",
            letterSpacing: -0.5,
          }}
        >
          {stage.label}
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 10,
            height: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${fillIn * 100}%`,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${stage.color}, ${stage.color}80)`,
              boxShadow: `0 0 12px ${stage.color}40`,
            }}
          />
        </div>
      </div>

      {/* Check mark */}
      <div
        style={{
          opacity: fillIn > 0.9 ? 1 : 0,
          color: stage.color,
          fontSize: 30,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        ✓
      </div>
    </div>
  );
};

export const Scene5Pipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Score appears after all pipeline stages complete
  const scoreDelay = 100;
  const scoreIn = spring({
    frame,
    fps,
    delay: scoreDelay,
    config: { damping: 12, stiffness: 110 },
  });

  const displayScore = Math.floor(
    interpolate(frame, [scoreDelay + 5, scoreDelay + 30], [0, 92], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Score ring
  const ringProgress = interpolate(
    frame,
    [scoreDelay, scoreDelay + 38],
    [0, 0.92],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const RING_R = 70;
  const RING_C = 2 * Math.PI * RING_R;
  const strokeDashoffset = RING_C * (1 - ringProgress);

  // Title
  const titleIn = spring({
    frame,
    fps,
    delay: 0,
    config: { damping: 200 },
  });

  // Bottom tagline — appears right after score, with enough reading time
  const taglineIn = spring({
    frame,
    fps,
    delay: 105,
    config: { damping: 200 },
  });

  const videoZoom = interpolate(frame, [0, 185], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
      {/* Video background — coffee camping, very subtle */}
      <div
        style={{
          position: "absolute",
          inset: -15,
          transform: `scale(${videoZoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Video
          src={staticFile("videos/coffee_camping.mp4")}
          muted
          style={{
            width: "calc(100% + 30px)",
            height: "calc(100% + 30px)",
            objectFit: "cover",
            opacity: 0.1,
          }}
        />
      </div>

      {/* Subtle grid */}
      <svg
        style={{ position: "absolute", inset: 0, opacity: 0.02 }}
        width={1080}
        height={1920}
      >
        {Array.from({ length: 30 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * 70}
            x2={1080}
            y2={i * 70}
            stroke="#D97706"
            strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 70}
            y1={0}
            x2={i * 70}
            y2={1920}
            stroke="#D97706"
            strokeWidth={0.5}
          />
        ))}
      </svg>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 50,
          right: 50,
          textAlign: "center",
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 68,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: -3,
            lineHeight: 1.15,
          }}
        >
          Cada spot, analizado
          <br />
          por{" "}
          <span style={{ color: "#D97706" }}>6 capas</span>
        </div>
      </div>

      {/* Pipeline cards */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 40,
          right: 40,
        }}
      >
        {STAGES.map((stage, i) => (
          <StageCard key={stage.label} stage={stage} index={i} />
        ))}
      </div>

      {/* Score result */}
      <div
        style={{
          position: "absolute",
          top: 1100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 36,
          opacity: scoreIn,
          transform: `scale(${interpolate(scoreIn, [0, 1], [0.65, 1])})`,
        }}
      >
        {/* Score ring */}
        <div style={{ position: "relative", width: 170, height: 170 }}>
          <svg
            width={170}
            height={170}
            viewBox="0 0 170 170"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={85}
              cy={85}
              r={RING_R}
              fill="none"
              stroke="rgba(74,222,128,0.1)"
              strokeWidth={7}
            />
            <circle
              cx={85}
              cy={85}
              r={RING_R}
              fill="none"
              stroke="#4ADE80"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: jetbrainsFont,
                fontSize: 68,
                fontWeight: 700,
                color: "#4ADE80",
                textShadow: "0 0 30px rgba(74,222,128,0.25)",
              }}
            >
              {displayScore}
            </span>
          </div>
        </div>

        {/* Score label */}
        <div>
          <div
            style={{
              fontFamily: interFont,
              fontSize: 38,
              fontWeight: 700,
              color: "#F5EFE8",
            }}
          >
            Playa de Calblanque
          </div>
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 22,
              color: "#A0836C",
              marginTop: 8,
              letterSpacing: 2,
            }}
          >
            SCORE COMPUESTO
          </div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: taglineIn,
          transform: `translateY(${interpolate(taglineIn, [0, 1], [12, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 52,
            fontWeight: 700,
            color: "#D97706",
            letterSpacing: -1,
            textShadow: "0 0 35px rgba(217,119,6,0.2)",
          }}
        >
          Datos reales. Resultados reales.
        </div>
      </div>

      {/* Edge vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 45%, rgba(10,8,7,0.5) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
