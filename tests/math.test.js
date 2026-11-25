import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const sharedSource = fs.readFileSync(path.resolve(process.cwd(), 'frontend/shared.js'), 'utf8');
const sandbox = { console, Date, Math, Array, Object, Number, String, Boolean, JSON, Intl };
vm.createContext(sandbox);
vm.runInContext(sharedSource, sandbox);

function diffMinutes(hhmmA, hhmmB) {
  const toMin = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  let d = Math.abs(toMin(hhmmA) - toMin(hhmmB));
  if (d > 720) d = 1440 - d;
  return d;
}

describe('Astronomical Prayer, Hijri, and Qibla Math', () => {
  it('matches Aladhan MWL reference within 2 minutes across 5 cities & solstices', () => {
    const cases = [
      [
        'Makkah Jun 21',
        21.3891,
        39.8579,
        new Date(Date.UTC(2026, 5, 21, 12)),
        3,
        { Fajr: '04:14', Sunrise: '05:39', Dhuhr: '12:22', Asr: '15:42', Maghrib: '19:06', Isha: '20:26' },
      ],
      [
        'Makkah Dec 21',
        21.3891,
        39.8579,
        new Date(Date.UTC(2026, 11, 21, 12)),
        3,
        { Fajr: '05:34', Sunrise: '06:54', Dhuhr: '12:19', Asr: '15:23', Maghrib: '17:44', Isha: '18:58' },
      ],
      [
        'Moscow Jun 21',
        55.7558,
        37.6173,
        new Date(Date.UTC(2026, 5, 21, 12)),
        3,
        { Fajr: '01:49', Sunrise: '03:45', Dhuhr: '12:31', Asr: '17:03', Maghrib: '21:18', Isha: '23:08' },
      ],
      [
        'Moscow Dec 21',
        55.7558,
        37.6173,
        new Date(Date.UTC(2026, 11, 21, 12)),
        3,
        { Fajr: '06:36', Sunrise: '08:57', Dhuhr: '12:28', Asr: '13:45', Maghrib: '15:58', Isha: '18:11' },
      ],
      [
        'Bishkek Jun 21',
        42.8746,
        74.5698,
        new Date(Date.UTC(2026, 5, 21, 12)),
        6,
        { Fajr: '03:05', Sunrise: '05:23', Dhuhr: '13:04', Asr: '17:08', Maghrib: '20:44', Isha: '22:51' },
      ],
      [
        'Bishkek Dec 21',
        42.8746,
        74.5698,
        new Date(Date.UTC(2026, 11, 21, 12)),
        6,
        { Fajr: '06:46', Sunrise: '08:29', Dhuhr: '13:00', Asr: '15:13', Maghrib: '17:30', Isha: '19:07' },
      ],
      [
        'Astana Jun 21',
        51.1694,
        71.4491,
        new Date(Date.UTC(2026, 5, 21, 12)),
        5,
        { Fajr: '01:45', Sunrise: '03:59', Dhuhr: '12:16', Asr: '16:38', Maghrib: '20:33', Isha: '22:39' },
      ],
      [
        'London Jun 21',
        51.5074,
        -0.1278,
        new Date(Date.UTC(2026, 5, 21, 12)),
        1,
        { Fajr: '02:31', Sunrise: '04:43', Dhuhr: '13:02', Asr: '17:25', Maghrib: '21:22', Isha: '23:27' },
      ],
      [
        'London Dec 21',
        51.5074,
        -0.1278,
        new Date(Date.UTC(2026, 11, 21, 12)),
        0,
        { Fajr: '05:59', Sunrise: '08:04', Dhuhr: '11:59', Asr: '13:38', Maghrib: '15:53', Isha: '17:51' },
      ],
    ];

    for (const [label, lat, lng, dt, tz, expected] of cases) {
      const got = sandbox.calculateOfflinePrayerTimes(lat, lng, dt, {
        method: 3,
        hanafi: false,
        timezone: tz,
      });
      for (const [prayer, expTime] of Object.entries(expected)) {
        const d = diffMinutes(got[prayer], expTime);
        assert.ok(d <= 2, `${label} ${prayer}: expected ${expTime}, got ${got[prayer]} (diff=${d}m)`);
      }
    }
  });

  it('handles vernal equinox EoT wraparound cleanly and Hanafi vs Standard Asr order', () => {
    const eq = sandbox.calculateOfflinePrayerTimes(51.5074, -0.1278, new Date(Date.UTC(2026, 2, 20, 12)), {
      method: 3,
      timezone: 0,
    });
    assert.ok(eq.Dhuhr.startsWith('12:'), `Equinox solar noon near 12:xx, got ${eq.Dhuhr}`);

    const std = sandbox.calculateOfflinePrayerTimes(41.3, 69.2, new Date(Date.UTC(2026, 5, 21, 12)), {
      method: 3,
      school: 0,
      timezone: 5,
    });
    const han = sandbox.calculateOfflinePrayerTimes(41.3, 69.2, new Date(Date.UTC(2026, 5, 21, 12)), {
      method: 3,
      school: 1,
      timezone: 5,
    });
    assert.ok(han.Asr > std.Asr, `Hanafi Asr (${han.Asr}) must be later than Standard Asr (${std.Asr})`);
  });

  it('calculates accurate Qibla bearings and great-circle distances', () => {
    const moscow = sandbox.calculateQiblaBearing(55.7558, 37.6173);
    const london = sandbox.calculateQiblaBearing(51.5074, -0.1278);
    const ny = sandbox.calculateQiblaBearing(40.7128, -74.006);
    const tokyo = sandbox.calculateQiblaBearing(35.6762, 139.6503);
    assert.ok(Math.abs(moscow - 176.4) < 1.0, `Moscow bearing ${moscow}`);
    assert.ok(Math.abs(london - 119.0) < 1.5, `London bearing ${london}`);
    assert.ok(Math.abs(ny - 58.5) < 1.5, `NY bearing ${ny}`);
    assert.ok(Math.abs(tokyo - 293.0) < 1.5, `Tokyo bearing ${tokyo}`);

    const moscowDist = sandbox.calculateQiblaDistanceKm(55.7558, 37.6173);
    assert.ok(moscowDist > 3750 && moscowDist < 3900, `Moscow distance ${moscowDist} km`);
  });

  it('converts Gregorian dates to valid Hijri dates', () => {
    const h = sandbox.toHijri(new Date(Date.UTC(2026, 10, 25, 12)), 0);
    assert.ok(h.year >= 1447 && h.year <= 1449);
    assert.ok(h.month >= 0 && h.month <= 11);
    assert.ok(h.day >= 1 && h.day <= 30);
  });
});
