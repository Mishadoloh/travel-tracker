import {
  Component, Input, Output, EventEmitter, inject, OnChanges, ChangeDetectionStrategy
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Place } from '../../models/place.model';
import { WishlistService } from '../../services/wishlist.service';
import { PlacesService } from '../../services/places.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-place-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIf, DecimalPipe],
  template: `
    <article class="place-card" [class.place-card--wishlisted]="inWishlist" [routerLink]="['/place', place.fsq_id]">
      <!-- Image -->
      <div class="place-card__image">
        <img
          *ngIf="firstPhoto; else noPhoto"
          [src]="firstPhoto"
          [alt]="place.name"
          loading="lazy"
          (error)="onImgError($event)"
        />
        <div class="place-card__overlay"></div>
        
        <ng-template #noPhoto>
          <div class="place-card__no-photo">
            <i class="fas fa-image"></i>
          </div>
        </ng-template>

        <!-- Rating badge -->
        <div class="place-card__rating-badge" *ngIf="place.rating">
          <i class="fas fa-star"></i>
          <span>{{ place.rating | number:'1.1-1' }}</span>
        </div>

        <!-- Wishlist toggle -->
        <button
          class="place-card__wishlist-btn"
          (click)="onToggleWishlist($event)"
          [attr.aria-label]="inWishlist ? 'Видалити з вішлісту' : 'Додати до вішлісту'"
          [class.place-card__wishlist-btn--active]="inWishlist"
        >
          <i class="fas fa-heart"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="place-card__body">
        <div class="place-card__category" *ngIf="place.categories.length">
          {{ place.categories[0].name }}
        </div>
        
        <h3 class="place-card__name">{{ place.name }}</h3>

        <div class="place-card__meta" *ngIf="place.location.formatted_address">
          <i class="fas fa-location-dot"></i>
          {{ place.location.formatted_address }}
        </div>
        
        <p class="place-card__desc" *ngIf="place.description">
          {{ place.description }}
        </p>

        <div class="place-card__footer">
          <span class="place-card__more">Дізнатись більше <i class="fas fa-arrow-right"></i></span>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .place-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all var(--transition);
      display: flex;
      flex-direction: column;
      cursor: pointer;
      position: relative;

      &:hover {
        transform: translateY(-8px);
        border-color: var(--accent);
        box-shadow: 0 20px 40px rgba(0,0,0,0.4), var(--shadow-glow);
        
        .place-card__overlay { opacity: 0.2; }
        .place-card__image img { transform: scale(1.1); }
        .place-card__more { color: var(--accent-light); transform: translateX(4px); }
      }
    }

    .place-card__image {
      position: relative;
      height: 220px;
      overflow: hidden;
      background: var(--bg-secondary);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }
    }

    .place-card__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, var(--bg-primary), transparent);
      opacity: 0.6;
      transition: opacity var(--transition);
    }

    .place-card__no-photo {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 2.5rem;
      background: var(--bg-secondary);
    }

    .place-card__rating-badge {
      position: absolute;
      top: 16px;
      left: 16px;
      background: var(--gold);
      color: var(--text-inverse);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 2;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }

    .place-card__wishlist-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(10px);
      color: white;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;

      &:hover {
        background: var(--danger);
        border-color: var(--danger);
        transform: scale(1.1);
      }

      &--active {
        color: white !important;
        background: var(--danger) !important;
        border-color: var(--danger) !important;
      }
    }

    .place-card__body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }

    .place-card__category {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent-light);
      font-weight: 700;
    }

    .place-card__name {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .place-card__meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      
      i { color: var(--accent); }
    }

    .place-card__desc {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin: 4px 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .place-card__footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .place-card__more {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all var(--transition);
      
      i { font-size: 0.75rem; }
    }
  `]

})
export class PlaceCardComponent implements OnChanges {
  @Input({ required: true }) place!: Place;
  @Output() wishlistToggled = new EventEmitter<Place>();

  private readonly wishlistService = inject(WishlistService);
  private readonly placesService = inject(PlacesService);
  private readonly toast = inject(ToastService);

  inWishlist = false;
  firstPhoto: string | null = null;

  ngOnChanges(): void {
    this.inWishlist = this.wishlistService.isInWishlist(this.place.fsq_id);
    this.firstPhoto = this.resolvePhoto();
  }

  private resolvePhoto(): string | null {
    if (this.place.photos?.length) {
      return this.placesService.buildPhotoUrl(this.place.photos[0], '400x400');
    }
    return null;
  }

  onToggleWishlist(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.wishlistService.toggle(this.place);
    this.inWishlist = this.wishlistService.isInWishlist(this.place.fsq_id);
    if (this.inWishlist) {
      this.toast.show(`"${this.place.name}" додано до вішлісту`, 'success');
    } else {
      this.toast.show(`"${this.place.name}" видалено з вішлісту`, 'info');
    }
    this.wishlistToggled.emit(this.place);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
