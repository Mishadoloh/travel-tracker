import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/search/search.page').then((m) => m.SearchPage),
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./pages/wishlist/wishlist.page').then((m) => m.WishlistPage),
  },
  {
    path: 'place/:id',
    loadComponent: () =>
      import('./pages/place-detail/place-detail.page').then((m) => m.PlaceDetailPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
