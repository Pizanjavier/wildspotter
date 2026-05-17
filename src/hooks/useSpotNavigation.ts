import { useRouter, useSegments } from 'expo-router';

export const useSpotNavigation = () => {
  const router = useRouter();
  const segments = useSegments();

  const navigateToSpot = (spotId: string) => {
    const origin = segments.includes('spots') ? 'spots' : 'map';
    router.push(`/spot/${spotId}?origin=${origin}`);
  };

  return { navigateToSpot };
};
