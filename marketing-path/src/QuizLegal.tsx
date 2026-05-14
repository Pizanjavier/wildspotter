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

// Scenes: 90+60+150+120=420 gross, minus 3 fade transitions × 16f = 372 net
export const QUIZ_LEGAL_FRAMES = 372;

export type QuizLegalProps = {
  variant: "O1" | "O2" | "O3";
  withIntro?: boolean;
};

// ─── Palette ──────────────────────────────────────────────────────────────────
const WARM_BG = "#0F0D0B";
const AMBER = "#D97706";
const AMBER_SOFT = "#A0836C";
const GREEN = "#4ADE80";
const RED = "#EF4444";
const AMBER_YELLOW = "#FBBF24";
const BLUE = "#60A5FA";

// ─── Variant config ───────────────────────────────────────────────────────────

type LegalCard = {
  label: string;
  dot: string; // color
  status: string;
  icon: "check" | "warn" | "cross";
};

type VariantData = {
  footage: string;       // Scene 1 footage
  ctaFootage: string;    // Scene 4 footage
  description: string;  // the spot appeal copy
  verdict: "NO" | "SÍ" | "DEPENDE";
  verdictColor: string;
  overlayColor: string;  // rgba for the color wash
  legalExplain: string;  // first line under verdict
  legalExplain2: string; // second line
  cards: LegalCard[];
};

const VARIANT_DATA: Record<"O1" | "O2" | "O3", VariantData> = {
  O1: {
    footage: "videos/tranquil_beach_with_rolling_waves_34804521_2160x3840_34804521.mp4",
    ctaFootage: "videos/couple-inside-van-with-lake-outside.mp4",
    description: "Parece perfecto.\nPlano, sin gente,\nvistas al mar.",
    verdict: "NO",
    verdictColor: RED,
    overlayColor: "rgba(220,38,38,0.22)",
    legalExplain: "Zona Natura 2000.",
    legalExplain2: "Multa de hasta 600€.",
    cards: [
      { label: "Natura 2000", dot: RED, status: "DENTRO", icon: "cross" },
      { label: "Parque Nacional", dot: AMBER_YELLOW, status: "Fuera", icon: "check" },
      { label: "Ley de Costas", dot: BLUE, status: "Fuera", icon: "check" },
      { label: "Catastro", dot: GREEN, status: "Suelo rústico", icon: "check" },
    ],
  },
  O2: {
    footage: "videos/scenic_forest_drive_on_a_dirt_road_32990645_1440x1920_32990645.mp4",
    ctaFootage: "videos/rvs_parked_outdoors.mp4",
    description: "Camino de tierra.\nFinal de pista.\nPlano. Sin construcciones.",
    verdict: "SÍ",
    verdictColor: GREEN,
    overlayColor: "rgba(74,222,128,0.18)",
    legalExplain: "Score: 82/100. Zona libre.",
    legalExplain2: "Suelo rústico. Sin restricciones detectadas.",
    cards: [
      { label: "Natura 2000", dot: GREEN, status: "Fuera", icon: "check" },
      { label: "Parque Nacional", dot: GREEN, status: "Fuera", icon: "check" },
      { label: "Ley de Costas", dot: GREEN, status: "Fuera", icon: "check" },
      { label: "Catastro", dot: GREEN, status: "Suelo rústico", icon: "check" },
    ],
  },
  O3: {
    footage: "videos/ai_Van_Arriving_Empty_Coastal_Spot.mp4",
    ctaFootage: "videos/couple-cofee-outside-caravan.mp4",
    description: "Parking de tierra\na 50m del mar.\nPlano. Tranquilo.",
    verdict: "DEPENDE",
    verdictColor: AMBER_YELLOW,
    overlayColor: "rgba(251,191,36,0.2)",
    legalExplain: "Servidumbre de Protección — Ley de Costas.",
    legalExplain2: "¿Legal? Depende del municipio.",
    cards: [
      { label: "Natura 2000", dot: GREEN, status: "Fuera", icon: "check" },
      { label: "Parque Nacional", dot: GREEN, status: "Fuera", icon: "check" },
      { label: "Ley de Costas", dot: AMBER_YELLOW, status: "DENTRO", icon: "warn" },
      { label: "Catastro", dot: GREEN, status: "Suelo rústico", icon: "check" },
    ],
  },
};

// ─── Background video helper ───────────────────────────────────────────────────

type BgProps = {
  src: string;
  dim: number;
  zoomFrom?: number;
  zoomTo?: number;
  zoomDuration?: number;
  trimBefore?: number;
};

const Bg: React.FC<BgProps> = ({
  src,
  dim,
  zoomFrom = 1.0,
  zoomTo = 1.09,
  zoomDuration = 90,
  trimBefore = 0,
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
          transformOrigin: "50% 50%",
        }}
      >
        <Video
          src={staticFile(src)}
          muted
          loop
          trimBefore={trimBefore}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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

// ─── Legal check card icon ─────────────────────────────────────────────────────

const CardIcon: React.FC<{ type: "check" | "warn" | "cross"; color: string }> = ({
  type,
  color,
}) => {
  if (type === "check") {
    return (
      <svg width={36} height={36} viewBox="0 0 36 36">
        <circle cx={18} cy={18} r={17} fill="none" stroke={color} strokeWidth={2.5} />
        <polyline
          points="10,18 15.5,23.5 26,12"
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "warn") {
    return (
      <svg width={36} height={36} viewBox="0 0 36 36">
        <circle cx={18} cy={18} r={17} fill="none" stroke={color} strokeWidth={2.5} />
        <line x1={18} y1={11} x2={18} y2={22} stroke={color} strokeWidth={3} strokeLinecap="round" />
        <circle cx={18} cy={27} r={2.5} fill={color} />
      </svg>
    );
  }
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <circle cx={18} cy={18} r={17} fill="none" stroke={color} strokeWidth={2.5} />
      <line x1={12} y1={12} x2={24} y2={24} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <line x1={24} y1={12} x2={12} y2={24} stroke={color} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
};

// ─── SCENE 1: The Question (90f ≈ 3s) ────────────────────────────────────────

const Scene1Question: React.FC<{ data: VariantData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const questionIn = spring({ frame, fps, delay: 3, config: { damping: 180 } });
  const descIn = spring({ frame, fps, delay: 18, config: { damping: 200 } });

  const descLines = data.description.split("\n");

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg src={data.footage} dim={0.38} zoomFrom={1.0} zoomTo={1.1} zoomDuration={90} />

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 700,
          background:
            "linear-gradient(180deg, rgba(15,13,11,0.85) 0%, rgba(15,13,11,0.4) 55%, transparent 100%)",
        }}
      />
      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 700,
          background:
            "linear-gradient(0deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.5) 55%, transparent 100%)",
        }}
      />

      {/* Main question */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: 64,
          right: 64,
          opacity: questionIn,
          transform: `translateY(${interpolate(questionIn, [0, 1], [40, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 90,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.05,
            letterSpacing: -2,
            textShadow: "0 4px 32px rgba(0,0,0,0.95)",
          }}
        >
          ¿Puedes
          <br />
          <span style={{ color: AMBER }}>aparcar</span>
          <br />
          aquí?
        </div>
      </div>

      {/* Spot description */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: 64,
          right: 64,
          opacity: descIn,
          transform: `translateY(${interpolate(descIn, [0, 1], [24, 0])}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 5,
              height: 44,
              background: AMBER_SOFT,
              borderRadius: 3,
              boxShadow: `0 0 12px ${AMBER_SOFT}`,
            }}
          />
          <div
            style={{
              fontFamily: jetbrainsFont,
              fontSize: 28,
              fontWeight: 700,
              color: AMBER_SOFT,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            El spot
          </div>
        </div>
        {descLines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: interFont,
              fontSize: 48,
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.2,
              letterSpacing: -1,
              textShadow: "0 3px 20px rgba(0,0,0,0.9)",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 2: The Countdown (60f ≈ 2s) ───────────────────────────────────────

const Scene2Countdown: React.FC<{ data: VariantData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Darken progressively 0→60
  const darkOverlay = interpolate(frame, [0, 60], [0, 0.45], {
    extrapolateRight: "clamp",
  });

  // Each digit shows for 20 frames: 3 at f=0-19, 2 at f=20-39, 1 at f=40-59
  const getDigit = () => {
    if (frame < 20) return { num: "3", phase: frame };
    if (frame < 40) return { num: "2", phase: frame - 20 };
    return { num: "1", phase: frame - 40 };
  };
  const { num, phase } = getDigit();

  // Pulse: scale from 1.3 → 1.0 in first 8f, then hold
  const scalePulse = interpolate(phase, [0, 8], [1.35, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.5)),
  });

  // Fade out at the end of each digit's window
  const fadeOut = interpolate(phase, [14, 19], [1.0, 0.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = phase < 14 ? 1 : fadeOut;

  // Pulsing ring
  const ringScale = interpolate(phase, [0, 20], [0.8, 1.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(phase, [0, 20], [0.8, 0.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Calculando..." label
  const labelIn = spring({ frame, fps, delay: 2, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg src={data.footage} dim={0.5} zoomFrom={1.08} zoomTo={1.14} zoomDuration={60} trimBefore={60} />

      {/* Progressive darkening */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(15,13,11,${darkOverlay})`,
        }}
      />

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 600,
          background:
            "linear-gradient(180deg, rgba(15,13,11,0.8) 0%, transparent 100%)",
        }}
      />
      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 600,
          background:
            "linear-gradient(0deg, rgba(15,13,11,0.8) 0%, transparent 100%)",
        }}
      />

      {/* Calculando label */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: labelIn,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 34,
            fontWeight: 700,
            color: AMBER_SOFT,
            letterSpacing: 5,
            textTransform: "uppercase" as const,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          Calculando...
        </div>
      </div>

      {/* Countdown number */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Pulse ring */}
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: `4px solid ${AMBER}`,
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
            boxShadow: `0 0 40px ${AMBER}`,
          }}
        />

        <div
          style={{
            opacity,
            transform: `scale(${scalePulse})`,
            fontFamily: jetbrainsFont,
            fontSize: 220,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1,
            textShadow: `0 0 60px rgba(217,119,6,0.7), 0 8px 40px rgba(0,0,0,0.9)`,
          }}
        >
          {num}
        </div>
      </div>

      {/* Tick marks around center */}
      <svg
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.4,
        }}
        width={420}
        height={420}
        viewBox="0 0 420 420"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const r1 = 180;
          const r2 = 200;
          const x1 = 210 + r1 * Math.sin(angle);
          const y1 = 210 - r1 * Math.cos(angle);
          const x2 = 210 + r2 * Math.sin(angle);
          const y2 = 210 - r2 * Math.cos(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={AMBER}
              strokeWidth={i % 3 === 0 ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ─── SCENE 3: The Reveal (150f ≈ 5s) ─────────────────────────────────────────

const Scene3Reveal: React.FC<{ data: VariantData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Verdict slams in
  const verdictIn = spring({ frame, fps, delay: 4, config: { damping: 12, stiffness: 160 } });
  const verdictScale = interpolate(verdictIn, [0, 1], [0.4, 1.0]);
  const verdictOpacity = verdictIn;

  // Explain text fades in after verdict
  const explain1In = spring({ frame, fps, delay: 22, config: { damping: 200 } });
  const explain2In = spring({ frame, fps, delay: 34, config: { damping: 200 } });

  // Cards stagger in from frame 44
  const cardDelays = [44, 62, 80, 98];

  // Color wash overlay fades in
  const washOpacity = interpolate(frame, [0, 15], [0, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg src={data.footage} dim={0.7} zoomFrom={1.12} zoomTo={1.16} zoomDuration={150} trimBefore={30} />

      {/* Color wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: data.overlayColor,
          opacity: washOpacity,
        }}
      />

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 600,
          background:
            "linear-gradient(180deg, rgba(15,13,11,0.85) 0%, rgba(15,13,11,0.4) 60%, transparent 100%)",
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
            "linear-gradient(0deg, rgba(15,13,11,0.9) 0%, rgba(15,13,11,0.5) 60%, transparent 100%)",
        }}
      />

      {/* Verdict */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: verdictOpacity,
          transform: `scale(${verdictScale})`,
        }}
      >
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 190,
            fontWeight: 700,
            color: data.verdictColor,
            lineHeight: 1,
            letterSpacing: -4,
            textShadow: `0 0 80px ${data.verdictColor}88, 0 8px 40px rgba(0,0,0,0.9)`,
          }}
        >
          {data.verdict}
        </div>
      </div>

      {/* Legal explanation */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: 64,
          right: 64,
        }}
      >
        <div
          style={{
            opacity: explain1In,
            transform: `translateY(${interpolate(explain1In, [0, 1], [18, 0])}px)`,
            fontFamily: interFont,
            fontSize: 52,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.2,
            letterSpacing: -1,
            textShadow: "0 3px 20px rgba(0,0,0,0.9)",
            marginBottom: 8,
          }}
        >
          {data.legalExplain}
        </div>
        <div
          style={{
            opacity: explain2In,
            transform: `translateY(${interpolate(explain2In, [0, 1], [14, 0])}px)`,
            fontFamily: interFont,
            fontSize: 40,
            fontWeight: 600,
            color: AMBER_SOFT,
            lineHeight: 1.3,
            letterSpacing: -0.5,
            textShadow: "0 2px 14px rgba(0,0,0,0.9)",
          }}
        >
          {data.legalExplain2}
        </div>
      </div>

      {/* Legal check cards */}
      <div
        style={{
          position: "absolute",
          top: "58%",
          left: 64,
          right: 64,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {data.cards.map((card, i) => {
          const delay = cardDelays[i];
          const cardSpr = spring({ frame, fps, delay, config: { damping: 18, stiffness: 160 } });
          const cardOp = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardX = interpolate(cardSpr, [0, 1], [40, 0]);

          return (
            <div
              key={card.label}
              style={{
                opacity: cardOp,
                transform: `translateX(${cardX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                background: "rgba(15,13,11,0.75)",
                border: `1.5px solid ${card.dot}44`,
                borderRadius: 14,
                padding: "18px 24px",
                backdropFilter: "blur(4px)",
              }}
            >
              {/* Dot */}
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: card.dot,
                  boxShadow: `0 0 12px ${card.dot}`,
                  flexShrink: 0,
                }}
              />
              {/* Label */}
              <div
                style={{
                  fontFamily: jetbrainsFont,
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  flex: 1,
                  letterSpacing: 0.5,
                  textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                }}
              >
                {card.label}
              </div>
              {/* Status */}
              <div
                style={{
                  fontFamily: jetbrainsFont,
                  fontSize: 26,
                  fontWeight: 400,
                  color: card.dot,
                  letterSpacing: 1,
                  textTransform: "uppercase" as const,
                  textShadow: `0 0 12px ${card.dot}88`,
                }}
              >
                {card.status}
              </div>
              {/* Icon */}
              <div style={{ flexShrink: 0 }}>
                <CardIcon type={card.icon} color={card.dot} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 4: CTA (120f ≈ 4s) ─────────────────────────────────────────────────

const Scene4CTA: React.FC<{ data: VariantData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const taglineIn = spring({ frame, fps, delay: 6, config: { damping: 200 } });
  const logoIn = spring({ frame, fps, delay: 28, config: { damping: 14, stiffness: 120 } });
  const ctaIn = spring({ frame, fps, delay: 46, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: WARM_BG, overflow: "hidden" }}>
      <Bg
        src={data.ctaFootage}
        dim={0.52}
        zoomFrom={1.0}
        zoomTo={1.08}
        zoomDuration={120}
      />

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 700,
          background:
            "linear-gradient(180deg, rgba(15,13,11,0.88) 0%, rgba(15,13,11,0.4) 60%, transparent 100%)",
        }}
      />
      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 700,
          background:
            "linear-gradient(0deg, rgba(15,13,11,0.92) 0%, rgba(15,13,11,0.55) 55%, transparent 100%)",
        }}
      />

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: 64,
          right: 64,
          opacity: taglineIn,
          transform: `translateY(${interpolate(taglineIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: interFont,
            fontSize: 66,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.1,
            letterSpacing: -1.5,
            textShadow: "0 4px 32px rgba(0,0,0,0.95)",
          }}
        >
          WildSpotter
          <br />
          <span style={{ color: AMBER }}>te lo dice</span>
          <br />
          antes de llegar.
        </div>
      </div>

      {/* Logo + brand */}
      <div
        style={{
          position: "absolute",
          top: "62%",
          left: "50%",
          transform: `translate(-50%, 0) scale(${interpolate(logoIn, [0, 1], [0.5, 1])})`,
          opacity: logoIn,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Img
          src={staticFile("images/app-logo.png")}
          style={{
            width: 130,
            height: 130,
            borderRadius: 30,
            boxShadow: "0 8px 50px rgba(180,80,10,0.6)",
          }}
        />
        <div
          style={{
            fontFamily: jetbrainsFont,
            fontSize: 36,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: 5,
            textShadow: "0 2px 14px rgba(0,0,0,0.8)",
          }}
        >
          WildSpotter
        </div>
      </div>

      {/* LINK IN BIO badge */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: "50%",
          transform: `translateX(-50%) scale(${interpolate(ctaIn, [0, 1], [0.85, 1])})`,
          opacity: ctaIn,
        }}
      >
        <div
          style={{
            padding: "18px 52px",
            background: AMBER,
            borderRadius: 40,
            fontFamily: interFont,
            fontSize: 32,
            fontWeight: 700,
            color: "#0F0D0B",
            letterSpacing: 2,
            textTransform: "uppercase" as const,
            boxShadow: `0 4px 40px rgba(217,119,6,0.6)`,
          }}
        >
          LINK IN BIO
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Music ────────────────────────────────────────────────────────────────────

const QuizMusic: React.FC<{ variant: string }> = ({ variant }) => {
  const { durationInFrames, fps } = useVideoConfig();

  // The reveal (Scene 3) starts exactly at frame 118 (90 + 60 - 16 - 16) = 3.93s
  // We offset tracks so their section boundaries hit exactly at this moment.
  let trackPath = "audio/music/dark-verdict.mp3";
  let trimBeforeFrames = 0;

  if (variant === "O2") {
    // SÍ (Positive): pulse-reveal.mp3 has a boundary at 41.6s
    trackPath = "audio/music/pulse-reveal.mp3";
    trimBeforeFrames = Math.round((41.6 - 118 / fps) * fps);
  } else if (variant === "O3") {
    // DEPENDE (Amber): sci-fi-score.mp3 has a boundary at 14.0s
    trackPath = "audio/music/sci-fi-score.mp3";
    trimBeforeFrames = Math.round((14.0 - 118 / fps) * fps);
  }

  return (
    <Audio
      src={staticFile(trackPath)}
      trimBefore={trimBeforeFrames}
      volume={(f) => {
        const fadeIn = interpolate(f, [0, fps], [0, 0.45], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(
          f,
          [durationInFrames - 3 * fps, durationInFrames],
          [0.45, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        if (f < fps) return fadeIn;
        if (f > durationInFrames - 3 * fps) return fadeOut;
        return 0.45;
      }}
    />
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────

export const QuizLegal: React.FC<QuizLegalProps> = ({
  variant = "O1",
  withIntro = false,
}) => {
  const data = VARIANT_DATA[variant];

  // Scene durations: S1=90, S2=60, S3=150, S4=120 = 420f total
  // Transitions: 3 fades × 16f each = 48f overlap
  // Net total: 420 frames (accommodated by TransitionSeries overlap)
  const FADE = 16;

  const scenes = (
    <TransitionSeries>
      {/* Scene 1: The Question */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene1Question data={data} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE })}
      />

      {/* Scene 2: The Countdown */}
      <TransitionSeries.Sequence durationInFrames={60}>
        <Scene2Countdown data={data} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE })}
      />

      {/* Scene 3: The Reveal */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Scene3Reveal data={data} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE })}
      />

      {/* Scene 4: CTA */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene4CTA data={data} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );

  return (
    <>
      <QuizMusic variant={variant} />

      {withIntro ? (
        <>
          <Sequence durationInFrames={STORE_INTRO_FRAMES}>
            <StoreInstallIntro />
          </Sequence>
          <Sequence from={STORE_INTRO_FRAMES}>{scenes}</Sequence>
        </>
      ) : (
        scenes
      )}
    </>
  );
};
