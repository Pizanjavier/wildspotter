import { Linking } from 'react-native';

export const buildInspectUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps/@${lat},${lng},18z/data=!3m1!1e3`;
};

export const buildNavigateUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
};

export const openInspect = async (lat: number, lng: number): Promise<void> => {
  const url = buildInspectUrl(lat, lng);
  await Linking.openURL(url);
};

export const openNavigate = async (lat: number, lng: number): Promise<void> => {
  const url = buildNavigateUrl(lat, lng);
  await Linking.openURL(url);
};
