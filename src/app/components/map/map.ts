import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Place } from '../../models/place.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapContainer class="map-container"></div>`,
  styles: [`
    .map-container {
      height: 100%;
      width: 100%;
      min-height: 400px;
      border-radius: 20px;
      overflow: hidden;
      z-index: 10;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    ::ng-deep .leaflet-popup-content-wrapper {
      background: rgba(30, 41, 59, 0.9) !important;
      color: white !important;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
    }
    
    ::ng-deep .leaflet-popup-tip {
      background: rgba(30, 41, 59, 0.9) !important;
    }
  `]
})
export class MapComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() places: Place[] = [];
  @Input() center: { lat: number, lng: number } | null = null;

  private map!: L.Map;
  private markers: L.Marker[] = [];

  constructor() {
    // Fix Leaflet icon issue
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map) {
      if (changes['places']) {
        this.updateMarkers();
      }
      if (changes['center'] && this.center && !changes['center'].firstChange) {
        this.map.setView([this.center.lat, this.center.lng], 13);
      }
    }
  }

  private initMap() {
    const defaultLat = 50.4501;
    const defaultLng = 30.5234;
    
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false
    }).setView(
      this.center ? [this.center.lat, this.center.lng] : [defaultLat, defaultLng], 
      13
    );

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    const primaryTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });

    primaryTileLayer.on('tileerror', () => {
      console.warn('CartoDB tiles failed, falling back to OSM...');
      this.map.removeLayer(primaryTileLayer);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    });

    primaryTileLayer.addTo(this.map);
    this.updateMarkers();
  }

  private updateMarkers() {
    this.markers.forEach(m => m.remove());
    this.markers = [];

    this.places.forEach(place => {
      if (place.location.lat && place.location.lng) {
        const marker = L.marker([place.location.lat, place.location.lng])
          .bindPopup(`
            <div style="padding: 5px">
              <h3 style="margin: 0 0 5px 0; font-size: 16px">${place.name}</h3>
              <p style="margin: 0; font-size: 12px; opacity: 0.8">${place.location.formatted_address}</p>
            </div>
          `)
          .addTo(this.map);
        this.markers.push(marker);
      }
    });

    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
