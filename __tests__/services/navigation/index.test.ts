jest.mock('react-native', () => ({
  Linking: {
    openURL: jest.fn(),
  },
}));

import { buildInspectUrl, buildNavigateUrl } from '@/services/navigation';

describe('navigation service', () => {
  describe('buildInspectUrl', () => {
    it('builds a Google Maps satellite URL with correct coordinates', () => {
      const url = buildInspectUrl(37.0891, -3.3961);
      expect(url).toBe(
        'https://www.google.com/maps/@37.0891,-3.3961,18z/data=!3m1!1e3'
      );
    });

    it('handles positive longitude', () => {
      const url = buildInspectUrl(40.4168, 3.7038);
      expect(url).toBe(
        'https://www.google.com/maps/@40.4168,3.7038,18z/data=!3m1!1e3'
      );
    });

    it('handles zero coordinates', () => {
      const url = buildInspectUrl(0, 0);
      expect(url).toBe(
        'https://www.google.com/maps/@0,0,18z/data=!3m1!1e3'
      );
    });
  });

  describe('buildNavigateUrl', () => {
    it('builds a Google Maps navigation URL with correct coordinates', () => {
      const url = buildNavigateUrl(37.0891, -3.3961);
      expect(url).toBe(
        'https://www.google.com/maps/dir/?api=1&destination=37.0891,-3.3961&travelmode=driving'
      );
    });

    it('handles positive longitude', () => {
      const url = buildNavigateUrl(40.4168, 3.7038);
      expect(url).toBe(
        'https://www.google.com/maps/dir/?api=1&destination=40.4168,3.7038&travelmode=driving'
      );
    });

    it('handles negative latitude', () => {
      const url = buildNavigateUrl(-33.8688, 151.2093);
      expect(url).toBe(
        'https://www.google.com/maps/dir/?api=1&destination=-33.8688,151.2093&travelmode=driving'
      );
    });
  });
});
