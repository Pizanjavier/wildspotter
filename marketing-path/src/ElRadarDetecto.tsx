import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import { Scene1Scanning } from "./scenes-radar/Scene1Scanning";
import { Scene2Data } from "./scenes-radar/Scene2Data";
import { Scene3Satellite } from "./scenes-radar/Scene3Satellite";
import { Scene4Score } from "./scenes-radar/Scene4Score";
import { Scene5CTA } from "./scenes-radar/Scene5CTA";

loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
loadJetBrains("normal", { weights: ["400", "700"], subsets: ["latin"] });

const S1_DUR = 120;
const S2_DUR = 165;
const S3_DUR = 180;
const S4_DUR = 165;
const S5_DUR = 120;
const TRANSITION_FRAMES = 18;

export const EL_RADAR_DETECTO_FRAMES =
	S1_DUR + S2_DUR + S3_DUR + S4_DUR + S5_DUR - 4 * TRANSITION_FRAMES;

export type SpotData = {
	satelliteImage: string;
	score: number;
	aiScore: number;
	slope: number;
	elevation: number;
	surface: string;
	buildingsNearby: number;
	roadNoise: string;
	scenicFeature: string;
	wildBonus: number;
	landcover: string;
	legal: {
		natura: boolean;
		park: boolean;
		coastal: boolean;
		cadastre: string;
	};
	// Video footage per scene
	videoS1: string;
	videoS2: string;
	videoS5: string;
};

export type ElRadarDetectoProps = {
	hookVariant: "RD1" | "RD2" | "RD3" | "RD4";
	spot: SpotData;
};

export const ElRadarDetecto: React.FC<ElRadarDetectoProps> = ({ spot }) => {
	const { durationInFrames } = useVideoConfig();

	return (
		<AbsoluteFill style={{ background: "#0F0D0B" }}>
			<Audio
				src={staticFile("audio/music/cyber-decrypt.mp3")}
				volume={(f) =>
					interpolate(
						f,
						[0, 20, durationInFrames - 90, durationInFrames],
						[0, 0.65, 0.65, 0],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					)
				}
			/>

			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={S1_DUR}>
					<Scene1Scanning videoSrc={spot.videoS1} />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
					presentation={fade()}
				/>

				<TransitionSeries.Sequence durationInFrames={S2_DUR}>
					<Scene2Data
						videoSrc={spot.videoS2}
						slope={spot.slope}
						elevation={spot.elevation}
						surface={spot.surface}
						buildingsNearby={spot.buildingsNearby}
						roadNoise={spot.roadNoise}
						scenicFeature={spot.scenicFeature}
					/>
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
					presentation={fade()}
				/>

				<TransitionSeries.Sequence durationInFrames={S3_DUR}>
					<Scene3Satellite satelliteImage={spot.satelliteImage} />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
					presentation={fade()}
				/>

				<TransitionSeries.Sequence durationInFrames={S4_DUR}>
					<Scene4Score
						satelliteImage={spot.satelliteImage}
						score={spot.score}
						wildBonus={spot.wildBonus}
						legal={spot.legal}
					/>
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
					presentation={fade()}
				/>

				<TransitionSeries.Sequence durationInFrames={S5_DUR}>
					<Scene5CTA videoSrc={spot.videoS5} />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</AbsoluteFill>
	);
};
