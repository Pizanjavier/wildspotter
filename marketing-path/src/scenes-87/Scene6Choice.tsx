import {
  AbsoluteFill,
  Img,
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

// Top/bottom split — landscape videos get full 1080px width
const HALF_H = 660;
const DIVIDER_Y = HALF_H;

export const Scene6Choice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const splitIn = spring({ frame, fps, delay: 0, config: { damping: 20, stiffness: 80 } });
  const topIn = spring({ frame, fps, delay: 3, config: { damping: 22, stiffness: 90 } });
  const bottomIn = spring({ frame, fps, delay: 8, config: { damping: 22, stiffness: 90 } });
  const eligeIn = spring({ frame, fps, delay: 38, config: { damping: 12, stiffness: 100 } });
  const logoIn = spring({ frame, fps, delay: 58, config: { damping: 15, stiffness: 120 } });
  const ctaIn = spring({ frame, fps, delay: 76, config: { damping: 200 } });
  const ctaPulse = frame > 95 ? 1 + Math.sin((frame - 95) * 0.12) * 0.02 : 1;

  const topZoom = interpolate(frame, [0, 180], [1.0, 1.1], { extrapolateRight: "clamp" });
  const bottomZoom = interpolate(frame, [0, 180], [1.0, 1.08], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0F0D0B", overflow: "hidden" }}>
      {/* ===== TOP HALF — crowded campervan gathering ===== */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: HALF_H,
          overflow: "hidden",
          transform: `translateY(${interpolate(topIn, [0, 1], [-HALF_H, 0])}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -15,
            transform: `scale(${topZoom})`,
            transformOrigin: "50% 50%",
          }}
        >
          <Video
            src={staticFile("videos/ai_Campervan_Gathering_in_Golden_Hour.mp4")}
            muted
            style={{
              width: "calc(100% + 30px)",
              height: "calc(100% + 30px)",
              objectFit: "cover",
              opacity: 0.55,
            }}
          />
        </div>

        {/* Red desaturation tint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(30,10,10,0.3)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Label — centered in top half */}
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily: interFont,
              fontSize: 48,
              fontWeight: 900,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: -1,
              textShadow: "0 2px 20px rgba(0,0,0,0.9)",
            }}
          >
            Parking lleno
          </div>
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 28,
              fontWeight: 700,
              color: "rgba(239,68,68,0.6)",
              marginTop: 6,
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            }}
          >
            10 furgos · sin hueco
          </div>
        </div>

        {/* Top vignette */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            background: "linear-gradient(180deg, rgba(15,13,11,0.7) 0%, transparent 100%)",
          }}
        />
        {/* Bottom edge vignette */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 180,
            background: "linear-gradient(0deg, rgba(15,13,11,0.6) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ===== BOTTOM HALF — calm van, WildSpotter spot ===== */}
      <div
        style={{
          position: "absolute",
          top: HALF_H,
          left: 0,
          right: 0,
          height: HALF_H,
          overflow: "hidden",
          transform: `translateY(${interpolate(bottomIn, [0, 1], [HALF_H, 0])}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -15,
            transform: `scale(${bottomZoom})`,
            transformOrigin: "50% 45%",
          }}
        >
          <Video
            src={staticFile("videos/van_in_spot_calm.mp4")}
            muted
            loop
            style={{
              width: "calc(100% + 30px)",
              height: "calc(100% + 30px)",
              objectFit: "cover",
              opacity: 0.45,
            }}
          />
        </div>

        {/* Warm tint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(20,15,8,0.15)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Label — top area of bottom half */}
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily: interFont,
              fontSize: 48,
              fontWeight: 900,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: -1,
              textShadow: "0 2px 20px rgba(0,0,0,0.9)",
            }}
          >
            Tu spot
          </div>
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 28,
              fontWeight: 700,
              color: "rgba(74,222,128,0.7)",
              marginTop: 6,
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            }}
          >
            score 92 · solo tú
          </div>
        </div>

        {/* Top edge vignette */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 180,
            background: "linear-gradient(180deg, rgba(15,13,11,0.6) 0%, transparent 100%)",
          }}
        />
        {/* Bottom vignette for CTA area */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 350,
            background: "linear-gradient(0deg, rgba(15,13,11,0.95) 0%, rgba(15,13,11,0.5) 60%, transparent 100%)",
          }}
        />
      </div>

      {/* ===== HORIZONTAL DIVIDER ===== */}
      <div
        style={{
          position: "absolute",
          top: DIVIDER_Y,
          left: 0,
          right: 0,
          transform: `scaleX(${splitIn})`,
          transformOrigin: "center",
          height: 3,
          background: "linear-gradient(90deg, transparent 5%, rgba(217,119,6,0.5) 20%, rgba(217,119,6,0.7) 50%, rgba(217,119,6,0.5) 80%, transparent 95%)",
          boxShadow: "0 0 20px rgba(217,119,6,0.2)",
          zIndex: 10,
        }}
      />

      {/* ===== "Elige." — centered at the divider ===== */}
      <div
        style={{
          position: "absolute",
          top: DIVIDER_Y - 70,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 20,
          opacity: eligeIn,
          transform: `scale(${interpolate(eligeIn, [0, 1], [0.6, 1])})`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 120,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: -5,
            textShadow: "0 4px 50px rgba(0,0,0,0.95), 0 0 100px rgba(0,0,0,0.6)",
          }}
        >
          Elige.
        </div>
      </div>

      {/* ===== Logo + CTA ===== */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: logoIn,
            transform: `scale(${interpolate(logoIn, [0, 1], [0.8, 1])})`,
          }}
        >
          <Img
            src={staticFile("images/app-logo.png")}
            style={{ width: 64, height: 64, borderRadius: 16, boxShadow: "0 4px 24px rgba(180,80,10,0.5)" }}
          />
          <div>
            <div style={{ fontFamily: jetbrainsFont, fontSize: 36, fontWeight: 700, color: "#FFFFFF", letterSpacing: 3 }}>
              WildSpotter
            </div>
            <div style={{ fontFamily: interFont, fontSize: 20, color: "#A0836C", letterSpacing: 1 }}>
              Tu radar para spots salvajes
            </div>
          </div>
        </div>

        <div
          style={{
            opacity: ctaIn,
            transform: `scale(${ctaPulse})`,
            background: "linear-gradient(135deg, #D97706, #B45309)",
            borderRadius: 36,
            padding: "16px 48px",
            fontFamily: interFont,
            fontSize: 30,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: 1,
            boxShadow: "0 6px 40px rgba(217,119,6,0.45)",
            whiteSpace: "nowrap",
            marginTop: 4,
          }}
        >
          Link en bio ↗
        </div>
      </div>
    </AbsoluteFill>
  );
};
