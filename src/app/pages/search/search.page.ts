import {
  Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Subject, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { PlacesService } from '../../services/places.service';
import { GeolocationService } from '../../services/geolocation.service';
import { CacheService } from '../../services/cache.service';
import { ToastService } from '../../services/toast.service';
import { Place } from '../../models/place.model';
import { PlaceCardComponent } from '../../components/place-card/place-card.component';
import { MapComponent } from '../../components/map/map';

@Component({
  selector: 'app-search-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgIf, NgFor, NgClass, PlaceCardComponent, MapComponent],
  template: `
    <div class="search-page" [class.search-page--results]="results().length > 0">
      <!-- Top Navigation/Search Bar (Compact when results exist) -->
      <header class="search-header" [class.search-header--sticky]="results().length > 0">
        <div class="container search-header__container">
          <div class="search-header__logo" *ngIf="results().length > 0">
            <span class="gradient-text">TravelTracker</span>
          </div>
          
          <div class="search-bar" [class.search-bar--compact]="results().length > 0">
            <div class="search-bar__inputs">
              <div class="search-bar__field">
                <i class="fas fa-search search-bar__icon"></i>
                <input
                  type="text"
                  class="search-bar__input"
                  placeholder="Ресторан, музей, парк..."
                  [(ngModel)]="query"
                  (ngModelChange)="onQueryChange($event)"
                  (keydown.enter)="onSearch()"
                  (blur)="hideSuggestions('query')"
                />
                <!-- Autocomplete Dropdown -->
                <div class="autocomplete-dropdown" *ngIf="querySuggestions().length > 0 && showQuerySuggestions()">
                  <button 
                    *ngFor="let sug of querySuggestions()" 
                    class="autocomplete-item"
                    (mousedown)="selectQuery(sug)"
                  >
                    <i [class]="getCategoryIcon(sug)"></i> {{ sug }}
                  </button>
                </div>
              </div>
              <div class="search-bar__divider"></div>
              <div class="search-bar__field">
                <i class="fas fa-location-dot search-bar__icon"></i>
                <input
                  type="text"
                  class="search-bar__input"
                  placeholder="Місто (Kyiv, Paris, Rome...)"
                  [(ngModel)]="near"
                  (ngModelChange)="onNearChange($event)"
                  (keydown.enter)="onSearch()"
                  (blur)="hideSuggestions('near')"
                />
                <!-- Autocomplete Dropdown -->
                <div class="autocomplete-dropdown" *ngIf="locationSuggestions().length > 0 && showLocationSuggestions()">
                  <button 
                    *ngFor="let loc of locationSuggestions()" 
                    class="autocomplete-item"
                    (mousedown)="selectLocation(loc)"
                  >
                    <i class="fas fa-map-marker-alt"></i> {{ loc.display_name }}
                  </button>
                </div>
                <button
                  class="search-bar__geo-btn"
                  (click)="onUseGeolocation()"
                  [disabled]="geoLoading()"
                  title="Моя локація"
                >
                  <i class="fas" [ngClass]="geoLoading() ? 'fa-spinner fa-spin' : 'fa-crosshairs'"></i>
                </button>
              </div>
            </div>
            
            <button
              class="btn btn--primary search-bar__submit"
              (click)="onSearch()"
              [disabled]="loading()"
            >
              <i class="fas" [ngClass]="loading() ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'"></i>
              <span class="search-bar__submit-text">{{ loading() ? '...' : 'Знайти' }}</span>
            </button>
          </div>
          
          <div class="search-header__actions" *ngIf="results().length > 0">
            <button class="btn btn--icon" (click)="onClear()" title="Очистити">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Hero (Only shown when NO results and NOT searching) -->
        <section class="hero" *ngIf="results().length === 0 && !loading() && !searched()">
          <div class="container hero__container">
            <h1 class="hero__title">Ваша наступна <span class="gradient-text">пригода</span> починається тут</h1>
            <p class="hero__subtitle">Шукайте найкращі місця, готелі, музеї та ресторани по всьому світу.</p>
            
            <div class="popular-tags">
              <button *ngFor="let hint of popularHints" class="tag-btn" (click)="applyHint(hint)">
                {{ hint.emoji }} {{ hint.query }}
              </button>
            </div>
          </div>
        </section>

        <!-- Split View (Map + List) -->
        <div class="split-view" *ngIf="results().length > 0">
          <!-- Sidebar: Results List -->
          <aside class="results-sidebar">
            <div class="results-info">
              <h2 class="results-info__title">
                Знайдено {{ results().length }} місць
                <span class="results-info__query" *ngIf="lastQuery()"> для "{{ lastQuery() }}"</span>
              </h2>
              <div class="results-info__filters">
                <select class="filter-select" [(ngModel)]="sortBy" (change)="onSortChange()">
                  <option value="relevance">Релевантність</option>
                  <option value="rating">Рейтинг</option>
                  <option value="name">Назва</option>
                </select>
              </div>
            </div>
            
            <div class="results-list">
              <app-place-card
                *ngFor="let place of results(); trackBy: trackById"
                [place]="place"
                class="results-list__item"
              ></app-place-card>
            </div>
          </aside>

          <!-- Main: Interactive Map -->
          <div class="map-view">
            <app-map [places]="results()" [center]="mapCenter()"></app-map>
          </div>
        </div>

        <!-- States -->
        <div class="container">
          <!-- Loading State -->
          <div class="loading-state" *ngIf="loading()">
            <div class="places-grid">
              <div class="skeleton-card" *ngFor="let s of skeletons">
                <div class="skeleton skeleton-card__img"></div>
                <div class="skeleton-card__body">
                  <div class="skeleton skeleton-card__line skeleton-card__line--title"></div>
                  <div class="skeleton skeleton-card__line"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="!loading() && searched() && results().length === 0 && !error()">
            <div class="empty-state__icon">📍</div>
            <h2>Нічого не знайдено</h2>
            <p>Спробуйте інше слово або змініть радіус пошуку.</p>
            <button class="btn btn--primary" (click)="onClear()">Скинути пошук</button>
          </div>

          <!-- Error State -->
          <div class="error-state" *ngIf="error()">
            <div class="error-state__icon">⚠️</div>
            <h2>Помилка завантаження</h2>
            <p>{{ error() }}</p>
            <button class="btn btn--primary" (click)="onSearch()">Повторити спробу</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .search-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      
      &--results {
        height: 100vh;
        overflow: hidden;
      }
    }

    // ===== HEADER & SEARCH BAR =====
    .search-header {
      padding: 40px 0;
      transition: all var(--transition-slow);
      z-index: 100;
      
      &--sticky {
        padding: 16px 0;
        background: var(--bg-glass);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
    }

    .search-header__container {
      display: flex;
      align-items: center;
      gap: 24px;
      justify-content: center;
    }

    .search-header__logo {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.2rem;
      flex-shrink: 0;
      
      @media (max-width: 768px) {
        display: none;
      }
    }

    .search-bar {
      display: flex;
      align-items: center;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      padding: 6px;
      box-shadow: var(--shadow-md);
      max-width: 600px;
      width: 100%;
      transition: all var(--transition);

      &:focus-within {
        border-color: var(--accent);
        box-shadow: var(--shadow-lg), 0 0 0 4px var(--accent-glow);
      }

      &--compact {
        max-width: 500px;
      }
    }

    .search-bar__inputs {
      display: flex;
      flex: 1;
      align-items: center;
    }

    .search-bar__field {
      display: flex;
      align-items: center;
      flex: 1;
      padding: 0 16px;
      position: relative;
    }

    .search-bar__icon {
      color: var(--accent-light);
      font-size: 0.9rem;
      margin-right: 12px;
    }

    .search-bar__input {
      background: none;
      border: none;
      color: var(--text-primary);
      font-size: 0.9rem;
      width: 100%;
      outline: none;
      padding: 8px 0;

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .search-bar__divider {
      width: 1px;
      height: 24px;
      background: var(--border);
    }

    .search-bar__geo-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px;
      transition: color var(--transition);

      &:hover { color: var(--accent); }
    }

    .search-bar__submit {
      border-radius: var(--radius-full);
      padding: 10px 24px;
    }

    .search-bar__submit-text {
      @media (max-width: 480px) { display: none; }
    }
    
    .autocomplete-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      margin-top: 8px;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      overflow: hidden;
      backdrop-filter: blur(20px);
    }
    
    .autocomplete-item {
      width: 100%;
      padding: 12px 16px;
      text-align: left;
      background: none;
      border: none;
      color: var(--text-primary);
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background var(--transition);
      
      i { color: var(--accent-light); font-size: 0.75rem; width: 14px; }
      
      &:hover {
        background: var(--bg-card-hover);
      }
      
      &:not(:last-child) {
        border-bottom: 1px solid var(--border);
      }
    }

    // ===== HERO =====
    .hero {
      padding: 80px 0 40px;
      text-align: center;
    }

    .hero__title {
      font-family: var(--font-display);
      font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: 800;
      margin-bottom: 20px;
      line-height: 1.1;
    }

    .hero__subtitle {
      color: var(--text-secondary);
      font-size: 1.1rem;
      margin-bottom: 40px;
    }

    .popular-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }

    .tag-btn {
      background: var(--bg-glass-light);
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: 8px 16px;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all var(--transition);
      font-weight: 500;

      &:hover {
        background: var(--bg-card-hover);
        border-color: var(--accent);
        transform: translateY(-2px);
      }
    }

    // ===== SPLIT VIEW =====
    .split-view {
      display: flex;
      flex: 1;
      height: calc(100vh - 84px); // Adjust based on header height
      
      @media (max-width: 1024px) {
        flex-direction: column-reverse;
      }
    }

    .results-sidebar {
      width: 420px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      @media (max-width: 1024px) {
        width: 100%;
        height: 50%;
      }
    }

    .results-info {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-card);
    }

    .results-info__title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .results-info__query {
      font-weight: 400;
      color: var(--text-secondary);
    }

    .filter-select {
      background: var(--bg-glass-light);
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      outline: none;
    }

    .results-list {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      
      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
    }

    .map-view {
      flex: 1;
      position: relative;
    }

    // ===== STATES =====
    .loading-state, .empty-state, .error-state {
      padding: 60px 0;
      text-align: center;
    }

    .empty-state__icon, .error-state__icon {
      font-size: 3rem;
      margin-bottom: 20px;
    }

    .places-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .skeleton-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      overflow: hidden;
      height: 340px;
    }

    .skeleton-card__img { height: 200px; }
    .skeleton-card__body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .skeleton-card__line { height: 16px; border-radius: 4px; }
    .skeleton-card__line--title { width: 70%; height: 24px; }
  `]
})
export class SearchPage implements OnInit, OnDestroy {
  private readonly placesService = inject(PlacesService);
  private readonly geoService = inject(GeolocationService);
  private readonly cache = inject(CacheService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  query = '';
  near = '';
  sortBy = 'relevance';

  loading  = signal(false);
  error    = signal<string | null>(null);
  results  = signal<Place[]>([]);
  fromCache = signal(false);
  searched  = signal(false);
  lastQuery = signal('');
  geoLoading = signal(false);
  geoCoords: { lat: number; lng: number } | null = null;

  // Autocomplete Signals
  querySuggestions = signal<string[]>([]);
  locationSuggestions = signal<any[]>([]);
  showQuerySuggestions = signal(false);
  showLocationSuggestions = signal(false);

  private readonly querySubject = new Subject<string>();
  private readonly nearSubject = new Subject<string>();

  readonly skeletons = Array(6).fill(null);

  readonly popularHints = [
    { emoji: '🗼', query: 'Музеї', near: 'Париж' },
    { emoji: '🏨', query: 'Готелі', near: 'Лондон' },
    { emoji: '🏔️', query: 'Парки', near: 'Відень' },
    { emoji: '🏯', query: 'Замки', near: 'Київ' },
    { emoji: '🍜', query: 'Ресторани', near: 'Токіо' },
  ];

  // Map center logic
  mapCenter = computed(() => {
    if (this.geoCoords) return this.geoCoords;
    if (this.results().length > 0) {
      const first = this.results()[0];
      if (first.location.lat && first.location.lng) {
        return { lat: first.location.lat, lng: first.location.lng };
      }
    }
    return null;
  });

  ngOnInit(): void {
    // Setup debounced query suggestions
    this.querySubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(val => val.length >= 2 ? this.placesService.getAutocompleteSuggestions(val) : of([])),
      takeUntil(this.destroy$)
    ).subscribe(sugs => this.querySuggestions.set(sugs));

    // Setup debounced location suggestions
    this.nearSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(val => val.length >= 3 ? this.placesService.getAutocompleteLocations(val) : of([])),
      takeUntil(this.destroy$)
    ).subscribe(locs => this.locationSuggestions.set(locs));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyHint(hint: { query: string; near: string }): void {
    this.query = hint.query;
    this.near  = hint.near;
    this.geoCoords = null;
    this.onSearch();
  }

  async onUseGeolocation(): Promise<void> {
    this.geoLoading.set(true);
    try {
      const coords = await this.geoService.getCurrentPosition();
      this.geoCoords = { lat: coords.latitude, lng: coords.longitude };
      this.near = `Моє місцезнаходження`;
      this.toast.show('Геолокацію визначено', 'success');
      this.onSearch();
    } catch {
      this.toast.show('Не вдалось отримати геолокацію', 'error');
    } finally {
      this.geoLoading.set(false);
    }
  }

  // Autocomplete Handlers
  onQueryChange(val: string): void {
    this.showQuerySuggestions.set(true);
    this.querySubject.next(val);
  }

  onNearChange(val: string): void {
    this.geoCoords = null; // Clear manual coords if user typing
    this.showLocationSuggestions.set(true);
    this.nearSubject.next(val);
  }

  selectQuery(sug: string): void {
    this.query = sug;
    this.showQuerySuggestions.set(false);
  }

  selectLocation(loc: any): void {
    this.near = loc.display_name;
    this.geoCoords = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };
    this.showLocationSuggestions.set(false);
  }

  hideSuggestions(type: 'query' | 'near'): void {
    // Delay to allow mousedown on item
    setTimeout(() => {
      if (type === 'query') this.showQuerySuggestions.set(false);
      else this.showLocationSuggestions.set(false);
    }, 200);
  }

  onSearch(): void {
    if (!this.query.trim() && !this.near.trim() && !this.geoCoords) {
      this.toast.show('Введіть щось для пошуку', 'info');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.results.set([]);
    this.fromCache.set(false);
    this.searched.set(true);
    this.lastQuery.set(this.query || (this.geoCoords ? 'Поруч зі мною' : this.near));

    const params: any = {
      query: this.query.trim() || undefined,
      limit: 20
    };

    if (this.geoCoords) {
      params.lat = this.geoCoords.lat;
      params.lng = this.geoCoords.lng;
    } else if (this.near.trim()) {
      params.near = this.near.trim();
    }

    this.placesService.searchPlaces(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ places, fromCache }) => {
        this.results.set(this.sortPlaces(places));
        this.fromCache.set(fromCache);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err instanceof Error ? err.message : 'Сталася помилка. Спробуйте ще раз.');
        this.loading.set(false);
      },
    });
  }

  getCategoryIcon(sug: string): string {
    const s = sug.toLowerCase();
    if (s.includes('ресторан') || s.includes('їж') || s.includes('food')) return 'fas fa-utensils';
    if (s.includes('музей') || s.includes('museum') || s.includes('арт')) return 'fas fa-landmark';
    if (s.includes('парк') || s.includes('park') || s.includes('сад')) return 'fas fa-tree';
    if (s.includes('готел') || s.includes('hotel') || s.includes('хостел')) return 'fas fa-hotel';
    if (s.includes('замок') || s.includes('castle') || s.includes('палац')) return 'fas fa-fort-awesome';
    if (s.includes('кав') || s.includes('cafe') || s.includes('coffee')) return 'fas fa-coffee';
    return 'fas fa-magnifying-glass';
  }

  onSortChange(): void {
    this.results.set(this.sortPlaces(this.results()));
  }

  private sortPlaces(places: Place[]): Place[] {
    if (this.sortBy === 'rating') {
      return [...places].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (this.sortBy === 'name') {
      return [...places].sort((a, b) => a.name.localeCompare(b.name));
    }
    return places; // relevance is default from API
  }

  onClear(): void {
    this.results.set([]);
    this.searched.set(false);
    this.query = '';
    this.near  = '';
    this.geoCoords = null;
    this.error.set(null);
  }

  trackById(_: number, place: Place): string {
    return place.fsq_id;
  }
}
