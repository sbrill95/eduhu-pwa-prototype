import { config, isDevelopment, isProduction, isTest } from './index';

describe('Configuration', () => {
  describe('config object', () => {
    it('should have all required properties', () => {
      expect(config).toHaveProperty('PORT');
      expect(config).toHaveProperty('NODE_ENV');
      expect(config).toHaveProperty('FRONTEND_URL');
      expect(config).toHaveProperty('API_PREFIX');
    });

    it('should have correct PORT type', () => {
      expect(typeof config.PORT).toBe('string');
      expect(config.PORT).toBe('3002'); // Set in test setup
    });

    it('should have correct NODE_ENV', () => {
      expect(config.NODE_ENV).toBe('test');
      expect(['development', 'production', 'test']).toContain(config.NODE_ENV);
    });

    it('should have valid FRONTEND_URL', () => {
      expect(config.FRONTEND_URL).toMatch(/^https?:\/\/.+/);
      expect(config.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('should have API_PREFIX', () => {
      expect(typeof config.API_PREFIX).toBe('string');
      expect(config.API_PREFIX.startsWith('/')).toBe(true);
    });
  });

  describe('environment helpers', () => {
    it('should correctly identify test environment', () => {
      expect(isTest).toBe(true);
      expect(isDevelopment).toBe(false);
      expect(isProduction).toBe(false);
    });

    it('should be boolean values', () => {
      expect(typeof isDevelopment).toBe('boolean');
      expect(typeof isProduction).toBe('boolean');
      expect(typeof isTest).toBe('boolean');
    });

    it('should have only one environment flag as true', () => {
      const envFlags = [isDevelopment, isProduction, isTest];
      const trueCount = envFlags.filter((flag) => flag === true).length;
      expect(trueCount).toBe(1);
    });
  });
});
