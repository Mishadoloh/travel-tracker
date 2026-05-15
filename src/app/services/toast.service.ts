import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts = this.toasts$.asObservable();

  show(message: string, type: Toast['type'] = 'info', duration = 3500): void {
    const id = Math.random().toString(36).slice(2);
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    const toast: Toast = { id, message, type, icon: icons[type] };
    this.toasts$.next([...this.toasts$.value, toast]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string): void {
    this.toasts$.next(this.toasts$.value.filter((t) => t.id !== id));
  }
}
