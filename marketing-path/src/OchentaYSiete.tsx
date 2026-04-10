import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio } from "@remotion/media";
import { staticFile, useVideoConfig, interpolate, Sequence } from "remotion";
import { Scene1Map } from "./scenes-87/Scene1Map";
import { Scene2Qualities } from "./scenes-87/Scene2Qualities";
import { Scene3Reveal } from "./scenes-87/Scene3Reveal";
import { Scene4Demo } from "./scenes-87/Scene4Demo";
import { Scene5Pipeline } from "./scenes-87/Scene5Pipeline";
import { Scene6Choice } from "./scenes-87/Scene6Choice";
import { GenericHook } from "./components/GenericHook";
import { StoreInstallIntro, STORE_INTRO_FRAMES } from "./components/StoreInstallIntro";

// Concepto B: "87 Spots y Tu No Conoces Ninguno"
// Base: 900 frames = 30.0s @ 30fps
// With intro: 900 + 105 = 1005 frames = 33.5s

export type OchentaYSieteProps = {
  hookVariant: "B1" | "B2" | "B3";
  withIntro: boolean;
  musicTrack: "epic-drums" | "spirit-in-the-woods";
};

const MusicTrack: React.FC<{ src: string }> = ({ src }) => {
  const { durationInFrames, fps } = useVideoConfig();

  return (
    <Audio
      src={staticFile(src)}
      trimBefore={2 * fps}
      volume={(f) => {
        const fadeIn = interpolate(f, [0, 1.5 * fps], [0, 0.32], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Volume dip during Scene 3 for dramatic pause
        const revealDip = interpolate(
          f,
          [230, 252, 310, 340],
          [1, 0.3, 0.3, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const fadeOut = interpolate(
          f,
          [durationInFrames - 3 * fps, durationInFrames],
          [0.32, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        if (f < 1.5 * fps) return fadeIn * revealDip;
        if (f > durationInFrames - 3 * fps) return fadeOut * revealDip;
        return 0.32 * revealDip;
      }}
    />
  );
};

const RadarPingSfx: React.FC = () => (
  <Audio src={staticFile("audio/sfx/radar-ping.mp3")} volume={0.45} />
);

const ScoreRevealSfx: React.FC = () => (
  <Audio src={staticFile("audio/sfx/score-reveal.mp3")} volume={0.5} />
);

// --- Hook variants ---
const HookB2: React.FC = () => (
  <GenericHook
    title={<>Hay <span style={{ color: "#D97706" }}>87 spots</span> vacíos<br />a 1h de ti.</>}
    subtitle="Planos. Legales. Con vistas."
    videoSrc="videos/drone_mountains.mp4"
    dimOpacity={0.4}
  />
);

const HookB3: React.FC = () => (
  <GenericHook
    title={<><span style={{ color: "#D97706" }}>Ninguna app</span><br />conoce estos 87 spots.</>}
    subtitle="Porque no vienen de reviews."
    videoSrc="videos/ai_Spanish_Countryside_Van_Video.mp4"
    dimOpacity={0.35}
  />
);

const HOOK_MAP = { B1: Scene1Map, B2: HookB2, B3: HookB3 } as const;

export const OchentaYSiete: React.FC<OchentaYSieteProps> = ({
  hookVariant = "B1",
  withIntro = false,
  musicTrack = "epic-drums",
}) => {
  const HookScene = HOOK_MAP[hookVariant];
  const introOffset = withIntro ? STORE_INTRO_FRAMES : 0;
  const musicSrc = `audio/music/${musicTrack}.mp3`;

  // SFX timings (offset by intro if present)
  const radarPingFrame = introOffset + 372 + 22;
  const scoreRevealFrame = introOffset + 541 + 100;

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
        <Scene2Qualities />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 16 })}
      />

      <TransitionSeries.Sequence durationInFrames={130}>
        <Scene3Reveal />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 16 })}
      />

      <TransitionSeries.Sequence durationInFrames={185}>
        <Scene4Demo />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 16 })}
      />

      <TransitionSeries.Sequence durationInFrames={195}>
        <Scene5Pipeline />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 16 })}
      />

      <TransitionSeries.Sequence durationInFrames={180}>
        <Scene6Choice />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );

  return (
    <>
      <MusicTrack src={musicSrc} />

      <Sequence from={radarPingFrame}>
        <RadarPingSfx />
      </Sequence>

      <Sequence from={scoreRevealFrame}>
        <ScoreRevealSfx />
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
