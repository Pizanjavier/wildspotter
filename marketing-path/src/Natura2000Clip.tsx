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

const { fontFamily: interFont } = loadInter("normal", {
  weights: ["400", "600", "700", "900"],
  subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

// Total: 130 + 150 + 120 + 130 = 530 raw
// Transitions: 16 + 16 + 16 = 48 overlap
// Net: 482 frames ≈ 16.1s @ 30fps

// --- Scene 1: Beautiful nature with "Este rincón parece perfecto" ---
const Scene1Map: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow zoom
  const zoom = interpolate(frame, [0, 130], [1.0, 1.08], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Title fade in
  const titleIn = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 200 },
  });

  // Location tag
  const tagIn = spring({
    frame,
    fps,
    delay: 18,
    config: { damping: 200 },
  });

  // Subtle pin drop
  const pinIn = spring({
    frame,
    fps,
    delay: 25,
    config: { damping: 12, stiffness: 180 },
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0F0D0B" }}>
      {/* Drone forest footage — beautiful nature establishing shot */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 45%",
        }}
      >
        <Video
          src={staticFile("videos/Aerial_Spanish_Mediterranean_coast.mp4")}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Warm cinematic overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,13,11,0.25)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 500,
          background:
            "linear-gradient(180deg, rgba(15,13,11,0.88) 0%, rgba(15,13,11,0.5) 50%, transparent 100%)",
        }}
      />

      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 450,
          background:
            "linear-gradient(0deg, rgba(15,13,11,0.85) 0%, rgba(15,13,11,0.4) 50%, transparent 100%)",
        }}
      />

      {/* Location pin */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: `translate(-50%, -100%) scale(${interpolate(pinIn, [0, 1], [2.5, 1])})`,
          opacity: pinIn,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50% 50% 50% 0%",
            transform: "rotate(-45deg)",
            background: "linear-gradient(135deg, #D97706, #B45309)",
            boxShadow: "0 4px 24px rgba(217,119,6,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#FFFFFF",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>

      {/* Pin pulse ring */}
      {pinIn > 0.5 && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: interpolate(frame, [25, 70], [20, 120], {
              extrapolateRight: "clamp",
            }),
            height: interpolate(frame, [25, 70], [20, 120], {
              extrapolateRight: "clamp",
            }),
            borderRadius: "50%",
            border: "2px solid rgba(217,119,6,0.4)",
            opacity: interpolate(frame, [25, 70], [0.8, 0], {
              extrapolateRight: "clamp",
            }),
          }}
        />
      )}

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 70,
          right: 70,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 78,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.1,
            letterSpacing: -2,
            textShadow:
              "0 4px 30px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          Este rincón
          <br />
          parece{" "}
          <span style={{ color: "#D97706", fontStyle: "italic" }}>
            perfecto
          </span>
        </div>
      </div>

      {/* Location tag */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 70,
          opacity: tagIn,
          transform: `translateY(${interpolate(tagIn, [0, 1], [20, 0])}px)`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#D97706",
            boxShadow: "0 0 12px rgba(217,119,6,0.6)",
          }}
        />
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 30,
            fontWeight: 700,
            color: "#A0836C",
            letterSpacing: 2,
            textTransform: "uppercase",
            textShadow: "0 2px 16px rgba(0,0,0,0.8)",
          }}
        >
          Delta del Ebro, Tarragona
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 2: Natura 2000 overlay reveal ---
const Scene2Natura: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow zoom continues
  const zoom = interpolate(frame, [0, 150], [1.08, 1.14], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Red overlay expands from center
  const overlayIn = interpolate(frame, [8, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // "NATURA 2000" text
  const labelIn = spring({
    frame,
    fps,
    delay: 30,
    config: { damping: 14, stiffness: 120 },
  });

  // Warning icon pulse
  const warningPulse =
    frame > 50 ? 1 + Math.sin((frame - 50) * 0.15) * 0.08 : 1;

  // "Zona protegida" subtitle
  const subIn = spring({
    frame,
    fps,
    delay: 45,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0F0D0B" }}>
      {/* Same coastal footage — darker, tighter, continuity */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 45%",
        }}
      >
        <Video
          src={staticFile("videos/Aerial_Spanish_Mediterranean_coast.mp4")}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.25,
          }}
        />
      </div>

      {/* Red danger zone overlay */}
      <svg
        viewBox="0 0 1080 1920"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          <clipPath id="natura-clip">
            <circle
              cx="540"
              cy="650"
              r={interpolate(overlayIn, [0, 1], [0, 800])}
            />
          </clipPath>
        </defs>
        <g clipPath="url(#natura-clip)">
          <path
            d="M60,200 Q200,160 380,180 Q540,120 720,200 Q880,260 980,380 Q1020,500 960,680 Q900,820 780,920 Q620,1020 440,1000 Q280,980 160,880 Q60,760 40,600 Q20,420 60,300 Z"
            fill="rgba(220,38,38,0.28)"
            stroke="rgba(220,38,38,0.7)"
            strokeWidth="3"
            strokeDasharray="12 6"
          />
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={i}
              x1={40 + i * 72}
              y1={150}
              x2={40 + i * 72 - 150}
              y2={1050}
              stroke="rgba(220,38,38,0.12)"
              strokeWidth="1.5"
            />
          ))}
        </g>
      </svg>

      {/* Dark overlay for text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(15,13,11,${interpolate(overlayIn, [0, 1], [0.4, 0.6])})`,
        }}
      />

      {/* Warning triangle + NATURA 2000 */}
      <div
        style={{
          position: "absolute",
          top: "32%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: labelIn,
          transform: `scale(${interpolate(labelIn, [0, 1], [0.7, 1]) * warningPulse})`,
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "50px solid transparent",
            borderRight: "50px solid transparent",
            borderBottom: "86px solid #DC2626",
            filter: "drop-shadow(0 4px 30px rgba(220,38,38,0.5))",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 38,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: interFont,
              fontSize: 40,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            !
          </div>
        </div>

        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 72,
            fontWeight: 700,
            color: "#DC2626",
            letterSpacing: 6,
            textShadow:
              "0 0 60px rgba(220,38,38,0.5), 0 4px 20px rgba(0,0,0,0.8)",
          }}
        >
          NATURA 2000
        </div>

        <div
          style={{
            fontFamily: interFont,
            fontSize: 36,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: subIn,
            transform: `translateY(${interpolate(subIn, [0, 1], [15, 0])}px)`,
            textShadow: "0 2px 16px rgba(0,0,0,0.8)",
          }}
        >
          Zona protegida
        </div>
      </div>

      {/* "Hasta 600€ de multa" */}
      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 52,
            fontWeight: 700,
            color: "#FFFFFF",
            textShadow: "0 2px 24px rgba(0,0,0,0.8)",
            letterSpacing: -1,
          }}
        >
          Hasta{" "}
          <span
            style={{
              color: "#DC2626",
              fontFamily: jetbrainsFont,
              fontSize: 64,
            }}
          >
            600€
          </span>{" "}
          de multa
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 3: "¿Sabías que estás dentro?" ---
const Scene3Warning: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1In = spring({
    frame,
    fps,
    delay: 3,
    config: { damping: 200 },
  });

  const line2In = spring({
    frame,
    fps,
    delay: 18,
    config: { damping: 200 },
  });

  // Background zoom
  const bgZoom = interpolate(frame, [0, 120], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  // Ambient red pulse
  const redPulse = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.03, 0.08],
  );

  return (
    <AbsoluteFill
      style={{
        background: "#0F0D0B",
        overflow: "hidden",
      }}
    >
      {/* Police car — fear footage */}
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
            opacity: 0.18,
          }}
        />
      </div>

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(15,13,11,0.5) 0%, rgba(15,13,11,0.88) 100%)",
        }}
      />

      {/* Subtle red ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(220,38,38,${redPulse}) 0%, transparent 60%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Main question */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: 70,
          right: 70,
          opacity: line1In,
          transform: `translateY(${interpolate(line1In, [0, 1], [50, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 76,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.15,
            letterSpacing: -2,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Estás en una
          <br />
          <span style={{ color: "#DC2626" }}>zona protegida</span>.
        </div>
      </div>

      {/* Answer */}
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: 70,
          right: 70,
          opacity: line2In,
          transform: `translateY(${interpolate(line2In, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 48,
            fontWeight: 600,
            color: "#A0836C",
            lineHeight: 1.35,
            textShadow: "0 2px 16px rgba(0,0,0,0.6)",
          }}
        >
          WildSpotter cruza cada spot con datos oficiales.{" "}
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>
            Antes de que aparques.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 4: Logo + Brand close ---
const Scene4Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo bounce in
  const logoIn = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 12, stiffness: 100 },
  });

  // Brand name
  const nameIn = spring({
    frame,
    fps,
    delay: 15,
    config: { damping: 200 },
  });

  // Tagline
  const tagIn = spring({
    frame,
    fps,
    delay: 28,
    config: { damping: 200 },
  });

  // Amber line
  const lineWidth = interpolate(frame, [20, 55], [0, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Background zoom
  const bgZoom = interpolate(frame, [0, 130], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#0F0D0B",
        overflow: "hidden",
      }}
    >
      {/* Couple with dog at van, night — warm payoff */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgZoom})`,
          transformOrigin: "50% 40%",
        }}
      >
        <Video
          src={staticFile("videos/van_in_spot_calm.mp4")}
          muted
          loop
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.2,
          }}
        />
      </div>

      {/* Heavy dark overlay — logo focus */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(15,13,11,0.55) 0%, rgba(15,13,11,0.92) 100%)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${interpolate(logoIn, [0, 1], [0.5, 1])})`,
          opacity: logoIn,
        }}
      >
        <Img
          src={staticFile("images/app-logo.png")}
          style={{
            width: 160,
            height: 160,
            borderRadius: 36,
            boxShadow: "0 8px 48px rgba(180,80,10,0.55)",
          }}
        />
      </div>

      {/* Brand name */}
      <div
        style={{
          position: "absolute",
          top: "46%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: nameIn,
          transform: `translateY(${interpolate(nameIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 64,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: 6,
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
          top: "54%",
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
          top: "58%",
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
            fontSize: 38,
            fontWeight: 600,
            color: "#A0836C",
            letterSpacing: 1,
            lineHeight: 1.4,
            textShadow: "0 2px 12px rgba(0,0,0,0.7)",
          }}
        >
          Tu radar sabe
          <br />
          <span style={{ color: "#D97706", fontWeight: 700 }}>
            lo que tú no
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Music track ---
const TensionMusic: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();

  return (
    <Audio
      src={staticFile("audio/music/tension.mp3")}
      volume={(f) => {
        const fadeIn = interpolate(f, [0, 0.8 * fps], [0, 0.35], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(
          f,
          [durationInFrames - 3 * fps, durationInFrames],
          [0.35, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        if (f < 0.8 * fps) return fadeIn;
        if (f > durationInFrames - 3 * fps) return fadeOut;
        return 0.35;
      }}
    />
  );
};

// --- Main composition ---
// Scene durations: 130 + 150 + 120 + 130 = 530
// Transitions: 16 + 16 + 16 = 48
// Net: 482 frames ≈ 16.1s @ 30fps
export const Natura2000Clip: React.FC = () => {
  return (
    <>
      <TensionMusic />

      {/* Radar ping SFX on Natura 2000 reveal */}
      <Sequence from={122}>
        <Audio src={staticFile("audio/sfx/radar-ping.mp3")} volume={0.6} />
      </Sequence>

      <TransitionSeries>
        {/* Scene 1: Beautiful nature spot */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene1Map />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 2: Natura 2000 overlay drops */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene2Natura />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 3: "¿Sabías que estás dentro?" */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene3Warning />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 4: Logo + tagline close */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene4Logo />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
