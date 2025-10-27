"use client";

import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MousePointerClick, X } from 'lucide-react';

// Barangay 37 - Bitano coordinates (from Google Maps)
const BARANGAY_CENTER = {
  lng: 123.7480647,
  lat: 13.1466871
};

export default function MapboxMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapActive, setIsMapActive] = useState(false);
  
  // Fetch events and projects with locations
  const events = useQuery(api.events.getUpcomingEvents, { limit: 50 });
  const projects = useQuery(api.projects.getAllProjects);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmFyYW5nYXlsaW5rIiwiYSI6ImNreDEyM3h5ejAwMDAyb3BlemR5aHp3Z3oifQ.example';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [BARANGAY_CENTER.lng, BARANGAY_CENTER.lat],
      zoom: 16,
      pitch: 60,
      bearing: -17.6,
      antialias: true,
      scrollZoom: false,  // Disabled until activated
      dragPan: false,     // Disabled until activated
      dragRotate: false,  // Disabled until activated
      touchZoomRotate: false,  // Disabled until activated
      attributionControl: false  // Remove Mapbox attribution
    });
    
    // Add navigation controls back
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

      // Popular location markers removed per user request
      // Only show event and project markers
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Add event and project markers when data loads
  useEffect(() => {
    if (!map.current || !isMapActive) return;
    
    // Add event markers
    events?.forEach(event => {
      if (event.coordinates) {
        const el = document.createElement('div');
        el.className = 'event-marker';
        el.style.cssText = `
          background-color: #ef4444;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;
        el.innerHTML = '📅';
        
        new mapboxgl.Marker(el)
          .setLngLat([event.coordinates.longitude, event.coordinates.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 12px; min-width: 200px;">
                  <div style="font-size: 24px; margin-bottom: 8px;">📅</div>
                  <h3 style="font-weight: bold; margin-bottom: 4px; color: #ef4444; font-size: 16px;">${event.title}</h3>
                  <p style="font-size: 13px; color: #6b7280; margin: 4px 0;">${event.location}</p>
                  <p style="font-size: 12px; color: #9ca3af; margin: 0;">${new Date(event.startDate).toLocaleDateString()}</p>
                </div>
              `)
          )
          .addTo(map.current!);
      }
    });
    
    // Add project markers
    projects?.forEach(project => {
      if (project.coordinates) {
        const el = document.createElement('div');
        el.className = 'project-marker';
        el.style.cssText = `
          background-color: #3b82f6;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;
        el.innerHTML = '🏗️';
        
        new mapboxgl.Marker(el)
          .setLngLat([project.coordinates.longitude, project.coordinates.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 12px; min-width: 200px;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🏗️</div>
                  <h3 style="font-weight: bold; margin-bottom: 4px; color: #3b82f6; font-size: 16px;">${project.title}</h3>
                  <p style="font-size: 13px; color: #6b7280; margin: 0;">${project.location || 'Location not specified'}</p>
                </div>
              `)
          )
          .addTo(map.current!);
      }
    });
  }, [events, projects, isMapActive]);
  
  const handleActivateMap = () => {
    if (map.current) {
      map.current.scrollZoom.enable();
      map.current.dragPan.enable();
      map.current.dragRotate.enable();
      map.current.touchZoomRotate.enable();
      setIsMapActive(true);
    }
  };

  const handleDeactivateMap = () => {
    if (map.current) {
      map.current.scrollZoom.disable();
      map.current.dragPan.disable();
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disable();
      setIsMapActive(false);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '100%' }}
      />
      
      {/* Click to Activate Overlay */}
      {!isMapActive && (
        <div
          onClick={handleActivateMap}
          className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm cursor-pointer z-10 transition-opacity hover:bg-gray-900/50"
        >
          <div className="bg-gray-800/95 border-2 border-emerald-500 rounded-xl p-6 text-center shadow-2xl transform hover:scale-105 transition-transform">
            <MousePointerClick className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">Click to Explore Map</h3>
            <p className="text-gray-300 text-sm mb-3">View events & projects on interactive 3D map</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">
              <MousePointerClick className="w-4 h-4" />
              <span>Activate Map</span>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Map Button - Shows when map is active */}
      {isMapActive && (
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={handleDeactivateMap}
            className="bg-gray-800/95 border-2 border-gray-600 hover:border-red-500 rounded-lg px-4 py-2 text-white font-semibold shadow-lg transition-all hover:bg-red-600/20 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>Deactivate Map</span>
          </button>
        </div>
      )}
    </div>
  );
}
