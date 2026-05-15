import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly loading$ = new BehaviorSubject(false);
  readonly loading = this.loading$.asObservable();

  getCurrentPosition(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      this.loading$.next(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.loading$.next(false);
          resolve(pos.coords);
        },
        (err) => {
          this.loading$.next(false);
          reject(err);
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  }
}
