import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WishlistItem, Place } from '../models/place.model';

const STORAGE_KEY = 'travel_tracker_wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly items$ = new BehaviorSubject<WishlistItem[]>(this.load());

  readonly wishlist$ = this.items$.asObservable();

  get snapshot(): WishlistItem[] {
    return this.items$.value;
  }

  isInWishlist(placeId: string): boolean {
    return this.items$.value.some((item) => item.fsq_id === placeId);
  }

  toggle(place: Place): void {
    if (this.isInWishlist(place.fsq_id)) {
      this.remove(place.fsq_id);
    } else {
      this.add(place);
    }
  }

  add(place: Place): void {
    if (this.isInWishlist(place.fsq_id)) return;
    const updated: WishlistItem[] = [
      ...this.items$.value,
      { ...place, addedAt: Date.now() },
    ];
    this.items$.next(updated);
    this.persist(updated);
  }

  remove(placeId: string): void {
    const updated = this.items$.value.filter((i) => i.fsq_id !== placeId);
    this.items$.next(updated);
    this.persist(updated);
  }

  clearAll(): void {
    this.items$.next([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  private load(): WishlistItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(items: WishlistItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('WishlistService: failed to persist', e);
    }
  }
}
