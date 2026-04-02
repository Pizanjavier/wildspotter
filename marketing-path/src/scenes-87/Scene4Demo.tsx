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
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

const { fontFamily: jetbrainsFont } = loadJetBrains("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const PHONE_W = 860;
const PHONE_H = 1660;
const PHONE_X = (1080 - PHONE_W) / 2;
const PHONE_Y = 130;
const CORNER = 56;

// Animated radar ring
const RadarRing: React.FC<{ delay: number; cx: number; cy: number }> = ({
  delay,
  cx,
  cy,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < delay) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={50 + progress * 240}
      fill="none"
      stroke={`rgba(217,119,6,${0.5 * (1 - progress)})`}
      strokeWidth={2}
    />
  );
};

// Score card in the bottom sheet
const ScoreCard: React.FC<{
  name: string;
  score: number;
  meta: string;
  delay: number;
  index: number;
}> = ({ name, score, meta, delay, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({
    frame,
    fps,
    delay,
    config: { damping: 18, stiffness: 160 },
  });
  const tx = interpolate(cardIn, [0, 1], [PHONE_W + 80, 0]);
  const opacity = interpolate(cardIn, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const displayScore = Math.floor(
    interpolate(frame, [delay + 5, delay + 20], [0, score], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const scoreColor =
    score >= 80 ? "#4ADE80" : score >= 60 ? "#D97706" : "#FBBF24";

  return (
    <div
      style={{
        position: "absolute",
        top: 140 + index * 112,
        left: 24,
        right: 24,
        height: 100,
        background: "linear-gradient(135deg, #2D2620 0%, #261F1A 100%)",
        borderRadius: 18,
        border: "1px solid rgba(160,131,108,0.18)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
        transform: `translateX(${tx}px)`,
        opacity,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Score circle */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `${scoreColor}18`,
          border: `2.5px solid ${scoreColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 18px ${scoreColor}25`,
        }}
      >
        <span
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 30,
            fontWeight: 700,
            color: scoreColor,
          }}
        >
          {displayScore}
        </span>
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: interFont,
            fontSize: 26,
            fontWeight: 700,
            color: "#F5EFE8",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 15,
            color: "#7A6050",
            marginTop: 4,
          }}
        >
          {meta}
        </div>
      </div>

      <div style={{ fontSize: 18, color: "#5C4A3A" }}>›</div>
    </div>
  );
};

export const Scene4Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slides up
  const phoneIn = spring({
    frame,
    fps,
    delay: 0,
    config: { damping: 20, stiffness: 90 },
  });
  const phoneY = interpolate(phoneIn, [0, 1], [600, 0]);
  const phoneScale = interpolate(phoneIn, [0, 1], [0.88, 1]);

  // Scan phases
  const scanning = frame > 22 && frame < 72;
  const btnScale =
    frame > 18 && frame < 24
      ? 0.9
      : scanning
        ? 1 + Math.sin(frame * 0.4) * 0.02
        : 1;

  // Results
  const resultsIn = spring({
    frame,
    fps,
    delay: 65,
    config: { damping: 200 },
  });
  const sheetY = interpolate(resultsIn, [0, 1], [700, 0]);

  // Found label
  const foundIn = spring({
    frame,
    fps,
    delay: 60,
    config: { damping: 200 },
  });

  // Scan sweep line
  const scanLineY = scanning
    ? interpolate(frame, [22, 72], [180, 700], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const SCAN_CX = PHONE_W / 2;
  const SCAN_CY = 400;

  // Spot markers after scan
  const spotMarkers = [
    { x: 280, y: 240, score: 92, d: 65 },
    { x: 560, y: 380, score: 85, d: 70 },
    { x: 420, y: 310, score: 78, d: 75 },
    { x: 660, y: 265, score: 88, d: 80 },
    { x: 220, y: 440, score: 74, d: 85 },
    { x: 490, y: 200, score: 81, d: 90 },
    { x: 350, y: 480, score: 69, d: 95 },
  ];

  const videoZoom = interpolate(frame, [0, 175], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0F0D0B" }}>
      {/* Video background — RV on mountain road */}
      <div
        style={{
          position: "absolute",
          inset: -20,
          transform: `scale(${videoZoom})`,
          transformOrigin: "50% 45%",
        }}
      >
        <Video
          src={staticFile("videos/rv_mountain_road.mp4")}
          muted
          style={{
            width: "calc(100% + 40px)",
            height: "calc(100% + 40px)",
            objectFit: "cover",
            opacity: 0.15,
          }}
        />
      </div>

      {/* Dark radial overlay for phone focus */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 20%, rgba(15,13,11,0.85) 100%)",
        }}
      />

      {/* Glow behind phone */}
      <div
        style={{
          position: "absolute",
          top: PHONE_Y + 200,
          left: PHONE_X - 60,
          width: PHONE_W + 120,
          height: PHONE_H - 400,
          borderRadius: CORNER + 30,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(217,119,6,0.1) 0%, transparent 65%)",
          transform: `translateY(${phoneY}px) scale(${phoneScale})`,
        }}
      />

      {/* Phone frame */}
      <div
        style={{
          position: "absolute",
          top: PHONE_Y,
          left: PHONE_X,
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: CORNER,
          background: "#1A1614",
          border: "2.5px solid rgba(160,131,108,0.25)",
          overflow: "hidden",
          transform: `translateY(${phoneY}px) scale(${phoneScale})`,
          boxShadow:
            "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 150,
            height: 34,
            background: "#0F0D0B",
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            zIndex: 10,
          }}
        />

        {/* Map background */}
        <Img
          src={staticFile("images/map-cabo-de-gata.jpg")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 35%",
            opacity: 0.85,
          }}
        />

        {/* Dark overlay for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(20,15,10,0.4) 0%, rgba(20,15,10,0.15) 40%, rgba(20,15,10,0.5) 100%)",
          }}
        />

        {/* Radar SVG overlay */}
        <svg
          style={{ position: "absolute", inset: 0 }}
          width={PHONE_W}
          height={PHONE_H}
        >
          {/* Scan sweep */}
          {scanning && (
            <line
              x1={50}
              y1={scanLineY}
              x2={PHONE_W - 50}
              y2={scanLineY}
              stroke="rgba(217,119,6,0.25)"
              strokeWidth={1.5}
            />
          )}

          {/* Radar rings */}
          {scanning && (
            <>
              <RadarRing delay={22} cx={SCAN_CX} cy={SCAN_CY} />
              <RadarRing delay={32} cx={SCAN_CX} cy={SCAN_CY} />
              <RadarRing delay={42} cx={SCAN_CX} cy={SCAN_CY} />
              <RadarRing delay={52} cx={SCAN_CX} cy={SCAN_CY} />
            </>
          )}

          {/* Spot markers */}
          {frame > 63 &&
            spotMarkers.map((spot, i) => {
              const mIn = spring({
                frame,
                fps,
                delay: spot.d,
                config: { damping: 8, stiffness: 220 },
              });
              const color = spot.score >= 80 ? "#4ADE80" : "#D97706";
              return (
                <g
                  key={i}
                  transform={`translate(${spot.x}, ${spot.y}) scale(${mIn})`}
                >
                  <circle r={14} fill={`${color}20`} />
                  <circle r={7} fill={color} />
                </g>
              );
            })}
        </svg>

        {/* Search bar */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 24,
            right: 24,
            height: 56,
            background: "rgba(42,33,24,0.92)",
            borderRadius: 16,
            border: "1px solid rgba(160,131,108,0.2)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 10,
            zIndex: 5,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#7A6050" strokeWidth="2" />
            <path
              d="M16.5 16.5L21 21"
              stroke="#7A6050"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontFamily: interFont,
              fontSize: 20,
              color: "#7A6050",
            }}
          >
            Costa Calida, Murcia
          </span>
        </div>

        {/* Scan button */}
        <div
          style={{
            position: "absolute",
            top: 500,
            left: "50%",
            transform: `translateX(-50%) scale(${btnScale})`,
            background: "linear-gradient(135deg, #D97706, #B45309)",
            borderRadius: 50,
            padding: "18px 44px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: scanning
              ? "0 0 50px rgba(217,119,6,0.5), 0 6px 24px rgba(0,0,0,0.5)"
              : "0 6px 24px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
            zIndex: 5,
          }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="white" />
            <circle
              cx="12"
              cy="12"
              r="7"
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            <circle
              cx="12"
              cy="12"
              r="11"
              stroke="white"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
          </svg>
          <span
            style={{
              fontFamily: interFont,
              fontSize: 24,
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            {scanning ? "Escaneando..." : "Escanear zona"}
          </span>
        </div>

        {/* "X spots found" label */}
        <div
          style={{
            position: "absolute",
            top: 588,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: jetbrainsFont,
            fontSize: 20,
            fontWeight: 700,
            color: "#4ADE80",
            letterSpacing: 1,
            opacity: foundIn,
            zIndex: 5,
          }}
        >
          ● 7 spots encontrados
        </div>

        {/* Bottom sheet */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 540,
            background: "linear-gradient(180deg, #1E1A16 0%, #1A1614 100%)",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            transform: `translateY(${sheetY}px)`,
            borderTop: "1px solid rgba(160,131,108,0.18)",
            zIndex: 6,
          }}
        >
          {/* Handle */}
          <div
            style={{
              width: 48,
              height: 5,
              borderRadius: 3,
              background: "#4A3C2E",
              margin: "12px auto 0",
            }}
          />

          {/* Section title */}
          <div
            style={{
              padding: "18px 24px 6px",
              fontFamily: interFont,
              fontSize: 26,
              fontWeight: 700,
              color: "#F5EFE8",
              letterSpacing: -0.3,
            }}
          >
            Resultados del escaneo
          </div>

          <ScoreCard
            name="Playa de Calblanque"
            score={92}
            meta="dead_end · dirt · 2% slope"
            delay={72}
            index={0}
          />
          <ScoreCard
            name="Mirador Cabo Tiñoso"
            score={85}
            meta="viewpoint · gravel · 4% slope"
            delay={80}
            index={1}
          />
          <ScoreCard
            name="Camino del Portús"
            score={78}
            meta="clearing · grass · 3% slope"
            delay={88}
            index={2}
          />
        </div>

        {/* Tab bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            background: "#1A1614",
            borderTop: "1px solid rgba(160,131,108,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            zIndex: 7,
            opacity: interpolate(resultsIn, [0, 1], [0, 1]),
          }}
        >
          {[
            { label: "MAPA", active: true },
            { label: "SPOTS", active: false },
            { label: "GUIA", active: false },
            { label: "CONFIG", active: false },
          ].map((tab) => (
            <div
              key={tab.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: tab.active ? "#D97706" : "transparent",
                }}
              />
              <span
                style={{
                  fontFamily: jetbrainsFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: tab.active ? "#D97706" : "#5C4A3A",
                  letterSpacing: 2,
                }}
              >
                {tab.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
