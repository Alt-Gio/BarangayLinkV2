"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Barangay Bitano coordinates (Legazpi City, Albay)
const BARANGAY_CENTER = {
  lng: 123.7445,
  lat: 13.1391
};

export default function MapboxMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmFyYW5nYXlsaW5rIiwiYSI6ImNreDEyM3h5ejAwMDAyb3BlemR5aHp3Z3oifQ.example';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [BARANGAY_CENTER.lng, BARANGAY_CENTER.lat],
      zoom: 14,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add 3D buildings
    map.current.on('load', () => {
      if (!map.current) return;

      // Add 3D building layer
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      map.current.addLayer(
        {
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#10b981',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );

      // Add main marker for Barangay Hall
      const barangayHall = new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([BARANGAY_CENTER.lng, BARANGAY_CENTER.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px; color: #10b981;">Barangay Bitano Hall</h3>
                <p style="font-size: 12px; color: #6b7280;">Main Administrative Office</p>
              </div>
            `)
        )
        .addTo(map.current);

      // Add additional points of interest
      const pois = [
        { 
          name: 'Health Center', 
          lng: BARANGAY_CENTER.lng + 0.005, 
          lat: BARANGAY_CENTER.lat + 0.003,
          color: '#ef4444' 
        },
        { 
          name: 'Community Center', 
          lng: BARANGAY_CENTER.lng - 0.004, 
          lat: BARANGAY_CENTER.lat + 0.002,
          color: '#3b82f6' 
        },
        { 
          name: 'Sports Complex', 
          lng: BARANGAY_CENTER.lng + 0.003, 
          lat: BARANGAY_CENTER.lat - 0.004,
          color: '#8b5cf6' 
        }
      ];

      pois.forEach(poi => {
        new mapboxgl.Marker({ color: poi.color })
          .setLngLat([poi.lng, poi.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; color: ${poi.color};">${poi.name}</h3>
                </div>
              `)
          )
          .addTo(map.current!);
      });
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: '100%' }}
    />
  );
}
