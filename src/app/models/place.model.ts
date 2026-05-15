export interface Place {
  fsq_id: string;
  name: string;
  location: PlaceLocation;
  categories: Category[];
  rating?: number;
  photos?: Photo[];
  tips?: Tip[];
  description?: string;
  website?: string;
  hours?: Hours;
  stats?: PlaceStats;
  distance?: number;
}

export interface PlaceLocation {
  address?: string;
  city?: string;
  country?: string;
  formatted_address?: string;
  lat?: number;
  lng?: number;
}

export interface Category {
  id: number;
  name: string;
  icon?: CategoryIcon;
}

export interface CategoryIcon {
  prefix: string;
  suffix: string;
}

export interface Photo {
  id: string;
  prefix: string;
  suffix: string;
  width: number;
  height: number;
}

export interface Tip {
  id: string;
  text: string;
  created_at: string;
  likes?: { count: number };
}

export interface Hours {
  open_now?: boolean;
  display?: string;
  regular?: HoursPeriod[];
}

export interface HoursPeriod {
  day: number;
  open: string;
  close: string;
}

export interface PlaceStats {
  total_photos?: number;
  total_ratings?: number;
  total_tips?: number;
}

export interface SearchParams {
  query?: string;
  near?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  categories?: string;
}

export interface SearchState {
  loading: boolean;
  error: string | null;
  results: Place[];
  query: string;
  near: string;
  fromCache: boolean;
}

export interface CacheEntry {
  data: Place[];
  timestamp: number;
  key: string;
}

export interface WishlistItem extends Place {
  addedAt: number;
}
