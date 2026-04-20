import "./index.css";
import { Composition, Folder } from "remotion";
import { ParkingLleno } from "./ParkingLleno";
import { Natura2000Clip } from "./Natura2000Clip";
import { LaMulta } from "./LaMulta";
import { OchentaYSiete } from "./OchentaYSiete";
import { ElPipeline } from "./ElPipeline";
import { FruitStory, FRUIT_STORY_FRAMES } from "./FruitStory";
import { STORE_INTRO_FRAMES } from "./components/StoreInstallIntro";
import { LasCoordenadas, LAS_COORDENADAS_FRAMES } from "./LasCoordenadas";

// --- Base durations (without intro) ---
const PARKING_LLENO_FRAMES = 805;
const NATURA2000_FRAMES = 482;
const LA_MULTA_FRAMES = 766;
const OCHENTA_Y_SIETE_FRAMES = 900;
const EL_PIPELINE_FRAMES = 836;

const FPS = 30;
const W = 1080;
const H = 1920;

// Helper to register a composition with and without intro
type VariantConfig<P> = {
	id: string;
	component: React.FC<P>;
	baseFrames: number;
	props: P;
};

const Variant = <P extends Record<string, unknown>>({
	id,
	component: Comp,
	baseFrames,
	props,
}: VariantConfig<P> & { children?: never }) => {
	const withIntro = (props as Record<string, unknown>).withIntro as boolean;
	const duration = withIntro ? baseFrames + STORE_INTRO_FRAMES : baseFrames;
	return (
		<Composition
			id={id}
			component={Comp}
			durationInFrames={duration}
			fps={FPS}
			width={W}
			height={H}
			defaultProps={props}
		/>
	);
};

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* ============ ParkingLleno ============ */}
			<Folder name="ParkingLleno">
				<Variant
					id="ParkingLleno"
					component={ParkingLleno}
					baseFrames={PARKING_LLENO_FRAMES}
					props={{
						hookVariant: "A1" as const,
						withIntro: false,
						musicTrack: "background" as const,
					}}
				/>
				<Variant
					id="ParkingLleno-A2"
					component={ParkingLleno}
					baseFrames={PARKING_LLENO_FRAMES}
					props={{
						hookVariant: "A2" as const,
						withIntro: false,
						musicTrack: "the-journey" as const,
					}}
				/>
				<Variant
					id="ParkingLleno-A3"
					component={ParkingLleno}
					baseFrames={PARKING_LLENO_FRAMES}
					props={{
						hookVariant: "A3" as const,
						withIntro: false,
						musicTrack: "the-journey" as const,
					}}
				/>
				<Variant
					id="ParkingLleno-Intro"
					component={ParkingLleno}
					baseFrames={PARKING_LLENO_FRAMES}
					props={{
						hookVariant: "A1" as const,
						withIntro: true,
						musicTrack: "background" as const,
					}}
				/>
				<Variant
					id="ParkingLleno-A2-Intro"
					component={ParkingLleno}
					baseFrames={PARKING_LLENO_FRAMES}
					props={{
						hookVariant: "A2" as const,
						withIntro: true,
						musicTrack: "the-journey" as const,
					}}
				/>
				<Variant
					id="ParkingLleno-A3-Intro"
					component={ParkingLleno}
					baseFrames={PARKING_LLENO_FRAMES}
					props={{
						hookVariant: "A3" as const,
						withIntro: true,
						musicTrack: "the-journey" as const,
					}}
				/>
			</Folder>

			{/* ============ Natura2000Clip ============ */}
			<Folder name="Natura2000Clip">
				<Variant
					id="Natura2000Clip"
					component={Natura2000Clip}
					baseFrames={NATURA2000_FRAMES}
					props={{
						hookVariant: "N1" as const,
						withIntro: false,
						musicTrack: "tension" as const,
					}}
				/>
				<Variant
					id="Natura2000Clip-N2"
					component={Natura2000Clip}
					baseFrames={NATURA2000_FRAMES}
					props={{
						hookVariant: "N2" as const,
						withIntro: false,
						musicTrack: "digital-clouds" as const,
					}}
				/>
				<Variant
					id="Natura2000Clip-Intro"
					component={Natura2000Clip}
					baseFrames={NATURA2000_FRAMES}
					props={{
						hookVariant: "N1" as const,
						withIntro: true,
						musicTrack: "tension" as const,
					}}
				/>
				<Variant
					id="Natura2000Clip-N2-Intro"
					component={Natura2000Clip}
					baseFrames={NATURA2000_FRAMES}
					props={{
						hookVariant: "N2" as const,
						withIntro: true,
						musicTrack: "digital-clouds" as const,
					}}
				/>
			</Folder>

			{/* ============ LaMulta ============ */}
			<Folder name="LaMulta">
				<Variant
					id="LaMulta"
					component={LaMulta}
					baseFrames={LA_MULTA_FRAMES}
					props={{
						hookVariant: "C1" as const,
						withIntro: false,
						musicTrack: "suspense" as const,
					}}
				/>
				<Variant
					id="LaMulta-C2"
					component={LaMulta}
					baseFrames={LA_MULTA_FRAMES}
					props={{
						hookVariant: "C2" as const,
						withIntro: false,
						musicTrack: "echoes" as const,
					}}
				/>
				<Variant
					id="LaMulta-C3"
					component={LaMulta}
					baseFrames={LA_MULTA_FRAMES}
					props={{
						hookVariant: "C3" as const,
						withIntro: false,
						musicTrack: "echoes" as const,
					}}
				/>
				<Variant
					id="LaMulta-Intro"
					component={LaMulta}
					baseFrames={LA_MULTA_FRAMES}
					props={{
						hookVariant: "C1" as const,
						withIntro: true,
						musicTrack: "suspense" as const,
					}}
				/>
				<Variant
					id="LaMulta-C2-Intro"
					component={LaMulta}
					baseFrames={LA_MULTA_FRAMES}
					props={{
						hookVariant: "C2" as const,
						withIntro: true,
						musicTrack: "echoes" as const,
					}}
				/>
				<Variant
					id="LaMulta-C3-Intro"
					component={LaMulta}
					baseFrames={LA_MULTA_FRAMES}
					props={{
						hookVariant: "C3" as const,
						withIntro: true,
						musicTrack: "echoes" as const,
					}}
				/>
			</Folder>

			{/* ============ OchentaYSiete ============ */}
			<Folder name="OchentaYSiete">
				<Variant
					id="OchentaYSiete"
					component={OchentaYSiete}
					baseFrames={OCHENTA_Y_SIETE_FRAMES}
					props={{
						hookVariant: "B1" as const,
						withIntro: false,
						musicTrack: "epic-drums" as const,
					}}
				/>
				<Variant
					id="OchentaYSiete-B2"
					component={OchentaYSiete}
					baseFrames={OCHENTA_Y_SIETE_FRAMES}
					props={{
						hookVariant: "B2" as const,
						withIntro: false,
						musicTrack: "spirit-in-the-woods" as const,
					}}
				/>
				<Variant
					id="OchentaYSiete-B3"
					component={OchentaYSiete}
					baseFrames={OCHENTA_Y_SIETE_FRAMES}
					props={{
						hookVariant: "B3" as const,
						withIntro: false,
						musicTrack: "spirit-in-the-woods" as const,
					}}
				/>
				<Variant
					id="OchentaYSiete-Intro"
					component={OchentaYSiete}
					baseFrames={OCHENTA_Y_SIETE_FRAMES}
					props={{
						hookVariant: "B1" as const,
						withIntro: true,
						musicTrack: "epic-drums" as const,
					}}
				/>
				<Variant
					id="OchentaYSiete-B2-Intro"
					component={OchentaYSiete}
					baseFrames={OCHENTA_Y_SIETE_FRAMES}
					props={{
						hookVariant: "B2" as const,
						withIntro: true,
						musicTrack: "spirit-in-the-woods" as const,
					}}
				/>
				<Variant
					id="OchentaYSiete-B3-Intro"
					component={OchentaYSiete}
					baseFrames={OCHENTA_Y_SIETE_FRAMES}
					props={{
						hookVariant: "B3" as const,
						withIntro: true,
						musicTrack: "spirit-in-the-woods" as const,
					}}
				/>
			</Folder>

			{/* ============ ElPipeline ============ */}
			<Folder name="ElPipeline">
				<Variant
					id="ElPipeline"
					component={ElPipeline}
					baseFrames={EL_PIPELINE_FRAMES}
					props={{
						hookVariant: "D1" as const,
						withIntro: false,
						musicTrack: "sci-fi-score" as const,
					}}
				/>
				<Variant
					id="ElPipeline-D2"
					component={ElPipeline}
					baseFrames={EL_PIPELINE_FRAMES}
					props={{
						hookVariant: "D2" as const,
						withIntro: false,
						musicTrack: "voxscape" as const,
					}}
				/>
				<Variant
					id="ElPipeline-D3"
					component={ElPipeline}
					baseFrames={EL_PIPELINE_FRAMES}
					props={{
						hookVariant: "D3" as const,
						withIntro: false,
						musicTrack: "voxscape" as const,
					}}
				/>
				<Variant
					id="ElPipeline-Intro"
					component={ElPipeline}
					baseFrames={EL_PIPELINE_FRAMES}
					props={{
						hookVariant: "D1" as const,
						withIntro: true,
						musicTrack: "sci-fi-score" as const,
					}}
				/>
				<Variant
					id="ElPipeline-D2-Intro"
					component={ElPipeline}
					baseFrames={EL_PIPELINE_FRAMES}
					props={{
						hookVariant: "D2" as const,
						withIntro: true,
						musicTrack: "voxscape" as const,
					}}
				/>
				<Variant
					id="ElPipeline-D3-Intro"
					component={ElPipeline}
					baseFrames={EL_PIPELINE_FRAMES}
					props={{
						hookVariant: "D3" as const,
						withIntro: true,
						musicTrack: "voxscape" as const,
					}}
				/>
			</Folder>

			<Folder name="FruitStory">
				<Variant
					id="FruitStory"
					component={FruitStory}
					baseFrames={FRUIT_STORY_FRAMES}
					props={{ hookVariant: "F1" as const, withIntro: false }}
				/>
			</Folder>

			{/* ============ LasCoordenadas (Concepto E) ============ */}
			<Folder name="LasCoordenadas">
				<Composition
					id="LasCoordenadas-E1"
					component={LasCoordenadas}
					durationInFrames={LAS_COORDENADAS_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "E1" as const,
						musicTrack: "spirit-in-the-woods" as const,
					}}
				/>
				<Composition
					id="LasCoordenadas-E2"
					component={LasCoordenadas}
					durationInFrames={LAS_COORDENADAS_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "E2" as const,
						musicTrack: "spirit-in-the-woods" as const,
					}}
				/>
				<Composition
					id="LasCoordenadas-E3"
					component={LasCoordenadas}
					durationInFrames={LAS_COORDENADAS_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "E3" as const,
						musicTrack: "spirit-in-the-woods" as const,
					}}
				/>
			</Folder>
		</>
	);
};
