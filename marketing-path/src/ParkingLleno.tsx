import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio } from "@remotion/media";
import { staticFile, useVideoConfig, interpolate, Sequence } from "remotion";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Stars } from "./scenes/Scene2Stars";
import { Scene3Question } from "./scenes/Scene3Question";
import { Scene4Scan } from "./scenes/Scene4Scan";
import { Scene5CTA } from "./scenes/Scene5CTA";
import { GenericHook } from "./components/GenericHook";
import { StoreInstallIntro, STORE_INTRO_FRAMES } from "./components/StoreInstallIntro";

// Concepto A: "El Parking Lleno"
// Base: 805 frames ≈ 26.8s @ 30fps
// With intro: 805 + 105 = 910 frames ≈ 30.3s

export type ParkingLlenoProps = {
	hookVariant: "A1" | "A2" | "A3";
	withIntro: boolean;
	musicTrack: "background" | "the-journey";
};

const MusicTrack: React.FC<{ src: string }> = ({ src }) => {
  const { durationInFrames, fps } = useVideoConfig();

  return (
    <Audio
      src={staticFile(src)}
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

// --- Hook variant components ---
const HookA2: React.FC = () => (
	<GenericHook
		title={<>Has conducido<br /><span style={{ color: "#D97706", fontStyle: "italic" }}>2 horas</span>.</>}
		subtitle="Y no cabe ni tu furgo."
		videoSrc="videos/crowded_parking_aerial.mp4"
		dimOpacity={0.4}
	/>
);

const HookA3: React.FC = () => (
	<GenericHook
		title={<><span style={{ color: "#D97706" }}>Otras apps</span><br />lo publicaron.</>}
		subtitle="Hoy hay 15 furgos."
		subtitle2="Sin espacio."
		videoSrc="videos/rvs_parked_outdoors.mp4"
		dimOpacity={0.35}
	/>
);

const HOOK_MAP = { A1: Scene1Hook, A2: HookA2, A3: HookA3 } as const;

export const ParkingLleno: React.FC<ParkingLlenoProps> = ({
	hookVariant = "A1",
	withIntro = false,
	musicTrack = "background",
}) => {
	const HookScene = HOOK_MAP[hookVariant];
	const introOffset = withIntro ? STORE_INTRO_FRAMES : 0;

	// Score SFX fires when results slide in (Scene4 ~frame 58)
	const sfxGlobalFrame = introOffset + 465;
	const musicSrc = `audio/music/${musicTrack}.mp3`;

	const scenes = (
		<TransitionSeries>
			<TransitionSeries.Sequence durationInFrames={130}>
				<HookScene />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: 18 })}
			/>

			<TransitionSeries.Sequence durationInFrames={155}>
				<Scene2Stars />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: 18 })}
			/>

			<TransitionSeries.Sequence durationInFrames={175}>
				<Scene3Question />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: 16 })}
			/>

			<TransitionSeries.Sequence durationInFrames={220}>
				<Scene4Scan />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: 18 })}
			/>

			<TransitionSeries.Sequence durationInFrames={195}>
				<Scene5CTA />
			</TransitionSeries.Sequence>
		</TransitionSeries>
	);

	return (
		<>
			<MusicTrack src={musicSrc} />

			<Sequence from={sfxGlobalFrame}>
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
