import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio } from "@remotion/media";
import { staticFile, useVideoConfig, interpolate, Sequence } from "remotion";
// useVideoConfig is used inside MusicTrack component
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Stars } from "./scenes/Scene2Stars";
import { Scene3Question } from "./scenes/Scene3Question";
import { Scene4Scan } from "./scenes/Scene4Scan";
import { Scene5CTA } from "./scenes/Scene5CTA";

// Concepto A: "El Parking Lleno"
// ~27.3s @ 30fps = 820 net frames after transition overlaps
// Scenes: 130 + 140 + 165 + 200 + 195 = 830 raw + 60 extra = 890 raw
// Transitions: 18 + 18 + 16 + 18 = 70 overlap
// Total: 890 - 70 = 820 frames

const MusicTrack: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();

  return (
    <Audio
      src={staticFile("audio/music/background.mp3")}
      // Trim into the track at ~10s to start on a more cinematic moment
      trimBefore={10 * fps}
      // Fade in over first 1.5s
      // Hold at 0.25 during main video
      // Fade out over last 2s
      volume={(f) => {
        const fadeIn = interpolate(f, [0, 1.5 * fps], [0, 0.28], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(
          f,
          [durationInFrames - 2.5 * fps, durationInFrames],
          [0.28, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        if (f < 1.5 * fps) return fadeIn;
        if (f > durationInFrames - 2.5 * fps) return fadeOut;
        return 0.28;
      }}
    />
  );
};

const ScoreRevealSfx: React.FC = () => (
  <Audio
    src={staticFile("audio/sfx/score-reveal.mp3")}
    volume={0.55}
  />
);

export const ParkingLleno: React.FC = () => {
  // Score SFX fires when results slide in
  // Scene4 starts at: 130 + 140 + 165 - (8+10+10) = 407
  // Score reveal ~frame 58 into Scene4: 407 + 58 = 465
  const sfxGlobalFrame = 465;

  return (
    <>
      {/* Music throughout */}
      <MusicTrack />

      {/* Score reveal SFX when bottom sheet appears */}
      <Sequence from={sfxGlobalFrame}>
        <ScoreRevealSfx />
      </Sequence>

      <TransitionSeries>
        {/* Scene 1: The crowded parking hook */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene1Hook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* Scene 2: Stars, reviews, "no cabe ni un coche" */}
        <TransitionSeries.Sequence durationInFrames={155}>
          <Scene2Stars />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* Scene 3: The pivotal question */}
        <TransitionSeries.Sequence durationInFrames={175}>
          <Scene3Question />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />

        {/* Scene 4: WildSpotter scan in action */}
        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene4Scan />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* Scene 5: Solo van, sunset, CTA */}
        <TransitionSeries.Sequence durationInFrames={195}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
