import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardApiService } from '../api';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
});

describe('DashboardApiService', () => {
  it('returns fallback stats when offline', async () => {
    const data = await DashboardApiService.getDashboardStats('t-1');
    expect(data.activeVehicles.current).toBe(42);
    expect(data.systemSla).toBe(99.72);
  });

  it('returns fallback traffic data when offline', async () => {
    const data = await DashboardApiService.getTrafficData('t-1', 'today');
    expect(data.length).toBe(15);
    expect(data[2].hour).toBe('08:00');
    expect(data[2].peak).toBe(true);
  });

  it('returns fallback logs when offline', async () => {
    const data = await DashboardApiService.getSystemLogs('t-1');
    expect(data.length).toBeGreaterThanOrEqual(7);
    expect(data[0]).toHaveProperty('text');
    expect(data[0]).toHaveProperty('severity');
  });

  it('returns fallback AI predictions when offline', async () => {
    const data = await DashboardApiService.getAIPredictions('t-1');
    expect(data.length).toBe(5);
    expect(data[0]).toHaveProperty('confidence');
  });

  it('returns fallback system health when offline', async () => {
    const data = await DashboardApiService.getSystemHealth('t-1');
    expect(data.length).toBe(6);
    expect(data[0].name).toBe('API Servisi');
  });

  it('resolves log entries when offline', async () => {
    const res = await DashboardApiService.resolveLogEntry('t-1', 1);
    expect(res.status).toBe('RESOLVED');
  });
});
