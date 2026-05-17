import "./index.css";
import { Composition, Folder, Still } from "remotion";
import { ParkingLleno } from "./ParkingLleno";
import { Natura2000Clip } from "./Natura2000Clip";
import { LaMulta } from "./LaMulta";
import { OchentaYSiete } from "./OchentaYSiete";
import { ElPipeline } from "./ElPipeline";
import { FruitStory, FRUIT_STORY_FRAMES } from "./FruitStory";
import { STORE_INTRO_FRAMES } from "./components/StoreInstallIntro";
import { LasCoordenadas, LAS_COORDENADAS_FRAMES } from "./LasCoordenadas";
import { DatoHero, DATO_HERO_FRAMES } from "./DatoHero";
import { OjoSatelite, OJO_SATELITE_FRAMES } from "./OjoSatelite";
import { Gatekeeping, GATEKEEPING_FRAMES } from "./Gatekeeping";
import { BetaCallout, BETA_CALLOUT_FRAMES } from "./BetaCallout";
import { ElPrimerCafe, EL_PRIMER_CAFE_FRAMES } from "./ElPrimerCafe";
import { TuPerroLoSabe, TU_PERRO_LO_SABE_FRAMES } from "./TuPerroLoSabe";
import { NoLoBusque, NO_LO_BUSQUE_FRAMES } from "./NoLoBusque";
import {
	MientrasTodosBuscan,
	MIENTRAS_TODOS_BUSCAN_FRAMES,
} from "./MientrasTodosBuscan";
import { IOSLaunch, IOS_LAUNCH_FRAMES } from "./iOSLaunch";
import { CarouselSlide, SlideData } from "./CarouselSlide";
import { ElRadarEncontro, EL_RADAR_ENCONTRO_FRAMES } from "./ElRadarEncontro";
import { StoryRadarEncontro } from "./StoryRadarEncontro";
import { QuizLegal, QUIZ_LEGAL_FRAMES } from "./QuizLegal";
import { StoryPoll } from "./StoryPoll";
import { StoryQuizLegal } from "./StoryQuizLegal";
import { StoryCountdown } from "./StoryCountdown";
import { StoryAnticipationMay10 } from "./StoryAnticipationMay10";
import { StoryBTS } from "./StoryBTS";
import { PuenteDeMayo, PUENTE_DE_MAYO_FRAMES } from "./PuenteDeMayo";
import { StoryPuenteUrgencia } from "./StoryPuenteUrgencia";
import {
	ElRadarDetecto,
	EL_RADAR_DETECTO_FRAMES,
	type SpotData,
} from "./ElRadarDetecto";
import { AndroidLaunch, ANDROID_LAUNCH_FRAMES } from "./AndroidLaunch";
import { UnNoventa, UN_NOVENTA_FRAMES } from "./UnNoventa";
import { ElProblema, EL_PROBLEMA_FRAMES } from "./ElProblema";
import { OchoTresMil, OCHO_TRES_MIL_FRAMES } from "./OchoTresMil";
import { ElPeorMomento, EL_PEOR_MOMENTO_FRAMES } from "./ElPeorMomento";
import { Debate, DEBATE_FRAMES } from "./Debate";
import { MayoMejorMes, MAYO_MEJOR_MES_FRAMES } from "./MayoMejorMes";
// --- Base durations (without intro) ---
const PARKING_LLENO_FRAMES = 805;
const NATURA2000_FRAMES = 482;
const LA_MULTA_FRAMES = 766;
const OCHENTA_Y_SIETE_FRAMES = 900;
const EL_PIPELINE_FRAMES = 926;

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

// --- Carousel slide data ---

const CAROUSEL_LEGAL: SlideData[] = [
	{
		number: 1,
		total: 6,
		title: "5 Zonas Donde NO Puedes Aparcar",
		body: "En Espana hay miles de zonas protegidas. Conocerlas es tu responsabilidad.",
		accentColor: "#EF4444",
	},
	{
		number: 2,
		total: 6,
		title: "Red Natura 2000",
		body: "1.636 zonas protegidas por la UE. Acampar dentro puede suponer multas de hasta 600€.",
		accentColor: "#EF4444",
		icon: "N2",
	},
	{
		number: 3,
		total: 6,
		title: "Parques Nacionales",
		body: "16 parques nacionales + cientos de parques naturales. Prohibido pernoctar fuera de zonas habilitadas.",
		accentColor: "#EF4444",
		icon: "PN",
	},
	{
		number: 4,
		total: 6,
		title: "Ley de Costas",
		body: "Dominio publico maritimo-terrestre: los primeros 20m desde la linea de costa. Servidumbre de proteccion: hasta 100m.",
		accentColor: "#EF4444",
		icon: "LC",
	},
	{
		number: 5,
		total: 6,
		title: "Catastro: Suelo Urbano",
		body: "Si el Catastro clasifica la parcela como urbana, es propiedad privada. Aparcar ahí es ocupar.",
		accentColor: "#EF4444",
		icon: "CA",
	},
	{
		number: 6,
		total: 6,
		title: "",
		body: "WildSpotter cruza todas estas capas automaticamente.",
		accentColor: "#EF4444",
	},
];

const CAROUSEL_PIPELINE: SlideData[] = [
	{
		number: 1,
		total: 9,
		title: "7 Capas de Análisis",
		body: "Cada spot pasa por 7 filtros antes de llegar a tu pantalla.",
		accentColor: "#22D3EE",
	},
	{
		number: 2,
		total: 9,
		title: "Radar",
		body: "Escanea OpenStreetMap para encontrar finales de camino, parkings de tierra y claros accesibles.",
		accentColor: "#22D3EE",
		icon: "01",
	},
	{
		number: 3,
		total: 9,
		title: "Terreno",
		body: "Analiza pendiente y elevación con datos Terrain-RGB. Si no es plano, tu furgo no duerme cómoda.",
		accentColor: "#22D3EE",
		icon: "02",
	},
	{
		number: 4,
		total: 9,
		title: "Legal",
		body: "Cruza con Natura 2000, Parques Nacionales, Ley de Costas y Catastro. Te dice en que zona estás.",
		accentColor: "#22D3EE",
		icon: "03",
	},
	{
		number: 5,
		total: 9,
		title: "Satélite (IA)",
		body: "Claude Haiku 4.5 analiza ortofoto PNOA a 25cm/px: superficie, acceso, espacio abierto, obstrucciones.",
		accentColor: "#22D3EE",
		icon: "04",
	},
	{
		number: 6,
		total: 9,
		title: "Contexto",
		body: "Ruido de carretera, densidad urbana, valor escénico, privacidad, zonas industriales.",
		accentColor: "#22D3EE",
		icon: "05",
	},
	{
		number: 7,
		total: 9,
		title: "Uso del Suelo",
		body: "CORINE Land Cover 2018: clasifica el terreno en 44 categorias. Bonus para costa, bosque, alpine. Penalización para agrícola o urbano.",
		accentColor: "#22D3EE",
		icon: "06",
	},
	{
		number: 8,
		total: 9,
		title: "Score Final",
		body: "Terreno x10% + IA x55% + Contexto x15% + bonus salvaje - penalización suelo. De 0 a 100.",
		accentColor: "#22D3EE",
		icon: "07",
	},
	{
		number: 9,
		total: 9,
		title: "",
		body: "83.006 spots analizados. Solo 393 con score > 70.",
		accentColor: "#22D3EE",
	},
];

const CAROUSEL_SCORING: SlideData[] = [
	{
		number: 1,
		total: 6,
		title: "Como Se Calcula Tu Score",
		body: "De 0 a 100. Cada número cuenta una historia sobre el spot.",
		accentColor: "#4ADE80",
	},
	{
		number: 2,
		total: 6,
		title: "IA Satelital: 55%",
		body: "El factor más importante. Claude Haiku analiza la ortofoto: superficie, acceso, espacio abierto, obstrucciones.",
		accentColor: "#4ADE80",
		icon: "55",
	},
	{
		number: 3,
		total: 6,
		title: "Contexto: 15%",
		body: "Ruido de carretera, densidad urbana, valor escénico, privacidad. El entorno importa tanto como el spot.",
		accentColor: "#4ADE80",
		icon: "15",
	},
	{
		number: 4,
		total: 6,
		title: "Terreno: 10%",
		body: "Pendiente y elevación. Un spot bonito con 15% de inclinación no sirve para dormir.",
		accentColor: "#4ADE80",
		icon: "10",
	},
	{
		number: 5,
		total: 6,
		title: "Bonus y Penalizaciones",
		body: "Costa, bosque o mirador: hasta +30 puntos. Zona agrícola o industrial: penalización.",
		accentColor: "#4ADE80",
		icon: "±",
	},
	{
		number: 6,
		total: 6,
		title: "",
		body: "Sin opiniones. Sin reviews. Solo datos.",
		accentColor: "#4ADE80",
	},
];

const CAROUSEL_MYSTERY: SlideData[] = [
	{
		number: 1,
		total: 5,
		title: "Datos vs Reviews",
		body: "¿Qué pasa cuando un spot se hace famoso?",
		accentColor: "#D97706",
	},
	{
		number: 2,
		total: 5,
		title: "El Problema",
		body: "Un spot con 3 reviews: tranquilo, limpio, tuyo. El mismo spot con 300 reviews: masificado, sucio, de todos.",
		accentColor: "#D97706",
		icon: "!",
	},
	{
		number: 3,
		total: 5,
		title: "La Diferencia",
		body: "Las apps de reviews comparten spots. WildSpotter los calcula. Cada usuario descubre los suyos.",
		accentColor: "#D97706",
		icon: "≠",
	},
	{
		number: 4,
		total: 5,
		title: "Tu Radar Personal",
		body: "83.006 spots analizados con 7 capas de datos. Terreno, satélite, legal, contexto. Sin opiniones humanas.",
		accentColor: "#D97706",
		icon: "◎",
	},
	{
		number: 5,
		total: 5,
		title: "",
		body: "Los mejores spots no se comparten. Se calculan.",
		accentColor: "#D97706",
	},
];

const CAROUSEL_T1: SlideData[] = [
	{
		number: 1,
		total: 6,
		title: "5 señales de que un spot va a ser bueno",
		body: "El radar lo analiza todo antes de que llegues.",
		accentColor: "#4ADE80",
	},
	{
		number: 2,
		total: 6,
		title: "Final de camino sin salida",
		body: "Sin tráfico de paso. El radar busca finales de camino y pistas sin salida.",
		accentColor: "#4ADE80",
		icon: "01",
	},
	{
		number: 3,
		total: 6,
		title: "0 edificios en 300m",
		body: "Sin vecinos = sin quejas. La densidad urbana es uno de los factores con más peso en el score de contexto.",
		accentColor: "#4ADE80",
		icon: "02",
	},
	{
		number: 4,
		total: 6,
		title: "Pendiente < 5%",
		body: "Suelo plano. El Topógrafo mide la inclinación con Terrain-RGB. Por encima del 15% tu furgo no descansa.",
		accentColor: "#4ADE80",
		icon: "03",
	},
	{
		number: 5,
		total: 6,
		title: "Verde en 4 capas legales",
		body: "Fuera de zonas protegidas. Natura 2000, Parques Nacionales, Ley de Costas y Catastro — los 4 checks legales del radar.",
		accentColor: "#4ADE80",
		icon: "04",
	},
	{
		number: 6,
		total: 6,
		title: "Score > 70",
		body: "¿Qué señal es la más importante para ti? WildSpotter las procesa todas. Link en bio.",
		accentColor: "#4ADE80",
	},
];

const CAROUSEL_U1: SlideData[] = [
	{
		number: 1,
		total: 6,
		title: "Por qué los mejores spots no tienen reviews",
		body: "La paradoja que destruye los lugares que más quieres.",
		accentColor: "#D97706",
	},
	{
		number: 2,
		total: 6,
		title: "Un spot descubierto",
		body: "3 reviews: tranquilo, limpio, tuyo.",
		accentColor: "#D97706",
		icon: "①",
	},
	{
		number: 3,
		total: 6,
		title: "6 meses después",
		body: "300 reviews. Lleno cada fin de semana. Basura. Ruido. Ya no es tuyo.",
		accentColor: "#D97706",
		icon: "②",
	},
	{
		number: 4,
		total: 6,
		title: "El problema no es la app",
		body: "Es la lógica. Cuanto más se comparte, más se arruina. Las apps de reviews tienen ese bucle integrado.",
		accentColor: "#D97706",
		icon: "③",
	},
	{
		number: 5,
		total: 6,
		title: "WildSpotter no comparte spots",
		body: "Los calcula. Cada usuario descubre los suyos con datos: terreno, satélite, legal. Tu spot es tuyo porque nadie más lo calculó.",
		accentColor: "#D97706",
		icon: "④",
	},
	{
		number: 6,
		total: 6,
		title: "",
		body: "¿De acuerdo? Guárdalo. Envíaselo a tu copiloto. Link en bio.",
		accentColor: "#D97706",
	},
];

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

			{/* ============ DatoHero (Concepto H) ============ */}
			<Folder name="DatoHero">
				<Composition
					id="DatoHero-H1"
					component={DatoHero}
					durationInFrames={DATO_HERO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "H1" as const,
						musicTrack: "sci-fi-score" as const,
					}}
				/>
				<Composition
					id="DatoHero-H2"
					component={DatoHero}
					durationInFrames={DATO_HERO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "H2" as const,
						musicTrack: "sci-fi-score" as const,
					}}
				/>
				<Composition
					id="DatoHero-H3"
					component={DatoHero}
					durationInFrames={DATO_HERO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "H3" as const,
						musicTrack: "sci-fi-score" as const,
					}}
				/>
			</Folder>

			{/* ============ OjoSatelite (Concepto I) ============ */}
			<Folder name="OjoSatelite">
				<Composition
					id="OjoSatelite-I1"
					component={OjoSatelite}
					durationInFrames={OJO_SATELITE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "I1" as const,
						musicTrack: "sci-fi-score" as const,
					}}
				/>
				<Composition
					id="OjoSatelite-I2"
					component={OjoSatelite}
					durationInFrames={OJO_SATELITE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "I2" as const,
						musicTrack: "sci-fi-score" as const,
					}}
				/>
			</Folder>

			{/* ============ Gatekeeping (Concepto K) ============ */}
			<Folder name="Gatekeeping">
				<Composition
					id="Gatekeeping-K1"
					component={Gatekeeping}
					durationInFrames={GATEKEEPING_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "K1" as const,
					}}
				/>
				<Composition
					id="Gatekeeping-K2"
					component={Gatekeeping}
					durationInFrames={GATEKEEPING_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "K2" as const,
					}}
				/>
			</Folder>

			{/* ============ BetaCallout ============ */}
			<Folder name="BetaCallout">
				<Composition
					id="BetaCallout"
					component={BetaCallout}
					durationInFrames={BETA_CALLOUT_FRAMES}
					fps={FPS}
					width={W}
					height={H}
				/>
			</Folder>

			{/* ============ ElPrimerCafe ============ */}
			<Folder name="ElPrimerCafe">
				<Composition
					id="ElPrimerCafe-PC1"
					component={ElPrimerCafe}
					durationInFrames={EL_PRIMER_CAFE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "PC1" as const,
						musicTrack: "the-journey" as const,
					}}
				/>
				<Composition
					id="ElPrimerCafe-PC2"
					component={ElPrimerCafe}
					durationInFrames={EL_PRIMER_CAFE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "PC2" as const,
						musicTrack: "the-journey" as const,
					}}
				/>
				<Composition
					id="ElPrimerCafe-PC3"
					component={ElPrimerCafe}
					durationInFrames={EL_PRIMER_CAFE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "PC3" as const,
						musicTrack: "golden-fields" as const,
					}}
				/>
			</Folder>

			{/* ============ TuPerroLoSabe ============ */}
			<Folder name="TuPerroLoSabe">
				<Composition
					id="TuPerroLoSabe-P1"
					component={TuPerroLoSabe}
					durationInFrames={TU_PERRO_LO_SABE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "P1" as const,
						musicTrack: "golden-fields" as const,
					}}
				/>
				<Composition
					id="TuPerroLoSabe-P2"
					component={TuPerroLoSabe}
					durationInFrames={TU_PERRO_LO_SABE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "P2" as const,
						musicTrack: "golden-fields" as const,
					}}
				/>
			</Folder>

			{/* ============ NoLoBusque ============ */}
			<Folder name="NoLoBusque">
				<Composition
					id="NoLoBusque-NB1"
					component={NoLoBusque}
					durationInFrames={NO_LO_BUSQUE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "NB1" as const,
						musicTrack: "open-road" as const,
					}}
				/>
				<Composition
					id="NoLoBusque-NB2"
					component={NoLoBusque}
					durationInFrames={NO_LO_BUSQUE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "NB2" as const,
						musicTrack: "open-road" as const,
					}}
				/>
				<Composition
					id="NoLoBusque-NB3"
					component={NoLoBusque}
					durationInFrames={NO_LO_BUSQUE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "NB3" as const,
						musicTrack: "rising-tide" as const,
					}}
				/>
			</Folder>

			{/* ============ MientrasTodosBuscan ============ */}
			<Folder name="MientrasTodosBuscan">
				<Composition
					id="MientrasTodosBuscan-MT1"
					component={MientrasTodosBuscan}
					durationInFrames={MIENTRAS_TODOS_BUSCAN_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "MT1" as const,
						musicTrack: "rising-tide" as const,
					}}
				/>
				<Composition
					id="MientrasTodosBuscan-MT2"
					component={MientrasTodosBuscan}
					durationInFrames={MIENTRAS_TODOS_BUSCAN_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "MT2" as const,
						musicTrack: "rising-tide" as const,
					}}
				/>
			</Folder>

			{/* ============ iOS Launch Announcement ============ */}
			<Folder name="IOSLaunch">
				<Composition
					id="IOSLaunch"
					component={IOSLaunch}
					durationInFrames={IOS_LAUNCH_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						musicTrack: "golden-fields" as const,
					}}
				/>
			</Folder>

			{/* ============ ElRadarEncontro (Concepto M) ============ */}
			<Folder name="ElRadarEncontro">
				<Composition
					id="ElRadarEncontro-M1"
					component={ElRadarEncontro}
					durationInFrames={EL_RADAR_ENCONTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "M1" as const,
						withIntro: false,
					}}
				/>
				<Composition
					id="ElRadarEncontro-M2"
					component={ElRadarEncontro}
					durationInFrames={EL_RADAR_ENCONTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "M2" as const,
						withIntro: false,
					}}
				/>
				<Composition
					id="ElRadarEncontro-M3"
					component={ElRadarEncontro}
					durationInFrames={EL_RADAR_ENCONTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "M3" as const,
						withIntro: false,
					}}
				/>
				<Composition
					id="ElRadarEncontro-M1-Intro"
					component={ElRadarEncontro}
					durationInFrames={EL_RADAR_ENCONTRO_FRAMES + STORE_INTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "M1" as const,
						withIntro: true,
					}}
				/>
				<Composition
					id="ElRadarEncontro-M2-Intro"
					component={ElRadarEncontro}
					durationInFrames={EL_RADAR_ENCONTRO_FRAMES + STORE_INTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "M2" as const,
						withIntro: true,
					}}
				/>
				<Composition
					id="ElRadarEncontro-M3-Intro"
					component={ElRadarEncontro}
					durationInFrames={EL_RADAR_ENCONTRO_FRAMES + STORE_INTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "M3" as const,
						withIntro: true,
					}}
				/>

				{/* Story backgrounds — single-frame PNGs for IG Stories */}
				{/* User places the native question sticker over the clean bottom 30% */}
				<Still
					id="Story-M1"
					component={StoryRadarEncontro}
					width={W}
					height={H}
					defaultProps={{ variant: "M1" as const }}
				/>
				<Still
					id="Story-M2"
					component={StoryRadarEncontro}
					width={W}
					height={H}
					defaultProps={{ variant: "M2" as const }}
				/>
				<Still
					id="Story-M3"
					component={StoryRadarEncontro}
					width={W}
					height={H}
					defaultProps={{ variant: "M3" as const }}
				/>
			</Folder>

			{/* ============ QuizLegal (Concepto O) ============ */}
			<Folder name="QuizLegal">
				<Composition
					id="QuizLegal-O1"
					component={QuizLegal}
					durationInFrames={QUIZ_LEGAL_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "O1" as const,
						withIntro: false,
					}}
				/>
				<Composition
					id="QuizLegal-O2"
					component={QuizLegal}
					durationInFrames={QUIZ_LEGAL_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "O2" as const,
						withIntro: false,
					}}
				/>
				<Composition
					id="QuizLegal-O3"
					component={QuizLegal}
					durationInFrames={QUIZ_LEGAL_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "O3" as const,
						withIntro: false,
					}}
				/>
				<Composition
					id="QuizLegal-O1-Intro"
					component={QuizLegal}
					durationInFrames={QUIZ_LEGAL_FRAMES + STORE_INTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "O1" as const,
						withIntro: true,
					}}
				/>
				<Composition
					id="QuizLegal-O2-Intro"
					component={QuizLegal}
					durationInFrames={QUIZ_LEGAL_FRAMES + STORE_INTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "O2" as const,
						withIntro: true,
					}}
				/>
				<Composition
					id="QuizLegal-O3-Intro"
					component={QuizLegal}
					durationInFrames={QUIZ_LEGAL_FRAMES + STORE_INTRO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "O3" as const,
						withIntro: true,
					}}
				/>
			</Folder>

			{/* ============ Carousels (Still images for IG) ============ */}
			<Folder name="Carousels">
				<Folder name="ZonasLegales">
					{CAROUSEL_LEGAL.map((slide, i) => (
						<Still
							key={`legal-${slide.number}`}
							id={`Carousel-Legal-${i + 1}`}
							component={CarouselSlide}
							width={W}
							height={W}
							defaultProps={{
								carouselTitle: "5 Zonas Donde NO Puedes Aparcar",
								slide,
								variant: (i === 0
									? "cover"
									: i === CAROUSEL_LEGAL.length - 1
										? "cta"
										: "content") as "cover" | "content" | "cta",
								theme: "legal" as const,
								backgroundImage: "images/carousel-bg-legal.jpg",
							}}
						/>
					))}
				</Folder>
				<Folder name="Pipeline7Capas">
					{CAROUSEL_PIPELINE.map((slide, i) => (
						<Still
							key={`pipeline-${slide.number}`}
							id={`Carousel-Pipeline-${i + 1}`}
							component={CarouselSlide}
							width={W}
							height={W}
							defaultProps={{
								carouselTitle: "7 Capas de Análisis por Spot",
								slide,
								variant: (i === 0
									? "cover"
									: i === CAROUSEL_PIPELINE.length - 1
										? "cta"
										: "content") as "cover" | "content" | "cta",
								theme: "pipeline" as const,
								backgroundImage: "images/carousel-bg-pipeline.jpg",
							}}
						/>
					))}
				</Folder>
				<Folder name="ComoSeCalculaTuScore">
					{CAROUSEL_SCORING.map((slide, i) => (
						<Still
							key={`scoring-${slide.number}`}
							id={`Carousel-Scoring-${i + 1}`}
							component={CarouselSlide}
							width={W}
							height={W}
							defaultProps={{
								carouselTitle: "Como Se Calcula Tu Score",
								slide,
								variant: (i === 0
									? "cover"
									: i === CAROUSEL_SCORING.length - 1
										? "cta"
										: "content") as "cover" | "content" | "cta",
								theme: "scoring" as const,
								backgroundImage: "images/carousel-bg-scoring.jpg",
							}}
						/>
					))}
				</Folder>
				<Folder name="DatosVsReviews">
					{CAROUSEL_MYSTERY.map((slide, i) => (
						<Still
							key={`mystery-${slide.number}`}
							id={`Carousel-Mystery-${i + 1}`}
							component={CarouselSlide}
							width={W}
							height={W}
							defaultProps={{
								carouselTitle: "Datos vs Reviews",
								slide,
								variant: (i === 0
									? "cover"
									: i === CAROUSEL_MYSTERY.length - 1
										? "cta"
										: "content") as "cover" | "content" | "cta",
								theme: "mystery" as const,
								backgroundImage: "images/carousel-bg-mystery.jpg",
							}}
						/>
					))}
				</Folder>
				<Folder name="5SenalesBuenSpot">
					{CAROUSEL_T1.map((slide, i) => (
						<Still
							key={`t1-${slide.number}`}
							id={`Carousel-T1-${i + 1}`}
							component={CarouselSlide}
							width={W}
							height={W}
							defaultProps={{
								carouselTitle: "5 señales de que un spot va a ser bueno",
								slide,
								variant: (i === 0
									? "cover"
									: i === CAROUSEL_T1.length - 1
										? "cta"
										: "content") as "cover" | "content" | "cta",
								theme: "scoring" as const,
								backgroundImage: "images/carousel-bg-scoring.jpg",
							}}
						/>
					))}
				</Folder>
				<Folder name="ReviewsParadox">
					{CAROUSEL_U1.map((slide, i) => (
						<Still
							key={`u1-${slide.number}`}
							id={`Carousel-U1-${i + 1}`}
							component={CarouselSlide}
							width={W}
							height={W}
							defaultProps={{
								carouselTitle: "Por qué los mejores spots no tienen reviews",
								slide,
								variant: (i === 0
									? "cover"
									: i === CAROUSEL_U1.length - 1
										? "cta"
										: "content") as "cover" | "content" | "cta",
								theme: "mystery" as const,
								backgroundImage: "images/carousel-bg-mystery.jpg",
							}}
						/>
					))}
				</Folder>
			</Folder>

			{/* ============ Stories V3 (Still backgrounds for IG) ============ */}
			<Folder name="StoriesV3">
				<Folder name="Polls">
					<Still
						id="Story-Poll-1"
						component={StoryPoll}
						width={W}
						height={H}
						defaultProps={{ variant: "PL1" as const }}
					/>
					<Still
						id="Story-Poll-2"
						component={StoryPoll}
						width={W}
						height={H}
						defaultProps={{ variant: "PL2" as const }}
					/>
					<Still
						id="Story-Poll-3"
						component={StoryPoll}
						width={W}
						height={H}
						defaultProps={{ variant: "PL3" as const }}
					/>
					<Still
						id="Story-Poll-4"
						component={StoryPoll}
						width={W}
						height={H}
						defaultProps={{ variant: "PL4" as const }}
					/>
					<Still
						id="Story-Poll-5"
						component={StoryPoll}
						width={W}
						height={H}
						defaultProps={{ variant: "PL5" as const }}
					/>
					<Still
						id="Story-Poll-6"
						component={StoryPoll}
						width={W}
						height={H}
						defaultProps={{ variant: "PL6" as const }}
					/>
					<Still
						id="Story-Poll-7"
						component={StoryPoll}
						width={W}
						height={H}
						defaultProps={{ variant: "PL7" as const }}
					/>
				</Folder>
				<Folder name="QuizLegalStories">
					<Still
						id="Story-Quiz-1"
						component={StoryQuizLegal}
						width={W}
						height={H}
						defaultProps={{ variant: "QL1" as const }}
					/>
					<Still
						id="Story-Quiz-2"
						component={StoryQuizLegal}
						width={W}
						height={H}
						defaultProps={{ variant: "QL2" as const }}
					/>
					<Still
						id="Story-Quiz-3"
						component={StoryQuizLegal}
						width={W}
						height={H}
						defaultProps={{ variant: "QL3" as const }}
					/>
					<Still
						id="Story-Quiz-4"
						component={StoryQuizLegal}
						width={W}
						height={H}
						defaultProps={{ variant: "QL4" as const }}
					/>
				</Folder>
				<Folder name="Countdowns">
					<Composition
						id="Story-Anticipation-May10"
						component={StoryAnticipationMay10}
						durationInFrames={450}
						fps={FPS}
						width={W}
						height={H}
					/>
					<Still
						id="Story-Countdown-1"
						component={StoryCountdown}
						width={W}
						height={H}
						defaultProps={{ variant: "CD1" as const }}
					/>
					<Still
						id="Story-Countdown-2"
						component={StoryCountdown}
						width={W}
						height={H}
						defaultProps={{ variant: "CD2" as const }}
					/>
				</Folder>
				<Folder name="BehindTheScenes">
					<Still
						id="Story-BTS-1"
						component={StoryBTS}
						width={W}
						height={H}
						defaultProps={{ variant: "BTS1" as const }}
					/>
					<Still
						id="Story-BTS-2"
						component={StoryBTS}
						width={W}
						height={H}
						defaultProps={{ variant: "BTS2" as const }}
					/>
					<Still
						id="Story-BTS-3"
						component={StoryBTS}
						width={W}
						height={H}
						defaultProps={{ variant: "BTS3" as const }}
					/>
					<Still
						id="Story-BTS-4"
						component={StoryBTS}
						width={W}
						height={H}
						defaultProps={{ variant: "BTS4" as const }}
					/>
				</Folder>
				<Folder name="PuenteDeMayoStories">
					<Still
						id="Story-PuenteUrgencia"
						component={StoryPuenteUrgencia}
						width={W}
						height={H}
					/>
				</Folder>
			</Folder>

			{/* ============ PuenteDeMayo (Reel) ============ */}
			<Folder name="PuenteDeMayo">
				<Composition
					id="PuenteDeMayo"
					component={PuenteDeMayo}
					durationInFrames={PUENTE_DE_MAYO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						musicTrack: "pulse-reveal" as const,
					}}
				/>
			</Folder>

			{/* ============ ElRadarDetecto (Concepto R — mystery spot reveal) ============ */}
			<Folder name="ElRadarDetecto">
				<Composition
					id="ElRadarDetecto-RD1"
					component={ElRadarDetecto}
					durationInFrames={EL_RADAR_DETECTO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "RD1" as const,
						spot: {
							satelliteImage: "images/satellite-spot-1311493324.jpg",
							score: 86.1,
							aiScore: 72.5,
							slope: 3.8,
							elevation: 351,
							surface: "Terreno natural",
							buildingsNearby: 0,
							roadNoise: "Ninguno",
							scenicFeature: "Río cercano ✓",
							wildBonus: 30,
							landcover: "Vegetación esclerófila",
							legal: {
								natura: false,
								park: false,
								coastal: false,
								cadastre: "Rústico",
							},
							videoS1:
								"videos/aerial_view_of_dense_green_forest_canopy_34348701_2160x3840_34348701.mp4",
							videoS2:
								"videos/serene_drive_through_lush_green_forest_34943087_2160x3840_34943087.mp4",
							videoS5:
								"videos/scenic_forest_drive_on_a_dirt_road_32990645_1440x1920_32990645.mp4",
						} as SpotData,
					}}
				/>
				<Composition
					id="ElRadarDetecto-RD2"
					component={ElRadarDetecto}
					durationInFrames={EL_RADAR_DETECTO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "RD2" as const,
						spot: {
							satelliteImage: "images/satellite-spot-71422800.jpg",
							score: 83.7,
							aiScore: 81.5,
							slope: 8.3,
							elevation: 324,
							surface: "Terreno natural",
							buildingsNearby: 0,
							roadNoise: "Ninguno",
							scenicFeature: "Lago cercano ✓",
							wildBonus: 23,
							landcover: "Láminas de agua",
							legal: {
								natura: false,
								park: false,
								coastal: false,
								cadastre: "Rústico",
							},
							videoS1: "videos/couple-inside-van-with-lake-outside.mp4",
							videoS2:
								"videos/a_gravel_road_with_a_mountain_in_the_background_27847139_2160x3840_27847139.mp4",
							videoS5:
								"videos/orange_vw_camper_van_on_scenic_coastal_drive_37075748_1080x1920_37075748.mp4",
						} as SpotData,
					}}
				/>
				<Composition
					id="ElRadarDetecto-RD3"
					component={ElRadarDetecto}
					durationInFrames={EL_RADAR_DETECTO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "RD3" as const,
						spot: {
							satelliteImage: "images/satellite-spot-5484843145.jpg",
							score: 80.7,
							aiScore: 74.0,
							slope: 17.3,
							elevation: 1910,
							surface: "Desconocida",
							buildingsNearby: 0,
							roadNoise: "Ninguno",
							scenicFeature: "Mirador + río + pico ✓",
							wildBonus: 27,
							landcover: "Landas y matorrales",
							legal: {
								natura: false,
								park: false,
								coastal: false,
								cadastre: "Rústico",
							},
							videoS1:
								"videos/scenic_drive_through_majestic_mountains_32857774_2160x3840_32857774.mp4",
							videoS2:
								"videos/a_gravel_road_with_a_mountain_in_the_background_27847139_2160x3840_27847139.mp4",
							videoS5: "videos/rv_mountain_road.mp4",
						} as SpotData,
					}}
				/>
				<Composition
					id="ElRadarDetecto-RD4"
					component={ElRadarDetecto}
					durationInFrames={EL_RADAR_DETECTO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "RD4" as const,
						spot: {
							satelliteImage: "images/satellite-spot-2254888334.jpg",
							score: 68.1,
							aiScore: 62.0,
							slope: 13.0,
							elevation: 15,
							surface: "Desconocida",
							buildingsNearby: 1,
							roadNoise: "Carretera cercana",
							scenicFeature: "Playa + mirador + río ✓",
							wildBonus: 30,
							landcover: "Estuarios",
							legal: {
								natura: false,
								park: false,
								coastal: false,
								cadastre: "Rústico",
							},
							videoS1: "videos/Aerial_Spanish_Mediterranean_coast.mp4",
							videoS2:
								"videos/a_person_standing_on_the_edge_of_a_cliff_looking_at_the_ocean_19184198_1080x1920_19184198.mp4",
							videoS5: "videos/dog-beach-happy.mp4",
						} as SpotData,
					}}
				/>

				{/* RD5 — Costa norte (Galicia/Asturias): matorral atlántico, final de pista */}
				<Composition
					id="ElRadarDetecto-RD5"
					component={ElRadarDetecto}
					durationInFrames={EL_RADAR_DETECTO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "RD5" as const,
						spot: {
							satelliteImage: "images/satellite-spot-327486586.jpg",
							score: 84.5,
							aiScore: 75.0,
							slope: 0.7,
							elevation: 464,
							surface: "Matorral boscoso de transición",
							buildingsNearby: 0,
							roadNoise: "Ninguno",
							scenicFeature: "Final de pista ✓",
							wildBonus: 21,
							landcover: "Matorral boscoso de transición",
							legal: {
								natura: false,
								park: false,
								coastal: false,
								cadastre: "Rústico",
							},
							videoS1:
								"videos/aerial_view_of_forest_path_in_bolu_province_35289213_2160x3840_35289213.mp4",
							videoS2:
								"videos/serene_drive_through_lush_green_forest_34943087_2160x3840_34943087.mp4",
							videoS5:
								"videos/scenic_green_road_surrounded_by_lush_trees_34231319_2160x3840_34231319.mp4",
						} as SpotData,
					}}
				/>

				{/* RD6 — Interior (Extremadura/Castilla): bosque de frondosas, agua cerca */}
				<Composition
					id="ElRadarDetecto-RD6"
					component={ElRadarDetecto}
					durationInFrames={EL_RADAR_DETECTO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "RD6" as const,
						spot: {
							satelliteImage: "images/satellite-spot-5484843145.jpg",
							score: 86.8,
							aiScore: 78.0,
							slope: 3.5,
							elevation: 805,
							surface: "Bosque de frondosas",
							buildingsNearby: 0,
							roadNoise: "Ninguno",
							scenicFeature: "Agua cerca + final de pista ✓",
							wildBonus: 22,
							landcover: "Bosque de frondosas",
							legal: {
								natura: false,
								park: false,
								coastal: false,
								cadastre: "Rústico",
							},
							videoS1:
								"videos/beautiful_forest_in_azad_kashmir_pakistan_27988109_1080x1920_27988109.mp4",
							videoS2:
								"videos/road_among_trees_in_overhead_view_14608460_2160x3840_14608460.mp4",
							videoS5:
								"videos/tranquil_pine_forest_landscape_scene_30667274_1080x1920_30667274.mp4",
						} as SpotData,
					}}
				/>
			</Folder>

			{/* ============ UnNoventa (S3 — score reveal) ============ */}
			<Folder name="UnNoventa">
				<Composition
					id="UnNoventa-S3"
					component={UnNoventa}
					durationInFrames={UN_NOVENTA_FRAMES}
					fps={FPS}
					width={W}
					height={H}
				/>
			</Folder>

			{/* ============ AndroidLaunch ============ */}
			<Folder name="AndroidLaunch">
				<Composition
					id="AndroidLaunch"
					component={AndroidLaunch}
					durationInFrames={ANDROID_LAUNCH_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "AL1" as const,
						musicTrack: "warm-launch" as const,
					}}
				/>
				<Composition
					id="AndroidLaunch-AL2"
					component={AndroidLaunch}
					durationInFrames={ANDROID_LAUNCH_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "AL2" as const,
						musicTrack: "warm-launch" as const,
					}}
				/>
			</Folder>

			{/* ============ ElProblema (S1 — El Problema) ============ */}
			<Folder name="ElProblema">
				<Composition
					id="ElProblema-S1"
					component={ElProblema}
					durationInFrames={EL_PROBLEMA_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "S1" as const,
					}}
				/>
				<Composition
					id="ElProblema-S1b"
					component={ElProblema}
					durationInFrames={EL_PROBLEMA_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "S1b" as const,
					}}
				/>
			</Folder>

			{/* ============ OchoTresMil (W1 — 83.006) ============ */}
			<Folder name="OchoTresMil">
				<Composition
					id="OchoTresMil-W1"
					component={OchoTresMil}
					durationInFrames={OCHO_TRES_MIL_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "W1" as const,
					}}
				/>
				<Composition
					id="OchoTresMil-W1b"
					component={OchoTresMil}
					durationInFrames={OCHO_TRES_MIL_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "W1b" as const,
					}}
				/>
			</Folder>

			{/* ============ ElPeorMomento (S2 — El Peor Momento) ============ */}
			<Folder name="ElPeorMomento">
				<Composition
					id="ElPeorMomento-S2"
					component={ElPeorMomento}
					durationInFrames={EL_PEOR_MOMENTO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "S2" as const,
					}}
				/>
				<Composition
					id="ElPeorMomento-S2b"
					component={ElPeorMomento}
					durationInFrames={EL_PEOR_MOMENTO_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "S2b" as const,
					}}
				/>
			</Folder>

			{/* ============ Debate (Debate1 + Debate2 — engagement/opinion) ============ */}
			<Folder name="Debate">
				{/* Debate1 — ¿Das la ubicación de tu spot favorito? */}
				<Composition
					id="Debate1-D1"
					component={Debate}
					durationInFrames={DEBATE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "D1" as const,
						musicTrack: "quiet-debate",
					}}
				/>
				{/* Debate2 — ¿Merece la pena una review? */}
				<Composition
					id="Debate2-D2"
					component={Debate}
					durationInFrames={DEBATE_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						variant: "D2" as const,
						musicTrack: "data-truth",
					}}
				/>
			</Folder>

			{/* ============ MayoMejorMes (V1 — seasonal / costa norte) ============ */}
			<Folder name="MayoMejorMes">
				<Composition
					id="MayoMejorMes-V1"
					component={MayoMejorMes}
					durationInFrames={MAYO_MEJOR_MES_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "V1" as const,
						musicTrack: "atlantic-swell",
					}}
				/>
				<Composition
					id="MayoMejorMes-V2"
					component={MayoMejorMes}
					durationInFrames={MAYO_MEJOR_MES_FRAMES}
					fps={FPS}
					width={W}
					height={H}
					defaultProps={{
						hookVariant: "V2" as const,
						musicTrack: "atlantic-swell",
					}}
				/>
			</Folder>
		</>
	);
};
