import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: interFont } = loadInter("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});

export const Scene3Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Full sentence appears together — no confusing stagger
  const textIn = spring({
    frame,
    fps,
    delay: 8,
    config: { damping: 22, stiffness: 90 },
  });

  // Subtle glitch at start
  const glitchPhase = frame >= 1 && frame <= 5;
  const glitchOffset = glitchPhase ? Math.sin(frame * 12) * 3 : 0;

  // Breathing pulse after text settles
  const breathe = frame > 30 ? 1 + Math.sin((frame - 30) * 0.05) * 0.006 : 1;

  // Amber divider lines from center
  const lineIn = spring({
    frame,
    fps,
    delay: 4,
    config: { damping: 28, stiffness: 70 },
  });
  const lineWidth = interpolate(lineIn, [0, 1], [0, 550]);

  const videoZoom = interpolate(frame, [0, 125], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0A0908", overflow: "hidden" }}>
      {/* Video background — sunset road, moody */}
      <div
        style={{
          position: "absolute",
          inset: -20,
          transform: `scale(${videoZoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Video
          src={staticFile("videos/road_trip_sunset.mp4")}
          muted
          style={{
            width: "calc(100% + 40px)",
            height: "calc(100% + 40px)",
            objectFit: "cover",
            opacity: 0.18,
          }}
        />
      </div>

      {/* Subtle warmth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(217,119,6,0.025) 0%, transparent 50%)",
        }}
      />

      {/* Glitch line */}
      {glitchPhase && (
        <div
          style={{
            position: "absolute",
            top: `${48 + glitchOffset}%`,
            left: 0,
            right: 0,
            height: 2,
            background: `rgba(217,119,6,${0.3 + random(`scene3-glitch-${frame}`) * 0.3})`,
            filter: "blur(1px)",
          }}
        />
      )}

      {/* Top divider */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "50%",
          transform: "translateX(-50%)",
          width: lineWidth,
          height: 1.5,
          background:
            "linear-gradient(90deg, transparent, rgba(217,119,6,0.3), transparent)",
        }}
      />

      {/* Main text — big, centered, natural read order */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 55,
          right: 55,
          transform: `translateY(-50%) scale(${breathe})`,
          textAlign: "center",
          opacity: textIn,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 86,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.2,
            letterSpacing: -3,
            textShadow: "0 2px 40px rgba(0,0,0,0.8)",
          }}
        >
          Y no están en{" "}
          <span
            style={{
              color: "#D97706",
              textShadow:
                "0 0 50px rgba(217,119,6,0.3), 0 2px 40px rgba(0,0,0,0.8)",
            }}
          >
            ninguna app
          </span>{" "}
          de reviews.
        </div>
      </div>

      {/* Bottom divider */}
      <div
        style={{
          position: "absolute",
          top: "67%",
          left: "50%",
          transform: "translateX(-50%)",
          width: lineWidth * 0.45,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(217,119,6,0.2), transparent)",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 65% 65% at 50% 50%, transparent 25%, rgba(5,4,3,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
