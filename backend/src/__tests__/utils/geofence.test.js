const { calculateDistance } = require('../../utils/geofence');

describe('Geofence — calculateDistance (Haversine)', () => {

  test('returns 0 for the same point', () => {
    const distance = calculateDistance(-1.286389, 36.817223, -1.286389, 36.817223);
    expect(distance).toBeCloseTo(0, 0);
  });

  test('calculates known short distance (Nairobi CBD to JKIA ≈ 15 km)', () => {
    // Nairobi CBD
    const lat1 = -1.286389;
    const lon1 = 36.817223;
    // JKIA Airport
    const lat2 = -1.319167;
    const lon2 = 36.9275;

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    // Should be approximately 12-15 km
    expect(distance).toBeGreaterThan(11000);
    expect(distance).toBeLessThan(16000);
  });

  test('calculates known medium distance (Nairobi to Mombasa ≈ 440 km)', () => {
    const lat1 = -1.286389; // Nairobi
    const lon1 = 36.817223;
    const lat2 = -4.0435;   // Mombasa
    const lon2 = 39.6682;

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    // Should be approximately 440 km
    expect(distance).toBeGreaterThan(400000);
    expect(distance).toBeLessThan(500000);
  });

  test('handles equator crossing correctly', () => {
    const distance = calculateDistance(1.0, 36.0, -1.0, 36.0);
    // 2 degrees of latitude ≈ 222 km
    expect(distance).toBeGreaterThan(220000);
    expect(distance).toBeLessThan(225000);
  });

  test('handles very small distances (< 100 meters)', () => {
    // Two points roughly 50 meters apart
    const lat1 = -1.286389;
    const lon1 = 36.817223;
    const lat2 = -1.286389;
    const lon2 = 36.817723; // shifted ~55m east at this latitude

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(40);
    expect(distance).toBeLessThan(70);
  });

  test('returns symmetric results (A→B equals B→A)', () => {
    const d1 = calculateDistance(-1.286, 36.817, -4.043, 39.668);
    const d2 = calculateDistance(-4.043, 39.668, -1.286, 36.817);
    expect(d1).toBeCloseTo(d2, 2);
  });

  test('handles international date line crossing', () => {
    const distance = calculateDistance(0, 179.9, 0, -179.9);
    // 0.2 degrees at equator ≈ 22 km
    expect(distance).toBeGreaterThan(20000);
    expect(distance).toBeLessThan(24000);
  });

  test('handles poles correctly', () => {
    // North Pole to point on equator
    const distance = calculateDistance(90, 0, 0, 0);
    // 90 degrees of latitude ≈ 10,000 km
    expect(distance).toBeGreaterThan(9900000);
    expect(distance).toBeLessThan(10100000);
  });
});
