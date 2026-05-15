import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WishlistService } from '../../services/wishlist.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar__inner container">
        <a routerLink="/" class="navbar__brand">
          <span class="navbar__logo">
            <i class="fas fa-globe-americas"></i>
          </span>
          <span class="navbar__name">Travel<span class="accent">Tracker</span></span>
        </a>

        <div class="navbar__links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            <i class="fas fa-search"></i>
            <span>Пошук</span>
          </a>
          <a routerLink="/wishlist" routerLinkActive="active" class="nav-link">
            <i class="fas fa-heart"></i>
            <span>Вішліст</span>
            @if (wishlistCount() > 0) {
              <span class="nav-link__badge">{{ wishlistCount() }}</span>
            }
          </a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-dropdown);
      background: rgba(10, 15, 30, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      height: 70px;
    }

    .navbar__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
    }

    .navbar__brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .navbar__logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--accent), var(--teal));
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: white;
      box-shadow: 0 4px 15px var(--accent-glow);
    }

    .navbar__name {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);

      .accent {
        color: var(--accent-light);
      }
    }

    .navbar__links {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all var(--transition);
      position: relative;

      i { font-size: 0.9rem; }

      &:hover {
        color: var(--text-primary);
        background: var(--bg-glass-light);
      }

      &.active {
        color: var(--accent-light);
        background: var(--accent-glow);
      }
    }

    .nav-link__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      background: linear-gradient(135deg, var(--danger), #d94040);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: var(--radius-full);
      animation: bounceIn 0.3s ease;
    }

    @media (max-width: 480px) {
      .navbar__name { font-size: 1.1rem; }
      .nav-link span { display: none; }
      .nav-link { padding: 8px 12px; }
    }
  `]
})
export class NavbarComponent {
  private readonly wishlistService = inject(WishlistService);

  // toSignal bridges the RxJS Observable to a Signal — works well with zoneless CD
  readonly wishlistCount = toSignal(
    this.wishlistService.wishlist$.pipe(map((items) => items.length)),
    { initialValue: 0 }
  );
}
