import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WishlistService } from '../../services/wishlist.service';
import { WishlistItem } from '../../models/place.model';
import { PlaceCardComponent } from '../../components/place-card/place-card.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, PlaceCardComponent],
  template: `
    <div class="wishlist-page">
      <div class="container">
        <!-- Header -->
        <header class="wl-header">
          <div class="wl-header__left">
            <div class="badge badge--accent">
              <i class="fas fa-heart"></i>
              Вішліст
            </div>
            <h1 class="wl-header__title">
              Мої місця для подорожей
            </h1>
            <p class="wl-header__subtitle">
              Зберігайте місця, які хочете відвідати. Список зберігається між сесіями.
            </p>
          </div>

          <div class="wl-header__actions" *ngIf="items().length">
            <button class="btn btn--danger" (click)="onClearAll()" id="clear-wishlist-btn">
              <i class="fas fa-trash"></i>
              Очистити все
            </button>
          </div>
        </header>

        <!-- Stats -->
        <div class="wl-stats" *ngIf="items().length > 0">
          <div class="wl-stat">
            <span class="wl-stat__value">{{ items().length }}</span>
            <span class="wl-stat__label">Місць збережено</span>
          </div>
          <div class="wl-stat">
            <span class="wl-stat__value">{{ uniqueCities() }}</span>
            <span class="wl-stat__label">Міст</span>
          </div>
          <div class="wl-stat">
            <span class="wl-stat__value">{{ avgRating() }}</span>
            <span class="wl-stat__label">Середній рейтинг</span>
          </div>
        </div>

        <!-- Wishlist grid -->
        <div class="places-grid" *ngIf="items().length > 0">
          <app-place-card
            *ngFor="let item of items(); trackBy: trackById"
            [place]="item"
          ></app-place-card>
        </div>

        <!-- Empty state -->
        <div class="empty-wishlist" *ngIf="items().length === 0">
          <div class="empty-wishlist__icon">
            <i class="fas fa-heart-broken"></i>
          </div>
          <h3>Вішліст порожній</h3>
          <p>Знайдіть цікаві місця та додайте їх до вішлісту, щоб не забути де хочете побувати.</p>
          <a routerLink="/" class="btn btn--primary">
            <i class="fas fa-search"></i>
            Перейти до пошуку
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wishlist-page {
      padding: 48px 0 80px;
      min-height: calc(100vh - 70px);
    }

    .wl-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }

    .wl-header__left {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .wl-header__title {
      font-family: var(--font-display);
      font-size: clamp(1.6rem, 4vw, 2.4rem);
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .wl-header__subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      max-width: 480px;
    }

    .wl-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 36px;
      flex-wrap: wrap;
    }

    .wl-stat {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px 28px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 140px;
    }

    .wl-stat__value {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 800;
      color: var(--accent-light);
    }

    .wl-stat__label {
      font-size: 0.78rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .places-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .empty-wishlist {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 80px 24px;
      text-align: center;

      h3 {
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        max-width: 420px;
        line-height: 1.6;
      }
    }

    .empty-wishlist__icon {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid rgba(255, 107, 107, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      color: var(--danger-light);
    }
  `]
})
export class WishlistPage {
  private readonly wishlistService = inject(WishlistService);
  private readonly toast = inject(ToastService);

  readonly items = toSignal(this.wishlistService.wishlist$, { initialValue: [] as WishlistItem[] });

  readonly uniqueCities = () => {
    const cities = this.items()
      .map((i) => i.location?.city)
      .filter(Boolean);
    return new Set(cities).size;
  };

  readonly avgRating = () => {
    const rated = this.items().filter((i) => i.rating);
    if (!rated.length) return '—';
    const avg = rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length;
    return avg.toFixed(1);
  };

  onClearAll(): void {
    if (confirm('Видалити всі місця з вішлісту?')) {
      this.wishlistService.clearAll();
      this.toast.show('Вішліст очищено', 'info');
    }
  }

  trackById(_: number, item: WishlistItem): string {
    return item.fsq_id;
  }
}
