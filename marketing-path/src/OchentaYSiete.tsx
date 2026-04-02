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

// Concepto B: "87 Spots y Tu No Conoces Ninguno"
//
// Scene durations (raw frames @ 30fps):
//   1. Map Hook:       140f  (4.7s)
//   2. Qualities:      150f  (5.0s)
//   3. Reveal:         130f  (4.3s)
//   4. App Demo:       185f  (6.2s)
//   5. Pipeline:       195f  (6.5s)
//   6. Choice + CTA:   180f  (6.0s)
//   Total raw:         980f
//
// Transitions (all fade 16f):
//   5 transitions × 16f = 80f overlap
//
// Net duration: 980 - 80 = 900f = 30.0s

const MusicTrack: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();

  return (
    <Audio
      src={staticFile("audio/music/epic-drums.mp3")}
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

export const OchentaYSiete: React.FC = () => {
  // Scene start times (accounting for transition overlaps, all fade 16f):
  // Scene1: 0
  // Scene2: 140 - 16 = 124
  // Scene3: 124 + 150 - 16 = 258
  // Scene4: 258 + 130 - 16 = 372
  // Scene5: 372 + 185 - 16 = 541
  // Scene6: 541 + 195 - 16 = 720

  // Radar ping when scan starts in Scene4 (~22f into Scene4)
  const radarPingFrame = 372 + 22;

  // Score reveal when pipeline score appears in Scene5 (~100f into Scene5)
  const scoreRevealFrame = 541 + 100;

  return (
    <>
      <MusicTrack />

      <Sequence from={radarPingFrame}>
        <RadarPingSfx />
      </Sequence>

      <Sequence from={scoreRevealFrame}>
        <ScoreRevealSfx />
      </Sequence>

      <TransitionSeries>
        {/* Scene 1: Aerial coast + dark map — animated 87 counter */}
        <TransitionSeries.Sequence durationInFrames={140}>
          <Scene1Map />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 2: "Planos. Legales. Con vistas al mar." */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene2Qualities />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 3: "Y no están en ninguna app de reviews." */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene3Reveal />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 4: App demo — scan, radar, results */}
        <TransitionSeries.Sequence durationInFrames={185}>
          <Scene4Demo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 5: Pipeline — 5 layers, score 92 */}
        <TransitionSeries.Sequence durationInFrames={195}>
          <Scene5Pipeline />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 6: Split footage comparison + "Elige." + CTA */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene6Choice />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
