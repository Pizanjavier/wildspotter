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
import { GenericHook } from "./components/GenericHook";
import { StoreInstallIntro, STORE_INTRO_FRAMES } from "./components/StoreInstallIntro";

const { fontFamily: interFont } = loadInter("normal", {
  weights: ["400", "600", "700", "900"],
  subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

// Base: 766 frames ≈ 25.5s @ 30fps
// With intro: 766 + 105 = 871 frames ≈ 29.0s

export type LaMultaProps = {
  hookVariant: "C1" | "C2" | "C3";
  withIntro: boolean;
  musicTrack: "suspense" | "echoes";
};

// --- Scene 1: HOOK — "600€. Por dormir en tu furgo." ---
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Big "600€" slams in
  const euroIn = spring({
    frame,
    fps,
    delay: 8,
    config: { damping: 10, stiffness: 200 },
  });

  // Subtitle fades in after
  const subIn = spring({
    frame,
    fps,
    delay: 35,
    config: { damping: 200 },
  });

  // Screen shake on impact
  const shakeX =
    frame > 8 && frame < 22
      ? Math.sin(frame * 4.5) *
        interpolate(frame, [8, 22], [8, 0], {
          extrapolateRight: "clamp",
        })
      : 0;
  const shakeY =
    frame > 8 && frame < 22
      ? Math.cos(frame * 6) *
        interpolate(frame, [8, 22], [5, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  // Red flash on impact
  const flashOpacity =
    frame > 8 && frame < 16
      ? interpolate(frame, [8, 16], [0.25, 0], { extrapolateRight: "clamp" })
      : 0;

  // Background zoom
  const bgZoom = interpolate(frame, [0, 140], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#0F0D0B",
        overflow: "hidden",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Police car footage — fear through imagery */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgZoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Video
          src={staticFile("videos/police_car.mp4")}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.25,
          }}
        />
      </div>

      {/* Dark overlay with red tint */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(185,28,28,0.08) 0%, rgba(15,13,11,0.75) 100%)",
        }}
      />

      {/* Red flash overlay on stamp */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(185,28,28,1)",
          opacity: flashOpacity,
        }}
      />

      {/* "600€" big slam */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: euroIn,
          transform: `scale(${interpolate(euroIn, [0, 1], [2.5, 1])})`,
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 200,
            fontWeight: 700,
            color: "#DC2626",
            letterSpacing: -4,
            textShadow:
              "0 0 80px rgba(220,38,38,0.6), 0 8px 40px rgba(0,0,0,0.8)",
            lineHeight: 1,
          }}
        >
          600€
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 56,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.3,
            letterSpacing: -1,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Por dormir
          <br />
          en tu furgo.
        </div>
      </div>

      {/* Thin red line accent */}
      <div
        style={{
          position: "absolute",
          bottom: 350,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(frame, [45, 80], [0, 300], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          }),
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(220,38,38,0.6), transparent)",
        }}
      />
    </AbsoluteFill>
  );
};

// --- Scene 2: Official Natura 2000 map of Spain ---
const Scene2Zones: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow zoom into the map
  const zoom = interpolate(frame, [0, 150], [1.0, 1.12], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Map fades in
  const mapIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title
  const titleIn = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 200 },
  });

  // Source label
  const sourceIn = spring({
    frame,
    fps,
    delay: 25,
    config: { damping: 200 },
  });

  // "27% del territorio" stat
  const statIn = spring({
    frame,
    fps,
    delay: 60,
    config: { damping: 200 },
  });

  // Background video zoom
  const bgZoom = interpolate(frame, [0, 150], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0F0D0B" }}>
      {/* Drone forest — nature that's actually protected */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgZoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Video
          src={staticFile("videos/drone_forest.mp4")}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.15,
          }}
        />
      </div>

      {/* Heavy dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(15,13,11,0.5) 0%, rgba(15,13,11,0.92) 100%)",
        }}
      />

      {/* Official Natura 2000 map */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: `translate(-50%, 0) scale(${zoom})`,
          transformOrigin: "50% 35%",
          width: "220%",
          opacity: mapIn,
          filter: "saturate(0.55) brightness(0.7) contrast(1.25)",
        }}
      >
        <Img
          src={staticFile("images/natura2000-spain-official.png")}
          style={{
            width: "100%",
            height: "auto",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(185,28,28,0.1)",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* Edge vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 65% at 50% 42%, transparent 35%, rgba(15,13,11,0.6) 60%, rgba(15,13,11,1) 80%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(15,13,11,0.85) 0%, rgba(15,13,11,0) 12%, rgba(15,13,11,0) 60%, rgba(15,13,11,0.8) 72%, rgba(15,13,11,1) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Title at top */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 60,
          right: 60,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 58,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: -2,
            textShadow: "0 4px 30px rgba(0,0,0,0.9)",
            lineHeight: 1.15,
          }}
        >
          Red Natura 2000
        </div>
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 28,
            fontWeight: 700,
            color: "#A0836C",
            letterSpacing: 1,
            marginTop: 16,
            opacity: sourceIn,
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          Fuente: MITECO
        </div>
      </div>

      {/* "27% del territorio" stat */}
      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: statIn,
          transform: `translateY(${interpolate(statIn, [0, 1], [25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 120,
            fontWeight: 700,
            color: "#DC2626",
            textShadow:
              "0 0 80px rgba(220,38,38,0.4), 0 4px 20px rgba(0,0,0,0.8)",
            lineHeight: 1,
          }}
        >
          27%
        </div>
        <div
          style={{
            fontFamily: interFont,
            fontSize: 44,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: -0.5,
            marginTop: 16,
            textShadow: "0 2px 16px rgba(0,0,0,0.8)",
          }}
        >
          del territorio es zona protegida
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 3: "Podrías estar aparcando en zona protegida" ---
const Scene3Question: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1In = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 200 },
  });

  const line2In = spring({
    frame,
    fps,
    delay: 35,
    config: { damping: 200 },
  });

  // Background zoom
  const bgZoom = interpolate(frame, [0, 130], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  // Red pulse ambient
  const redPulse = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.03, 0.08],
  );

  return (
    <AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
      {/* Police writing ticket — consequence footage */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgZoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Video
          src={staticFile("videos/police_writing_ticket.mp4")}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.15,
          }}
        />
      </div>

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(15,13,11,0.55) 0%, rgba(15,13,11,0.9) 100%)",
        }}
      />

      {/* Subtle red glow */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(185,28,28,${redPulse}) 0%, transparent 55%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Main statement */}
      <div
        style={{
          position: "absolute",
          top: "24%",
          left: 70,
          right: 70,
          opacity: line1In,
          transform: `translateY(${interpolate(line1In, [0, 1], [40, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 68,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.2,
            letterSpacing: -2,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Podrías estar
          <br />
          aparcando en una
          <br />
          <span style={{ color: "#DC2626" }}>zona protegida</span>
          <br />
          sin saberlo.
        </div>
      </div>

      {/* Consequence */}
      <div
        style={{
          position: "absolute",
          top: "62%",
          left: 70,
          right: 70,
          opacity: line2In,
          transform: `translateY(${interpolate(line2In, [0, 1], [25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 48,
            fontWeight: 700,
            color: "#A0836C",
            lineHeight: 1.35,
            letterSpacing: -1,
            textShadow: "0 2px 16px rgba(0,0,0,0.6)",
          }}
        >
          Y la multa llega{" "}
          <span style={{ color: "#DC2626", fontWeight: 900 }}>después.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 4: Legal checklist ---
const LEGAL_CHECKS = [
  {
    label: "Natura 2000",
    status: "Zona protegida",
    color: "#DC2626",
  },
  {
    label: "Parque Nacional",
    status: "Dentro del límite",
    color: "#F59E0B",
  },
  {
    label: "Ley de Costas",
    status: "100m — Dominio público",
    color: "#3B82F6",
  },
  {
    label: "Catastro",
    status: "Monte público — permitido",
    color: "#4ADE80",
  },
];

const Scene4Checklist: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleIn = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 200 },
  });

  // Background zoom
  const bgZoom = interpolate(frame, [0, 180], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
      {/* Aerial Mediterranean coast — subtle nature behind cards */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgZoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Video
          src={staticFile("videos/Aerial_Spanish_Mediterranean_coast.mp4")}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.1,
          }}
        />
      </div>

      {/* Heavy dark overlay — cards are the focus */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(15,13,11,0.6) 0%, rgba(15,13,11,0.94) 100%)",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 70,
          right: 70,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 52,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: -1,
            lineHeight: 1.2,
            textShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}
        >
          WildSpotter{" "}
          <span style={{ color: "#D97706" }}>cruza</span>
          <br />
          cada spot con:
        </div>
      </div>

      {/* Legal check items */}
      <div
        style={{
          position: "absolute",
          top: 440,
          left: 70,
          right: 70,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {LEGAL_CHECKS.map((check, i) => {
          const itemIn = spring({
            frame,
            fps,
            delay: 22 + i * 18,
            config: { damping: 14, stiffness: 120 },
          });

          const checkIn = spring({
            frame,
            fps,
            delay: 32 + i * 18,
            config: { damping: 12, stiffness: 180 },
          });

          return (
            <div
              key={check.label}
              style={{
                opacity: itemIn,
                transform: `translateX(${interpolate(itemIn, [0, 1], [60, 0])}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                background: "rgba(30,41,59,0.6)",
                borderRadius: 20,
                padding: "22px 28px",
                border: `1px solid ${check.color}33`,
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Color indicator dot */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: check.color,
                  boxShadow: `0 0 12px ${check.color}66`,
                  flexShrink: 0,
                }}
              />

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: jetbrainsFont,
                    fontSize: 38,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    letterSpacing: 1,
                  }}
                >
                  {check.label}
                </div>
                <div
                  style={{
                    fontFamily: interFont,
                    fontSize: 30,
                    fontWeight: 500,
                    color: "#A0836C",
                    marginTop: 6,
                  }}
                >
                  {check.status}
                </div>
              </div>

              {/* Check/warning icon */}
              <div
                style={{
                  opacity: checkIn,
                  transform: `scale(${interpolate(checkIn, [0, 1], [0.3, 1])})`,
                  fontFamily: jetbrainsFont,
                  fontSize: 32,
                  fontWeight: 700,
                  color: check.color,
                }}
              >
                {check.color === "#4ADE80" ? "✓" : "⚠"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 240,
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: interpolate(frame, [120, 145], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 46,
            fontWeight: 600,
            color: "#A0836C",
            letterSpacing: -0.5,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          Datos oficiales.{" "}
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>
            No opiniones.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 5: CTA + Logo close ---
const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Cada spot viene con su informe legal"
  const textIn = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 200 },
  });

  // "Antes de que aparques."
  const subIn = spring({
    frame,
    fps,
    delay: 30,
    config: { damping: 200 },
  });

  // Logo
  const logoIn = spring({
    frame,
    fps,
    delay: 60,
    config: { damping: 12, stiffness: 100 },
  });

  // Brand name
  const nameIn = spring({
    frame,
    fps,
    delay: 72,
    config: { damping: 200 },
  });

  // Tagline
  const tagIn = spring({
    frame,
    fps,
    delay: 90,
    config: { damping: 200 },
  });

  // Amber divider
  const lineWidth = interpolate(frame, [78, 115], [0, 350], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Background zoom
  const bgZoom = interpolate(frame, [0, 230], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
      {/* Couple with dog at van, night — warm human payoff */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgZoom})`,
          transformOrigin: "50% 40%",
        }}
      >
        <Video
          src={staticFile("videos/van_in_spot_calm_couple_dog_night.mp4")}
          muted
          loop
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.22,
          }}
        />
      </div>

      {/* Dark overlay with warm center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(15,13,11,0.45) 0%, rgba(15,13,11,0.92) 100%)",
        }}
      />

      {/* Main statement */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: textIn,
          transform: `translateY(${interpolate(textIn, [0, 1], [40, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 54,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.25,
            letterSpacing: -2,
            textShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}
        >
          Cada spot viene con
          <br />
          su{" "}
          <span style={{ color: "#D97706" }}>informe legal</span>.
        </div>
      </div>

      {/* "Antes de que aparques." */}
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 48,
            fontWeight: 700,
            color: "#A0836C",
            letterSpacing: -0.5,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          Antes de que aparques.
        </div>
      </div>

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${interpolate(logoIn, [0, 1], [0.5, 1])})`,
          opacity: logoIn,
        }}
      >
        <Img
          src={staticFile("images/app-logo.png")}
          style={{
            width: 140,
            height: 140,
            borderRadius: 32,
            boxShadow: "0 8px 48px rgba(180,80,10,0.5)",
          }}
        />
      </div>

      {/* Brand name */}
      <div
        style={{
          position: "absolute",
          top: "66%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: nameIn,
          transform: `translateY(${interpolate(nameIn, [0, 1], [25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 56,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: 5,
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          WildSpotter
        </div>
      </div>

      {/* Amber divider */}
      <div
        style={{
          position: "absolute",
          top: "73%",
          left: "50%",
          transform: "translateX(-50%)",
          width: lineWidth,
          height: 3,
          background:
            "linear-gradient(90deg, transparent, #D97706, transparent)",
          borderRadius: 2,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          top: "76%",
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: tagIn,
          transform: `translateY(${interpolate(tagIn, [0, 1], [15, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 36,
            fontWeight: 600,
            color: "#A0836C",
            letterSpacing: 1,
            lineHeight: 1.4,
            textShadow: "0 2px 12px rgba(0,0,0,0.7)",
          }}
        >
          Tu radar para
          <br />
          <span style={{ color: "#D97706", fontWeight: 700 }}>
            spots salvajes
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Music track ---
const SuspenseMusic: React.FC<{ src: string }> = ({ src }) => {
  const { durationInFrames, fps } = useVideoConfig();

  return (
    <Audio
      src={staticFile(src)}
      volume={(f) => {
        const fadeIn = interpolate(f, [0, 1 * fps], [0, 0.3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(
          f,
          [durationInFrames - 3 * fps, durationInFrames],
          [0.3, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        if (f < 1 * fps) return fadeIn;
        if (f > durationInFrames - 3 * fps) return fadeOut;
        return 0.3;
      }}
    />
  );
};

// --- Hook variants ---
const HookC2: React.FC = () => (
  <GenericHook
    title={<>Dormiste <span style={{ color: "#DC2626" }}>aquí</span>.<br />Era Natura 2000.</>}
    subtitle="Y la multa llega después."
    videoSrc="videos/Aerial_Spanish_Mediterranean_coast.mp4"
    dimOpacity={0.45}
  />
);

const HookC3: React.FC = () => (
  <GenericHook
    title={<>El <span style={{ color: "#DC2626" }}>27%</span> de España<br />es zona protegida.</>}
    subtitle="¿Sabes si tu spot está dentro?"
    videoSrc="videos/drone_forest.mp4"
    dimOpacity={0.4}
  />
);

const HOOK_MAP = { C1: Scene1Hook, C2: HookC2, C3: HookC3 } as const;

// --- Main composition ---
export const LaMulta: React.FC<LaMultaProps> = ({
  hookVariant = "C1",
  withIntro = false,
  musicTrack = "suspense",
}) => {
  const HookScene = HOOK_MAP[hookVariant];
  const musicSrc = `audio/music/${musicTrack}.mp3`;

  const scenes = (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={140}>
        <HookScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 16 })}
      />

      <TransitionSeries.Sequence durationInFrames={150}>
        <Scene2Zones />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 16 })}
      />

      <TransitionSeries.Sequence durationInFrames={130}>
        <Scene3Question />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 16 })}
      />

      <TransitionSeries.Sequence durationInFrames={180}>
        <Scene4Checklist />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 16 })}
      />

      <TransitionSeries.Sequence durationInFrames={230}>
        <Scene5CTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );

  return (
    <>
      <SuspenseMusic src={musicSrc} />

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
