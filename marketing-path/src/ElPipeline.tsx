import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import { StoreInstallIntro, STORE_INTRO_FRAMES } from "./components/StoreInstallIntro";

const { fontFamily: interFont } = loadInter("normal", {
  weights: ["400", "600", "700", "900"],
  subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

// Base: 836 frames ≈ 27.9s @ 30fps
// With intro: 836 + 105 = 941 frames ≈ 31.4s

export type ElPipelineProps = {
  hookVariant: "D1" | "D2" | "D3";
  withIntro: boolean;
  musicTrack: "sci-fi-score" | "voxscape";
};
const WARM_BG = "#0F0D0B";
const AMBER = "#D97706";
const AMBER_SOFT = "#A0836C";
const GREEN = "#4ADE80";
const RED = "#DC2626";

// ---------- Shared pipeline chrome (progress bar + stage index) ----------
type ChromeProps = {
  stageIndex: number; // 0..6  (0 = hook, 1..5 = stages, 6 = payoff)
  stageLabel?: string;
};

const PipelineChrome: React.FC<ChromeProps> = ({ stageIndex, stageLabel }) => {
  const frame = useCurrentFrame();

  // Progress bar fill target (global progress across the 6 pipeline beats, stage 0 = 0, stage 6 = 1)
  const progress = stageIndex / 6;
  const fill = interpolate(frame, [0, 30], [progress - 1 / 6, progress], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const clampedFill = Math.max(0, Math.min(1, fill));

  return (
    <>
      {/* Stage number top-left */}
      {stageLabel && (
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 70,
            display: "flex",
            alignItems: "baseline",
            gap: 18,
          }}
        >
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 28,
              fontWeight: 400,
              color: AMBER_SOFT,
              letterSpacing: 4,
            }}
          >
            PASO
          </div>
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 56,
              fontWeight: 700,
              color: AMBER,
              letterSpacing: 2,
              textShadow: "0 2px 20px rgba(217,119,6,0.5)",
            }}
          >
            0{stageIndex}
            <span style={{ color: AMBER_SOFT, opacity: 0.5 }}> / 05</span>
          </div>
        </div>
      )}

      {/* Progress bar bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 70,
          right: 70,
          height: 6,
          background: "rgba(160,131,108,0.18)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${clampedFill * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${AMBER}, #FBBF24)`,
            borderRadius: 3,
            boxShadow: `0 0 20px rgba(217,119,6,0.6)`,
          }}
        />
      </div>

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 70,
          right: 70,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const active = stageIndex >= i;
          return (
            <div
              key={i}
              style={{
                fontFamily: jetbrainsFont,
                fontSize: 20,
                fontWeight: 700,
                color: active ? AMBER : "rgba(160,131,108,0.35)",
                letterSpacing: 2,
              }}
            >
              0{i}
            </div>
          );
        })}
      </div>
    </>
  );
};

// ---------- Background video helper ----------
type BgProps = {
  src: string;
  dim: number; // 0..1 — dark overlay strength
  zoomFrom?: number;
  zoomTo?: number;
  zoomDuration?: number;
};

const Bg: React.FC<BgProps> = ({
  src,
  dim,
  zoomFrom = 1.0,
  zoomTo = 1.08,
  zoomDuration = 70,
}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, zoomDuration], [zoomFrom, zoomTo], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 45%",
        }}
      >
        <Video
          src={staticFile(src)}
          muted
          loop
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(15,13,11,${dim})`,
        }}
      />
    </>
  );
};

// ---------- S1 HOOK variants ----------
// D2: "6 capas. 0 opiniones humanas."
const Scene1HookD2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, delay: 4, config: { damping: 200 } });
  const subIn = spring({ frame, fps, delay: 22, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg src="videos/ai_Campervan_Sunset_Time_Lapse_Video.mp4" dim={0.55} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 600, background: "linear-gradient(180deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.4) 60%, transparent 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 500, background: "linear-gradient(0deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.4) 60%, transparent 100%)" }} />
      <div style={{ position: "absolute", top: "28%", left: 70, right: 70, opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)` }}>
        <div style={{ fontFamily: jetbrainsFont, fontSize: 120, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.0, letterSpacing: -2, textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}>
          6 <span style={{ color: AMBER }}>capas</span>.
        </div>
        <div style={{ fontFamily: jetbrainsFont, fontSize: 120, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.0, letterSpacing: -2, textShadow: "0 4px 30px rgba(0,0,0,0.9)", marginTop: 10 }}>
          0 <span style={{ color: AMBER_SOFT }}>opiniones</span>.
        </div>
      </div>
      <div style={{ position: "absolute", top: "68%", left: 70, right: 70, opacity: subIn, transform: `translateY(${interpolate(subIn, [0, 1], [20, 0])}px)`, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 6, height: 56, background: AMBER, boxShadow: `0 0 16px ${AMBER}` }} />
        <div style={{ fontFamily: jetbrainsFont, fontSize: 34, fontWeight: 700, color: AMBER_SOFT, letterSpacing: 3, textTransform: "uppercase" as const, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
          Así funciona WildSpotter
        </div>
      </div>
      <PipelineChrome stageIndex={0} />
    </AbsoluteFill>
  );
};

// D3: "Esto no es una app de reviews. Es un radar."
const Scene1HookD3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, delay: 4, config: { damping: 200 } });
  const subIn = spring({ frame, fps, delay: 30, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg src="videos/ai_Spanish_Beach_VW_Van_Golden_Hour.mp4" dim={0.55} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 600, background: "linear-gradient(180deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.4) 60%, transparent 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 500, background: "linear-gradient(0deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.4) 60%, transparent 100%)" }} />
      <div style={{ position: "absolute", top: "26%", left: 70, right: 70, opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)` }}>
        <div style={{ fontFamily: interFont, fontSize: 78, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.1, letterSpacing: -2, textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}>
          Esto no es una
          <br />app de <span style={{ color: AMBER_SOFT, fontStyle: "italic", textDecoration: "line-through", textDecorationColor: RED }}>reviews</span>.
        </div>
      </div>
      <div style={{ position: "absolute", top: "58%", left: 70, right: 70, opacity: subIn, transform: `translateY(${interpolate(subIn, [0, 1], [30, 0])}px)` }}>
        <div style={{ fontFamily: interFont, fontSize: 82, fontWeight: 900, color: AMBER, lineHeight: 1.1, letterSpacing: -2, textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}>
          Es un radar.
        </div>
      </div>
      <PipelineChrome stageIndex={0} />
    </AbsoluteFill>
  );
};

// D1: Original hook
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, delay: 4, config: { damping: 200 } });
  const subIn = spring({ frame, fps, delay: 22, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg src="videos/road_trip_sunset.mp4" dim={0.6} />

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 600,
          background:
            "linear-gradient(180deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.4) 60%, transparent 100%)",
        }}
      />
      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 500,
          background:
            "linear-gradient(0deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.4) 60%, transparent 100%)",
        }}
      />

      {/* Main hook text */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: 70,
          right: 70,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 86,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.08,
            letterSpacing: -2,
            textShadow: "0 4px 30px rgba(0,0,0,0.9)",
          }}
        >
          ¿Cómo encuentra
          <br />
          WildSpotter
          <br />
          tus <span style={{ color: AMBER, fontStyle: "italic" }}>spots</span>?
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          top: "68%",
          left: 70,
          right: 70,
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [20, 0])}px)`,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 6,
            height: 56,
            background: AMBER,
            boxShadow: `0 0 16px ${AMBER}`,
          }}
        />
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 34,
            fontWeight: 700,
            color: AMBER_SOFT,
            letterSpacing: 3,
            textTransform: "uppercase",
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          5 capas de análisis
        </div>
      </div>

      <PipelineChrome stageIndex={0} />
    </AbsoluteFill>
  );
};

// ---------- Shared stage scene ----------
type StageProps = {
  index: number;
  label: string;
  bgSrc: string;
  dim: number;
  children: React.ReactNode;
};

const StageScene: React.FC<StageProps> = ({
  index,
  label,
  bgSrc,
  dim,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelIn = spring({ frame, fps, delay: 3, config: { damping: 16, stiffness: 140 } });
  const vizIn = spring({ frame, fps, delay: 12, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg src={bgSrc} dim={dim} zoomFrom={1.0} zoomTo={1.06} zoomDuration={60} />

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 520,
          background:
            "linear-gradient(180deg, rgba(15,13,11,0.88) 0%, rgba(15,13,11,0.3) 60%, transparent 100%)",
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
          background:
            "linear-gradient(0deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.3) 60%, transparent 100%)",
        }}
      />

      {/* Stage label (huge) */}
      <div
        style={{
          position: "absolute",
          top: "32%",
          left: 70,
          right: 70,
          opacity: labelIn,
          transform: `translateX(${interpolate(labelIn, [0, 1], [-60, 0])}px)`,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            width: 8,
            height: 100,
            background: AMBER,
            boxShadow: `0 0 24px ${AMBER}`,
          }}
        />
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 96,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: -2,
            lineHeight: 1,
            textShadow: "0 4px 30px rgba(0,0,0,0.9)",
          }}
        >
          {label}
        </div>
      </div>

      {/* Viz container */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 70,
          right: 70,
          opacity: vizIn,
          transform: `translateY(${interpolate(vizIn, [0, 1], [30, 0])}px)`,
        }}
      >
        {children}
      </div>

      <PipelineChrome stageIndex={index} stageLabel={label} />
    </AbsoluteFill>
  );
};

// ---------- S2 RADAR viz ----------
const RadarViz: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {[0, 1, 2].map((i) => {
        const delay = i * 12;
        const t = (frame - delay) % 60;
        const scale = interpolate(t, [0, 60], [0.2, 1.8], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const op = interpolate(t, [0, 30, 60], [0, 0.7, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 260,
              height: 260,
              borderRadius: "50%",
              border: `3px solid ${AMBER}`,
              transform: `scale(${scale})`,
              opacity: op,
            }}
          />
        );
      })}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: AMBER,
          boxShadow: `0 0 32px ${AMBER}, 0 0 64px ${AMBER}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -20,
          fontFamily: jetbrainsFont,
          fontSize: 26,
          color: AMBER_SOFT,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        OpenStreetMap · España
      </div>
    </div>
  );
};

// ---------- S3 TERRENO viz ----------
const TerrenoViz: React.FC = () => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // slope path points
  const pts = Array.from({ length: 40 }, (_, i) => {
    const x = i * 24;
    const y = 200 - i * 3.2 - Math.sin(i * 0.4) * 10;
    return `${x},${y}`;
  }).join(" ");
  const visiblePts = pts.split(" ").slice(0, Math.floor(40 * prog)).join(" ");

  return (
    <div style={{ position: "relative", width: "100%", height: 360 }}>
      <svg
        viewBox="0 0 960 260"
        style={{ width: "100%", height: 260 }}
      >
        {/* grid */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={0}
            y1={50 + i * 50}
            x2={960}
            y2={50 + i * 50}
            stroke="rgba(160,131,108,0.15)"
            strokeWidth={1}
          />
        ))}
        {/* slope line */}
        <polyline
          points={visiblePts}
          fill="none"
          stroke={AMBER}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 12px ${AMBER})` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 0,
          fontFamily: jetbrainsFont,
          fontSize: 64,
          fontWeight: 700,
          color: "#FFFFFF",
          textShadow: "0 2px 20px rgba(0,0,0,0.8)",
        }}
      >
        {Math.round(prog * 3.2)}
        <span style={{ color: AMBER, fontSize: 40 }}>%</span>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          fontFamily: jetbrainsFont,
          fontSize: 26,
          color: AMBER_SOFT,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        Pendiente · Elevación
      </div>
    </div>
  );
};

// ---------- S4 SATÉLITE viz ----------
const SateliteViz: React.FC = () => {
  const frame = useCurrentFrame();
  const scanY = interpolate(frame, [0, 45], [0, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanDone = frame >= 45;

  const modelBadgeIn = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Real AI sub-scores from workers/ai_vision_labeler.py (Claude Haiku vision, 0-10 each)
  const values = [
    { label: "Superficie", val: 9, color: GREEN, delay: 50 },
    { label: "Acceso", val: 8, color: GREEN, delay: 64 },
    { label: "Espacio abierto", val: 9, color: GREEN, delay: 78 },
    { label: "Furgo detectada", val: 7, color: GREEN, delay: 92 },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        alignItems: "stretch",
      }}
    >
      {/* Satellite image frame */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 260,
          borderRadius: 10,
          border: `2px solid ${AMBER}`,
          overflow: "hidden",
          boxShadow: `0 0 40px rgba(217,119,6,0.4)`,
          background:
            "repeating-linear-gradient(45deg, #2a1f15 0 12px, #1a1410 12px 24px)",
          flexShrink: 0,
        }}
      >
        {/* fake terrain patches */}
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 120,
            width: 280,
            height: 140,
            background: "radial-gradient(ellipse, #6b4a2a 0%, #3a2818 80%)",
            borderRadius: "40% 60% 50% 50%",
            opacity: 0.75,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 500,
            width: 240,
            height: 120,
            background: "radial-gradient(ellipse, #2d4a1e 0%, #1a2810 80%)",
            borderRadius: "50% 40% 60% 40%",
            opacity: 0.6,
          }}
        />

        {/* grid overlay */}
        <svg
          viewBox="0 0 940 260"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * 80}
              y1={0}
              x2={i * 80}
              y2={260}
              stroke="rgba(217,119,6,0.22)"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 65}
              x2={940}
              y2={i * 65}
              stroke="rgba(217,119,6,0.22)"
              strokeWidth={1}
            />
          ))}
        </svg>

        {/* Scan line */}
        {!scanDone && (
          <div
            style={{
              position: "absolute",
              top: scanY,
              left: 0,
              right: 0,
              height: 3,
              background: AMBER,
              boxShadow: `0 0 20px ${AMBER}, 0 0 40px ${AMBER}`,
            }}
          />
        )}

        {/* Bounding box around detected van (appears after scan) */}
        {scanDone && (
          <div
            style={{
              position: "absolute",
              top: 135,
              left: 560,
              width: 90,
              height: 50,
              border: `3px solid ${GREEN}`,
              borderRadius: 3,
              boxShadow: `0 0 20px ${GREEN}`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -30,
                left: -2,
                padding: "4px 10px",
                background: GREEN,
                color: "#0F0D0B",
                fontFamily: jetbrainsFont,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              VAN 0.94
            </div>
          </div>
        )}

        {/* REC badge */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            padding: "8px 16px",
            background: "rgba(15,13,11,0.85)",
            border: `1px solid ${AMBER}`,
            borderRadius: 4,
            fontFamily: jetbrainsFont,
            fontSize: 20,
            fontWeight: 700,
            color: AMBER,
            letterSpacing: 2,
            opacity: modelBadgeIn,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#DC2626",
              boxShadow: "0 0 8px #DC2626",
            }}
          />
          PNOA · 25cm/px
        </div>
      </div>

      {/* Detected values list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            opacity: modelBadgeIn,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: GREEN,
              boxShadow: `0 0 12px ${GREEN}`,
            }}
          />
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 32,
              fontWeight: 700,
              color: AMBER,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            IA Visual · Claude Haiku
          </div>
        </div>

        {values.map((v) => {
          const op = interpolate(frame, [v.delay, v.delay + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const ty = interpolate(frame, [v.delay, v.delay + 12], [12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const barFill = interpolate(
            frame,
            [v.delay + 6, v.delay + 26],
            [0, v.val / 10],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={v.label}
              style={{
                opacity: op,
                transform: `translateY(${ty}px)`,
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "10px 0",
              }}
            >
              <div
                style={{
                  width: 6,
                  alignSelf: "stretch",
                  background: v.color,
                  boxShadow: `0 0 10px ${v.color}`,
                }}
              />
              <div
                style={{
                  flex: 1,
                  fontFamily: jetbrainsFont,
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: 1,
                  textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                }}
              >
                {v.label}
              </div>
              <div
                style={{
                  width: 140,
                  height: 10,
                  background: "rgba(160,131,108,0.2)",
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barFill * 100}%`,
                    height: "100%",
                    background: v.color,
                    boxShadow: `0 0 12px ${v.color}`,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: jetbrainsFont,
                  fontSize: 44,
                  fontWeight: 700,
                  color: v.color,
                  minWidth: 100,
                  textAlign: "right",
                  textShadow: `0 0 16px ${v.color}`,
                }}
              >
                {v.val}
                <span style={{ color: AMBER_SOFT, fontSize: 26 }}>/10</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- S5 LEGAL viz ----------
const LegalViz: React.FC = () => {
  const frame = useCurrentFrame();
  const polyIn = interpolate(frame, [5, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const xIn = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 360,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 560 320" style={{ width: 560, height: 320 }}>
        <defs>
          <clipPath id="legal-clip">
            <circle cx={280} cy={160} r={polyIn * 400} />
          </clipPath>
        </defs>
        {/* Territory outline */}
        <rect
          x={20}
          y={20}
          width={520}
          height={280}
          fill="none"
          stroke="rgba(160,131,108,0.4)"
          strokeWidth={2}
          strokeDasharray="6 6"
        />
        <g clipPath="url(#legal-clip)">
          <path
            d="M60,80 Q140,40 260,70 Q380,50 480,110 Q530,180 480,240 Q380,290 260,270 Q140,280 70,220 Q30,150 60,80 Z"
            fill="rgba(220,38,38,0.3)"
            stroke={RED}
            strokeWidth={3}
            strokeDasharray="10 5"
          />
        </g>
        {/* Label strip */}
        <text
          x={280}
          y={175}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={36}
          fontWeight={700}
          fontFamily={jetbrainsFont}
          letterSpacing={3}
          opacity={polyIn}
        >
          NATURA 2000
        </text>
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: jetbrainsFont,
          fontSize: 24,
          color: AMBER_SOFT,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: xIn,
        }}
      >
        Natura 2000 · Costas · Catastro
      </div>
    </div>
  );
};

// ---------- S6 CONTEXTO viz ----------
const ContextoViz: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [
    { label: "Ruido", val: 0.25, color: RED },
    { label: "Urbano", val: 0.15, color: "#FBBF24" },
    { label: "Privacidad", val: 0.92, color: GREEN },
    { label: "Paisaje", val: 0.88, color: GREEN },
  ];
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
      {bars.map((b, i) => {
        const delay = 4 + i * 8;
        const fill = interpolate(frame, [delay, delay + 28], [0, b.val], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const op = interpolate(frame, [delay, delay + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={b.label} style={{ opacity: op }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontFamily: jetbrainsFont,
                  fontSize: 26,
                  color: "#FFFFFF",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {b.label}
              </div>
              <div
                style={{
                  fontFamily: jetbrainsFont,
                  fontSize: 26,
                  fontWeight: 700,
                  color: b.color,
                }}
              >
                {Math.round(fill * 100)}
              </div>
            </div>
            <div
              style={{
                height: 14,
                background: "rgba(160,131,108,0.18)",
                borderRadius: 7,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  background: b.color,
                  boxShadow: `0 0 16px ${b.color}`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- S7 PAYOFF ----------
const Scene7Payoff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const score = Math.round(
    interpolate(frame, [5, 55], [0, 92], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const ringProgress = interpolate(frame, [5, 55], [0, 0.92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const tagIn = spring({ frame, fps, delay: 50, config: { damping: 200 } });
  const logoIn = spring({ frame, fps, delay: 65, config: { damping: 14, stiffness: 120 } });
  const brandIn = spring({ frame, fps, delay: 78, config: { damping: 200 } });

  const r = 150;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - ringProgress);

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg
        src="videos/ai_Spanish_Beach_VW_Van_Golden_Hour.mp4"
        dim={0.5}
        zoomTo={1.07}
        zoomDuration={180}
      />

      {/* Dark radial vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(15,13,11,0.55) 0%, rgba(15,13,11,0.92) 100%)",
        }}
      />

      {/* Score ring */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 360,
          height: 360,
        }}
      >
        <svg width={360} height={360} viewBox="0 0 360 360">
          <circle
            cx={180}
            cy={180}
            r={r}
            fill="none"
            stroke="rgba(74,222,128,0.15)"
            strokeWidth={14}
          />
          <circle
            cx={180}
            cy={180}
            r={r}
            fill="none"
            stroke={GREEN}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 180 180)"
            style={{ filter: `drop-shadow(0 0 20px ${GREEN})` }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 160,
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1,
              textShadow: "0 4px 40px rgba(74,222,128,0.5)",
            }}
          >
            {score}
          </div>
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 22,
              color: GREEN,
              letterSpacing: 4,
              marginTop: 6,
            }}
          >
            SCORE / 100
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: tagIn,
          transform: `translateY(${interpolate(tagIn, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 58,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.15,
            letterSpacing: -1,
            textShadow: "0 4px 24px rgba(0,0,0,0.8)",
          }}
        >
          Solo datos.
          <br />
          <span style={{ color: AMBER, fontStyle: "italic" }}>Cero opiniones.</span>
        </div>
      </div>

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: "78%",
          left: "50%",
          transform: `translate(-50%, 0) scale(${interpolate(logoIn, [0, 1], [0.5, 1])})`,
          opacity: logoIn,
        }}
      >
        <Img
          src={staticFile("images/app-logo.png")}
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            boxShadow: "0 8px 40px rgba(180,80,10,0.55)",
          }}
        />
      </div>

      {/* Brand name */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: brandIn,
          transform: `translateY(${interpolate(brandIn, [0, 1], [15, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 44,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: 5,
            textShadow: "0 2px 16px rgba(0,0,0,0.8)",
          }}
        >
          WildSpotter
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Music ----------
const PipelineMusic: React.FC<{ src: string }> = ({ src }) => {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Audio
      src={staticFile(src)}
      volume={(f) => {
        const fadeIn = interpolate(f, [0, 0.6 * fps], [0, 0.4], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(
          f,
          [durationInFrames - 2.5 * fps, durationInFrames],
          [0.4, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        if (f < 0.6 * fps) return fadeIn;
        if (f > durationInFrames - 2.5 * fps) return fadeOut;
        return 0.4;
      }}
    />
  );
};

// ---------- Main composition ----------
const HOOK_COMPONENTS = { D1: Scene1Hook, D2: Scene1HookD2, D3: Scene1HookD3 } as const;

export const ElPipeline: React.FC<ElPipelineProps> = ({
  hookVariant = "D1",
  withIntro = false,
  musicTrack = "sci-fi-score",
}) => {
  const HookScene = HOOK_COMPONENTS[hookVariant];
  const introOffset = withIntro ? STORE_INTRO_FRAMES : 0;
  const musicSrc = `audio/music/${musicTrack}.mp3`;

  const scenes = (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={130}>
        <HookScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 14 })}
      />

      <TransitionSeries.Sequence durationInFrames={110}>
        <StageScene index={1} label="RADAR" bgSrc="videos/ai_Spanish_Countryside_Van_Video.mp4" dim={0.7}>
          <RadarViz />
        </StageScene>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 14 })} />

      <TransitionSeries.Sequence durationInFrames={110}>
        <StageScene index={2} label="TERRENO" bgSrc="videos/Aerial_Spanish_Mediterranean_coast.mp4" dim={0.7}>
          <TerrenoViz />
        </StageScene>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 14 })} />

      <TransitionSeries.Sequence durationInFrames={170}>
        <StageScene index={3} label="SATÉLITE" bgSrc="videos/rvs_parked_outdoors.mp4" dim={0.78}>
          <SateliteViz />
        </StageScene>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 14 })} />

      <TransitionSeries.Sequence durationInFrames={110}>
        <StageScene index={4} label="LEGAL" bgSrc="videos/police_writing_ticket.mp4" dim={0.78}>
          <LegalViz />
        </StageScene>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 14 })} />

      <TransitionSeries.Sequence durationInFrames={110}>
        <StageScene index={5} label="CONTEXTO" bgSrc="videos/ai_Campervan_Sunset_Time_Lapse_Video.mp4" dim={0.72}>
          <ContextoViz />
        </StageScene>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 14 })} />

      <TransitionSeries.Sequence durationInFrames={180}>
        <Scene7Payoff />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );

  return (
    <>
      <PipelineMusic src={musicSrc} />

      <Sequence from={introOffset + 660}>
        <Audio src={staticFile("audio/sfx/score-reveal.mp3")} volume={0.55} />
      </Sequence>

      {withIntro ? (
        <>
          <Sequence durationInFrames={STORE_INTRO_FRAMES}>
            <StoreInstallIntro />
          </Sequence>
          <Sequence from={STORE_INTRO_FRAMES}>
            {scenes}
          </Sequence>
        </>
      ) : (
        scenes
      )}
    </>
  );
};
