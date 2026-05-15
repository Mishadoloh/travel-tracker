import { Component, OnInit, inject, signal, Input, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { PlacesService } from '../../services/places.service';
import { WishlistService } from '../../services/wishlist.service';
import { ToastService } from '../../services/toast.service';
import { Place, Photo, Tip } from '../../models/place.model';

@Component({
  selector: 'app-place-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, DecimalPipe, DatePipe, RouterLink],
  template: `
    <div class="detail-page">

      <!-- Loading State -->
      <div class="detail-loading" *ngIf="loading()">
        <div class="detail-loading__spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>Завантаження деталей...</p>
      </div>

      <!-- Error State -->
      <div class="state-screen" *ngIf="error() && !loading()">
        <div class="state-screen__icon state-screen__icon--error">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3>Помилка завантаження</h3>
        <p>{{ error() }}</p>
        <a routerLink="/" class="btn btn--primary">
          <i class="fas fa-arrow-left"></i> На головну
        </a>
      </div>

      <!-- Place Detail -->
      <ng-container *ngIf="place() && !loading()">
        <!-- Hero / Photos -->
        <section class="detail-hero">
          <div class="detail-hero__photos">
            <div class="detail-hero__main-photo" *ngIf="photos().length > 0; else noHeroPhoto">
              <img [src]="activePhoto()" [alt]="place()!.name" (error)="onImgError($event)" />
            </div>
            <ng-template #noHeroPhoto>
              <div class="detail-hero__no-photo">
                <i class="fas fa-image"></i>
                <span>Фото недоступні</span>
              </div>
            </ng-template>

            <!-- Thumbnail strip -->
            <div class="detail-hero__thumbs" *ngIf="photos().length > 1">
              <button
                *ngFor="let photo of photos(); let i = index"
                class="detail-hero__thumb"
                [class.active]="i === activeIndex()"
                (click)="setActivePhoto(i)"
              >
                <img [src]="buildPhotoUrl(photo, '100x100')" [alt]="'Photo ' + (i+1)" />
              </button>
            </div>
          </div>
        </section>

        <!-- Back + Wishlist header -->
        <div class="detail-topbar container">
          <a routerLink="/" class="btn btn--secondary btn--sm">
            <i class="fas fa-arrow-left"></i>
            Назад до пошуку
          </a>
          <button
            class="btn wishlist-toggle-btn"
            [class.wishlist-toggle-btn--active]="inWishlist()"
            (click)="onToggleWishlist()"
            id="detail-wishlist-btn"
          >
            <i class="fas fa-heart"></i>
            {{ inWishlist() ? 'У вішлісті' : 'До вішлісту' }}
          </button>
        </div>

        <!-- Main Content -->
        <div class="container detail-content">
          <div class="detail-main">
            <!-- Place info -->
            <div class="detail-info">
              <!-- Categories -->
              <div class="detail-categories" *ngIf="place()!.categories.length">
                <span
                  *ngFor="let cat of place()!.categories"
                  class="badge badge--accent"
                >
                  <i class="fas fa-tag"></i>
                  {{ cat.name }}
                </span>
              </div>

              <h1 class="detail-name">{{ place()!.name }}</h1>

              <!-- Meta row -->
              <div class="detail-meta">
                <div class="detail-meta__item" *ngIf="place()!.rating">
                  <i class="fas fa-star text-gold"></i>
                  <strong>{{ place()!.rating | number:'1.1-1' }}</strong>
                  <span>Рейтинг</span>
                </div>
                <div class="detail-meta__item" *ngIf="place()!.location.city">
                  <i class="fas fa-map-marker-alt text-teal"></i>
                  <span>{{ place()!.location.city }}</span>
                </div>
                <div class="detail-meta__item" *ngIf="place()!.hours?.open_now !== undefined">
                  <i class="fas fa-clock" [class.text-success]="place()!.hours!.open_now" [class.text-danger]="!place()!.hours!.open_now"></i>
                  <span>{{ place()!.hours!.open_now ? 'Зараз відчинено' : 'Зачинено' }}</span>
                </div>
                <div class="detail-meta__item" *ngIf="place()!.distance">
                  <i class="fas fa-route text-accent"></i>
                  <span>{{ (place()!.distance! / 1000).toFixed(1) }} км</span>
                </div>
              </div>

              <!-- Address -->
              <div class="detail-address" *ngIf="place()!.location.formatted_address">
                <i class="fas fa-map-pin"></i>
                {{ place()!.location.formatted_address }}
              </div>

              <!-- Description -->
              <div class="detail-description" *ngIf="place()!.description && place()!.description!.length > 50">
                <h3><i class="fas fa-info-circle"></i> Про місце</h3>
                <p>{{ place()!.description }}</p>
              </div>

              <!-- Hours -->
              <div class="detail-hours" *ngIf="place()!.hours?.display">
                <h3><i class="fas fa-clock"></i> Години роботи</h3>
                <p class="detail-hours__display">{{ place()!.hours!.display }}</p>
              </div>

              <!-- Website -->
              <a
                *ngIf="place()!.website"
                [href]="place()!.website"
                target="_blank"
                rel="noopener"
                class="btn btn--secondary detail-website"
              >
                <i class="fas fa-external-link-alt"></i>
                Відвідати сайт
              </a>
            </div>

            <!-- Tips / Reviews -->
            <div class="detail-tips" *ngIf="tips().length > 0">
              <h3 class="detail-section-title">
                <i class="fas fa-comment-dots"></i>
                Поради та відгуки
              </h3>
              <div class="tips-list">
                <div class="tip-card" *ngFor="let tip of tips()">
                  <div class="tip-card__icon">
                    <i class="fas fa-quote-left"></i>
                  </div>
                  <div class="tip-card__body">
                    <p class="tip-card__text">{{ tip.text }}</p>
                    <div class="tip-card__footer">
                      <span class="tip-card__date">
                        {{ tip.created_at | date:'mediumDate' }}
                      </span>
                      <span class="tip-card__likes" *ngIf="tip.likes?.count">
                        <i class="fas fa-thumbs-up"></i>
                        {{ tip.likes!.count }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- User Recommendations -->
            <div class="detail-recs">
              <h3 class="detail-section-title">
                <i class="fas fa-users"></i>
                Рекомендації від користувачів
              </h3>
              <div class="rec-card" *ngFor="let rec of recommendations">
                <div class="rec-card__top">
                  <span class="rec-card__author">{{ rec.author }}</span>
                  <span class="rec-card__stars"><i class="fas fa-star" *ngFor="let s of rec.starsArr"></i></span>
                </div>
                <p class="rec-card__text">{{ rec.text }}</p>
                <span class="rec-card__date">{{ rec.date }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .detail-page {
      min-height: calc(100vh - 70px);
      padding-bottom: 80px;
    }

    // ===== LOADING =====
    .detail-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 120px 24px;
      color: var(--text-secondary);

      &__spinner {
        font-size: 2.5rem;
        color: var(--accent-light);
      }
    }

    // ===== STATE SCREEN (reuse) =====
    .state-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 80px 24px;
      text-align: center;

      h3 {
        font-family: var(--font-display);
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      p { color: var(--text-secondary); max-width: 400px; }
    }

    .state-screen__icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--accent-glow);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: var(--accent-light);
      &--error { background: rgba(255,107,107,.1); color: var(--danger-light); }
    }

    // ===== HERO =====
    .detail-hero {
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .detail-hero__photos {
      position: relative;
    }

    .detail-hero__main-photo {
      height: 420px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      @media (max-width: 640px) { height: 260px; }
    }

    .detail-hero__no-photo {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-muted);
      font-size: 2.5rem;

      span { font-size: 1rem; }
    }

    .detail-hero__thumbs {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      overflow-x: auto;
      background: var(--bg-secondary);

      &::-webkit-scrollbar { height: 4px; }
    }

    .detail-hero__thumb {
      flex-shrink: 0;
      width: 72px;
      height: 52px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all var(--transition);
      background: none;
      padding: 0;

      img { width: 100%; height: 100%; object-fit: cover; }

      &:hover { border-color: var(--border-hover); }
      &.active { border-color: var(--accent); }
    }

    // ===== TOP BAR =====
    .detail-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 24px;
      padding-bottom: 8px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .wishlist-toggle-btn {
      background: var(--bg-glass-light);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        color: var(--danger-light);
        border-color: rgba(255,107,107,.3);
        background: rgba(255,107,107,.08);
      }

      &--active {
        color: var(--danger-light) !important;
        border-color: rgba(255,107,107,.4) !important;
        background: rgba(255,107,107,.12) !important;
      }
    }

    // ===== CONTENT =====
    .detail-content {
      padding-top: 36px;
    }

    .detail-main {
      display: flex;
      flex-direction: column;
      gap: 40px;
      max-width: 860px;
    }

    .detail-categories {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .detail-name {
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.15;
    }

    .detail-meta {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .detail-meta__item {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.9rem;
      color: var(--text-secondary);

      strong { color: var(--text-primary); font-weight: 700; }
      i { width: 16px; text-align: center; }
    }

    .text-gold { color: var(--gold); }
    .text-teal { color: var(--teal); }
    .text-accent { color: var(--accent-light); }
    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }

    .detail-address {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 4px;
      padding: 14px 18px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);

      i { color: var(--danger-light); margin-top: 2px; flex-shrink: 0; }
    }

    .detail-description,
    .detail-hours {
      h3 {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        i { color: var(--accent-light); }
      }

      p {
        color: var(--text-secondary);
        line-height: 1.7;
        font-size: 0.95rem;
      }
    }

    .detail-website {
      align-self: flex-start;
    }

    // ===== TIPS =====
    .detail-section-title {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;

      i { color: var(--accent-light); }
    }

    .tips-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tip-card {
      display: flex;
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      transition: border-color var(--transition);

      &:hover { border-color: var(--border-hover); }
    }

    .tip-card__icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--accent-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-light);
      font-size: 0.85rem;
    }

    .tip-card__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tip-card__text {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .tip-card__footer {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .tip-card__date {
      font-size: 0.76rem;
      color: var(--text-muted);
    }

    .tip-card__likes {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.78rem;
      color: var(--accent-light);

      i { font-size: 0.72rem; }
    }

    // ===== RECOMMENDATIONS =====
    .detail-recs {
      margin-top: 32px;
    }

    .rec-card {
      background: #131d35 !important;
      border: 1px solid rgba(108, 143, 255, 0.12);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .rec-card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .rec-card__author {
      color: #e8eaf6 !important;
      font-weight: 700 !important;
      font-size: 0.92rem !important;
    }

    .rec-card__stars {
      color: #f7c55f !important;
      font-size: 0.75rem;
    }

    .rec-card__text {
      color: #a0aec0 !important;
      font-size: 0.88rem !important;
      line-height: 1.6;
      margin: 0 0 8px 0;
    }

    .rec-card__date {
      color: #6b7a99 !important;
      font-size: 0.75rem !important;
    }
  `]
})
export class PlaceDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly placesService = inject(PlacesService);
  private readonly wishlistService = inject(WishlistService);
  private readonly toast = inject(ToastService);

  loading  = signal(true);
  error    = signal<string | null>(null);
  place    = signal<Place | null>(null);
  photos   = signal<Photo[]>([]);
  tips     = signal<Tip[]>([]);
  inWishlist = signal(false);
  activeIndex = signal(0);

  readonly recommendations = [
    { author: 'Олена К.', text: 'Дуже гарне місце! Рекомендую відвідати вранці, коли менше туристів.', date: '12 травня 2025', starsArr: [1,2,3,4,5] },
    { author: 'Максим П.', text: 'Чудова атмосфера та краєвиди. Обовʼязково візьміть камеру!', date: '3 квітня 2025', starsArr: [1,2,3,4] },
    { author: 'Ірина С.', text: 'Цікаве місце з багатою історією. Варто приділити мінімум 2 години.', date: '28 березня 2025', starsArr: [1,2,3,4,5] },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadPlace(id);
  }

  private loadPlace(id: string): void {
    this.loading.set(true);
    this.placesService.getPlaceDetails(id).subscribe({
      next: (place) => {
        this.place.set(place);
        this.photos.set(place.photos ?? []);
        this.tips.set(place.tips ?? []);
        this.inWishlist.set(this.wishlistService.isInWishlist(id));
        this.loading.set(false);

        // Fetch tips separately if not embedded
        if (!place.tips?.length) {
          this.placesService.getPlaceTips(id).subscribe((tips) => this.tips.set(tips));
        }
      },
      error: (err) => {
        this.error.set('Не вдалось завантажити деталі місця.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  setActivePhoto(index: number): void {
    this.activeIndex.set(index);
  }

  activePhoto(): string {
    const photos = this.photos();
    if (!photos.length) return '';
    return this.buildPhotoUrl(photos[this.activeIndex()], '800x800');
  }

  buildPhotoUrl(photo: Photo, size: any): string {
    return this.placesService.buildPhotoUrl(photo, size);
  }

  onToggleWishlist(): void {
    const place = this.place();
    if (!place) return;
    this.wishlistService.toggle(place);
    const isNow = this.wishlistService.isInWishlist(place.fsq_id);
    this.inWishlist.set(isNow);
    this.toast.show(
      isNow ? `"${place.name}" додано до вішлісту` : `"${place.name}" видалено з вішлісту`,
      isNow ? 'success' : 'info'
    );
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
