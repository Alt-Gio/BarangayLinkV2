"use client";

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Crosshair } from 'lucide-react';

interface MapCoordinatePickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

export default function MapCoordinatePicker({
  latitude,
  longitude,
  onLocationSelect,
  height = "400px"
}: MapCoordinatePickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [currentCoords, setCurrentCoords] = useState({ lat: latitude, lng: longitude });

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Colored satellite view
        center: [longitude, latitude],
        zoom: 16,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Create draggable marker
      const markerEl = document.createElement('div');
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        background-color: #ef4444;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      markerEl.innerHTML = '<div style="transform: rotate(45deg); color: white; font-size: 20px;">📍</div>';

      marker.current = new mapboxgl.Marker({
        element: markerEl,
        draggable: true
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Update coordinates when marker is dragged
      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat();
        setCurrentCoords({ lat: lngLat.lat, lng: lngLat.lng });
        onLocationSelect(lngLat.lat, lngLat.lng);
      });

      // Click on map to move marker
      map.current.on('click', (e) => {
        marker.current!.setLngLat(e.lngLat);
        setCurrentCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        onLocationSelect(e.lngLat.lat, e.lngLat.lng);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update marker position when props change
  useEffect(() => {
    if (marker.current && (latitude !== currentCoords.lat || longitude !== currentCoords.lng)) {
      marker.current.setLngLat([longitude, latitude]);
      map.current?.flyTo({ center: [longitude, latitude], zoom: 15 });
      setCurrentCoords({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-3">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <div className="flex items-start gap-2 mb-2">
          <Crosshair className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-300">
            <p className="font-semibold mb-1">Interactive Map Picker</p>
            <p className="text-blue-400/80">Click anywhere on the map or drag the 📍 marker to select coordinates</p>
          </div>
        </div>
      </div>
      
      <div 
        ref={mapContainer} 
        style={{ height }}
        className="w-full rounded-lg border-2 border-white/10 shadow-lg overflow-hidden"
      />
      
      <div className="grid grid-cols-2 gap-3 bg-gray-900/50 border border-white/10 rounded-lg p-3">
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Latitude</label>
          <div className="text-sm font-mono text-white bg-gray-800/50 px-3 py-2 rounded border border-white/10">
            {currentCoords.lat.toFixed(7)}°N
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Longitude</label>
          <div className="text-sm font-mono text-white bg-gray-800/50 px-3 py-2 rounded border border-white/10">
            {currentCoords.lng.toFixed(7)}°E
          </div>
        </div>
      </div>
    </div>
  );
}
