import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [],
  template: `
    <div class="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" (click)="toastService.dismiss(toast.id)">
          <i class="fas {{ toast.icon }}"></i>
          <span>{{ toast.message }}</span>
          <button class="toast__close" aria-label="Закрити">
            <i class="fas fa-times"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: var(--z-toast);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: var(--radius-md);
      backdrop-filter: blur(20px);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      pointer-events: all;
      animation: slideInRight 0.3s ease;
      box-shadow: var(--shadow-md);
      min-width: 240px;
      max-width: 360px;

      &--success {
        background: rgba(81, 207, 102, 0.15);
        border: 1px solid rgba(81, 207, 102, 0.3);
        color: #51cf66;
      }

      &--error {
        background: rgba(255, 107, 107, 0.15);
        border: 1px solid rgba(255, 107, 107, 0.3);
        color: var(--danger-light);
      }

      &--info {
        background: rgba(108, 143, 255, 0.15);
        border: 1px solid rgba(108, 143, 255, 0.3);
        color: var(--accent-light);
      }
    }

    .toast__close {
      margin-left: auto;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.7;
      padding: 2px;
      font-size: 0.75rem;

      &:hover { opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  readonly toasts = toSignal(this.toastService.toasts, { initialValue: [] });
}
