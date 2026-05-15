import { Injectable } from '@angular/core';
import { CacheEntry, Place } from '../models/place.model';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly store = new Map<string, CacheEntry>();

  buildKey(params: Record<string, string | number | undefined>): string {
    return Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|')
      .toLowerCase();
  }

  get(key: string): Place[] | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: Place[]): void {
    this.store.set(key, { key, data, timestamp: Date.now() });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.store.clear();
  }

  /** Returns how many seconds remain before the entry expires, or 0 */
  ttlSeconds(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    const remaining = CACHE_TTL_MS - (Date.now() - entry.timestamp);
    return Math.max(0, Math.round(remaining / 1000));
  }

  findPlaceById(id: string): Place | null {
    for (const entry of this.store.values()) {
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) continue;
      const place = entry.data.find(p => p.fsq_id === id);
      if (place) return place;
    }
    return null;
  }
}
