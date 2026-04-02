import "./index.css";
import { Composition, Folder } from "remotion";
import { ParkingLleno } from "./ParkingLleno";
import { Natura2000Clip } from "./Natura2000Clip";
import { LaMulta } from "./LaMulta";
import { OchentaYSiete } from "./OchentaYSiete";

// ParkingLleno: 130+155+175+220+195=875 raw - (18+18+16+18)=70 overlap = 805 frames ≈ 26.8s @ 30fps
const PARKING_LLENO_FRAMES = 805;

// Natura2000Clip: 530 raw - 48 overlap = 482 frames ≈ 16.1s @ 30fps
const NATURA2000_FRAMES = 482;

// LaMulta: 830 raw - 64 overlap = 766 frames ≈ 25.5s @ 30fps
const LA_MULTA_FRAMES = 766;

// OchentaYSiete: 980 raw - 80 overlap = 900 frames = 30.0s @ 30fps
const OCHENTA_Y_SIETE_FRAMES = 900;

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="WildSpotter">
      <Composition
        id="ParkingLleno"
        component={ParkingLleno}
        durationInFrames={PARKING_LLENO_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Natura2000Clip"
        component={Natura2000Clip}
        durationInFrames={NATURA2000_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LaMulta"
        component={LaMulta}
        durationInFrames={LA_MULTA_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="OchentaYSiete"
        component={OchentaYSiete}
        durationInFrames={OCHENTA_Y_SIETE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </Folder>
  );
};
