"use client";

import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { calculateDistance } from '@/lib/gis/gisUtils';
import { Layers, MapPin, Info, MousePointerClick, AlertTriangle, ArrowRight, X, Mountain, ExternalLink } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import type { Coordinate } from '@/lib/gis/gisUtils';

const BARANGAY_CENTER = {
  lng: 123.7480647,
  lat: 13.1466871
};

const BARANGAY_HALL = {
  name: 'Barangay 37-Bitano Hall',
  lng: 123.7494046,
  lat: 13.1469299,
  icon: '🏛️',
  color: '#10b981'
};

const BICOL_BOUNDS: [[number, number], [number, number]] = [
  [122.5, 12.0],
  [124.5, 14.5]
];

const FLOOD_ZONES = [
  { maxElevation: 1, color: '#dc2626', label: 'Critical Flood Zone' },
  { maxElevation: 2.5, color: '#ea580c', label: 'High Flood Hazard' },
  { maxElevation: 5, color: '#f59e0b', label: 'Moderate Flood Risk' },
  { maxElevation: 8, color: '#eab308', label: 'Low Flood Risk' },
  { maxElevation: Infinity, color: '#22c55e', label: 'Safe Zone' },
];

function MapboxMap() {
  const { user } = useUser();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapActive, setIsMapActive] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showProjectsEvents, setShowProjectsEvents] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  
  const allEvents = useQuery(api.events.getUpcomingEvents, { limit: 50 });
  const allProjects = useQuery(api.projects.getAllProjects);
  
  const events = user 
    ? allEvents
    : allEvents?.filter(event => event.isPublic === true);
    
  const projects = user
    ? allProjects
    : allProjects?.filter(project => project.isPublic === true);
  
  const landmarks = useQuery(api.landmarks.getAllLandmarks);

  const getElevationForPointSync = (lat: number, lng: number): number => {
    const coastalPoint: Coordinate = { lat: 13.1396, lng: 123.7342 };
    const distanceFromCoast = calculateDistance({ lat, lng }, coastalPoint);
    
    if (distanceFromCoast < 300) return 1;
    if (distanceFromCoast < 800) return 3;
    if (distanceFromCoast < 1500) return 5;
    if (distanceFromCoast < 2500) return 8;
    if (distanceFromCoast < 4000) return 12;
    return 25;
  };

  const getFloodRiskLevel = (elevation: number) => {
    for (const zone of FLOOD_ZONES) {
      if (elevation <= zone.maxElevation) {
        const icon = elevation <= 1 ? '🌊' : elevation <= 2.5 ? '💧' : elevation <= 5 ? '🟡' : elevation <= 8 ? '🟢' : '✅';
        return { label: zone.label, color: zone.color, icon, warning: elevation < 5 };
      }
    }
    return { label: 'Safe Zone', color: '#22c55e', icon: '✅', warning: false };
  };

  // Fly to location function
  const flyToLocation = (lng: number, lat: number) => {
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 18,
        pitch: 60,
        duration: 2000,
        essential: true
      });
    }
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!mapboxgl.supported()) {
      setMapError('WebGL is not supported in your browser.');
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token.includes('example') || token.length < 50) {
      setMapError('Mapbox token not configured.');
      return;
    }

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Colored satellite view with buildings
        center: [BARANGAY_CENTER.lng, BARANGAY_CENTER.lat],
        zoom: 17,
        minZoom: 13,
        maxZoom: 20,
        pitch: 45,
        scrollZoom: false,
        dragPan: false,
        dragRotate: false,
        touchZoomRotate: false,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    } catch (error) {
      console.error('Map error:', error);
      setMapError('Failed to initialize map.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if (!map.current || !isMapActive) return;
    
    events?.forEach(event => {
      const coords = {
        lng: event.coordinates?.longitude || BARANGAY_HALL.lng,
        lat: event.coordinates?.latitude || BARANGAY_HALL.lat
      };
      
      const el = document.createElement('div');
      el.style.cssText = `background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);`;
      el.innerHTML = '📅';
      
      const elevation = getElevationForPointSync(coords.lat, coords.lng);
      const floodRisk = getFloodRiskLevel(elevation);
      
      new mapboxgl.Marker(el)
        .setLngLat([coords.lng, coords.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: '320px' })
            .setHTML(`
              <div style="padding: 12px;">
                <div style="font-size: 24px; margin-bottom: 8px;">📅</div>
                <h3 style="font-weight: bold; color: #ef4444; font-size: 16px; margin-bottom: 4px;">${event.title}</h3>
                ${event.isPublic ? '<span style="background: #22c55e; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px;">👁️ PUBLIC</span>' : '<span style="background: #6b7280; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px;">🔒 PRIVATE</span>'}
                <p style="font-size: 13px; color: #6b7280; margin: 4px 0;">📍 ${event.location || 'Barangay Hall'}</p>
                <p style="font-size: 12px; color: #374151;">⛰️ ~${elevation}m ASL</p>
                <p style="font-size: 12px; color: ${floodRisk.color};">${floodRisk.icon} ${floodRisk.label}</p>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 6px;">📅 ${new Date(event.startDate).toLocaleDateString()}</p>
              </div>
            `)
        )
        .addTo(map.current!);
    });
    
    projects?.forEach(project => {
      const coords = {
        lng: project.coordinates?.longitude || BARANGAY_HALL.lng,
        lat: project.coordinates?.latitude || BARANGAY_HALL.lat
      };
      
      const el = document.createElement('div');
      el.style.cssText = `background-color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);`;
      el.innerHTML = '🏗️';
      
      const elevation = getElevationForPointSync(coords.lat, coords.lng);
      const floodRisk = getFloodRiskLevel(elevation);
      
      new mapboxgl.Marker(el)
        .setLngLat([coords.lng, coords.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: '320px' })
            .setHTML(`
              <div style="padding: 12px;">
                <div style="font-size: 24px; margin-bottom: 8px;">🏗️</div>
                <h3 style="font-weight: bold; color: #3b82f6; font-size: 16px; margin-bottom: 4px;">${project.title}</h3>
                ${project.isPublic ? '<span style="background: #22c55e; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px;">👁️ PUBLIC</span>' : '<span style="background: #6b7280; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px;">🔒 PRIVATE</span>'}
                <p style="font-size: 13px; color: #6b7280; margin: 4px 0;">📍 ${project.location || 'Barangay Hall'}</p>
                <p style="font-size: 12px; color: #374151;">⛰️ ~${elevation}m ASL</p>
                <p style="font-size: 12px; color: ${floodRisk.color};">${floodRisk.icon} ${floodRisk.label}</p>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 6px;">📊 Status: ${project.status || 'Active'}</p>
              </div>
            `)
        )
        .addTo(map.current!);
    });

    const hallEl = document.createElement('div');
    hallEl.style.cssText = `background-color: ${BARANGAY_HALL.color}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer;`;
    hallEl.innerHTML = BARANGAY_HALL.icon;
    
    new mapboxgl.Marker(hallEl)
      .setLngLat([BARANGAY_HALL.lng, BARANGAY_HALL.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25, maxWidth: '320px' })
          .setHTML(`
            <div style="padding: 12px;">
              <div style="font-size: 28px; margin-bottom: 8px;">${BARANGAY_HALL.icon}</div>
              <h3 style="font-weight: bold; color: ${BARANGAY_HALL.color}; font-size: 16px; margin-bottom: 6px;">${BARANGAY_HALL.name}</h3>
              <p style="font-size: 12px; color: #6b7280; margin: 4px 0;">📍 ${BARANGAY_HALL.lat.toFixed(6)}°N, ${BARANGAY_HALL.lng.toFixed(6)}°E</p>
              <p style="font-size: 11px; color: #374151; margin: 6px 0;">Central administrative office of Barangay 37-Bitano</p>
              <a href="https://www.google.com/maps/@${BARANGAY_HALL.lat},${BARANGAY_HALL.lng},19z" target="_blank" rel="noopener noreferrer" style="display: block; margin-top: 10px; padding: 8px 12px; background: linear-gradient(135deg, ${BARANGAY_HALL.color} 0%, #059669 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                🗺️ Open in Google Maps →
              </a>
            </div>
          `)
      )
      .addTo(map.current!);

    landmarks?.forEach((landmark: any) => {
      const el = document.createElement('div');
      el.style.cssText = `background-color: ${landmark.color}; width: 34px; height: 34px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 17px; cursor: pointer;`;
      el.innerHTML = landmark.icon;
      
      new mapboxgl.Marker(el)
        .setLngLat([landmark.longitude, landmark.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: '320px' })
            .setHTML(`
              <div style="padding: 12px;">
                <div style="font-size: 28px; margin-bottom: 8px;">${landmark.icon}</div>
                <h3 style="font-weight: bold; color: ${landmark.color}; font-size: 16px; margin-bottom: 6px;">${landmark.name}</h3>
                <p style="font-size: 12px; color: #6b7280; margin: 4px 0;">📍 ${landmark.latitude.toFixed(6)}°N, ${landmark.longitude.toFixed(6)}°E</p>
                <div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; border-left: 3px solid ${landmark.color};">
                  <p style="font-size: 11px; color: #374151; margin: 0;">Latitude: ${landmark.latitude.toFixed(7)}</p>
                  <p style="font-size: 11px; color: #374151; margin: 2px 0 0 0;">Longitude: ${landmark.longitude.toFixed(7)}</p>
                </div>
                ${landmark.googleMapsUrl ? `
                  <a href="${landmark.googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; margin-top: 10px; padding: 8px 12px; background: linear-gradient(135deg, ${landmark.color} 0%, ${landmark.color}dd 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px ${landmark.color}50;">
                    🗺️ Navigate in Google Maps →
                  </a>
                ` : `
                  <a href="https://www.google.com/maps/@${landmark.latitude},${landmark.longitude},19z" target="_blank" rel="noopener noreferrer" style="display: block; margin-top: 10px; padding: 8px 12px; background: linear-gradient(135deg, ${landmark.color} 0%, ${landmark.color}dd 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px ${landmark.color}50;">
                    🗺️ Navigate in Google Maps →
                  </a>
                `}
              </div>
            `)
        )
        .addTo(map.current!);
    });
  }, [events, projects, isMapActive, landmarks]);
  
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '100%' }} />
      
      {!isMapActive && (
        <div onClick={() => { if (map.current) { map.current.scrollZoom.enable(); map.current.dragPan.enable(); map.current.dragRotate.enable(); map.current.touchZoomRotate.enable(); setIsMapActive(true); }}} className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm cursor-pointer z-10">
          <div className="bg-gray-800/95 border-2 border-emerald-500 rounded-xl p-6 text-center">
            <MousePointerClick className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">Click to Explore Map</h3>
            <p className="text-gray-300 text-sm mb-3">View {user ? 'all' : 'public'} events & projects</p>
            {!user && <p className="text-xs text-yellow-400 mb-3">🔐 Login to see private items</p>}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold"><MousePointerClick className="w-4 h-4" /><span>Activate Map</span></div>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-50">
          <div className="bg-red-900/90 border-2 border-red-500 rounded-xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Map Error</h3>
            <p className="text-white mb-4">{mapError}</p>
            <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">Refresh Page</button>
          </div>
        </div>
      )}

      {isMapActive && (
        <div className="absolute top-4 left-4 z-20 space-y-3">
          <button onClick={() => { if (map.current) { map.current.scrollZoom.disable(); map.current.dragPan.disable(); map.current.dragRotate.disable(); map.current.touchZoomRotate.disable(); setIsMapActive(false); }}} className="bg-gray-800/95 border-2 border-gray-600 rounded-lg px-4 py-2 text-white font-semibold flex items-center gap-2"><X className="w-4 h-4" /><span className="text-sm">Deactivate Map</span></button>
          
          <div className="bg-gray-800/95 border-2 border-emerald-600 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-emerald-400" /><span className="text-white font-semibold text-sm">Status</span></div>
            <div className="space-y-1.5 text-xs text-gray-300">
              {user ? (
                <><p className="text-green-400">✅ Logged In - Viewing All</p><p>👁️ Public: {allProjects?.filter(p => p.isPublic)?.length || 0} projects, {allEvents?.filter(e => e.isPublic)?.length || 0} events</p><p>🔒 Private: {allProjects?.filter(p => !p.isPublic)?.length || 0} projects, {allEvents?.filter(e => !e.isPublic)?.length || 0} events</p></>
              ) : (
                <><p className="text-yellow-400">🔓 Public View Only</p><p>Showing: {projects?.length || 0} projects, {events?.length || 0} events</p><p className="text-gray-500 mt-2">Login to see private items</p></>
              )}
            </div>
            {user && (user.publicMetadata?.role === 'admin') && <a href="/admin/settings?tab=landmarks" className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 block underline">Manage Landmarks →</a>}
          </div>

          {/* Projects & Events List - Minimal Mobile-Friendly */}
          {showProjectsEvents && (
            <div className="bg-gray-900/90 backdrop-blur-md border border-purple-500/30 rounded-lg p-2.5 max-h-80 overflow-y-auto shadow-xl w-64 md:w-72">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-white font-medium text-xs">Projects & Events</span>
                </div>
                <button onClick={() => setShowProjectsEvents(false)} className="text-gray-400 hover:text-white p-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              {/* Projects */}
              {projects && projects.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-purple-300 font-semibold mb-1 uppercase tracking-wide">Projects · {projects.length}</p>
                  <div className="space-y-1">
                    {projects.map((project: any) => {
                      const coords = project.coordinates || { latitude: BARANGAY_HALL.lat, longitude: BARANGAY_HALL.lng };
                      const elevation = getElevationForPointSync(coords.latitude, coords.longitude);
                      const floodRisk = getFloodRiskLevel(elevation);
                      return (
                        <button
                          key={project._id}
                          onClick={() => flyToLocation(coords.longitude, coords.latitude)}
                          className="w-full text-left px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded hover:bg-blue-500/20 hover:border-blue-500/40 transition-all active:scale-95"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-base flex-shrink-0">🏗️</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-[11px] font-medium truncate leading-tight">{project.title}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px]" style={{ color: floodRisk.color }}>{floodRisk.icon}</span>
                                <span className="text-[9px] text-gray-400">~{elevation}m</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Events */}
              {events && events.length > 0 && (
                <div>
                  <p className="text-[10px] text-red-300 font-semibold mb-1 uppercase tracking-wide">Events · {events.length}</p>
                  <div className="space-y-1">
                    {events.map((event: any) => {
                      const coords = event.coordinates || { latitude: BARANGAY_HALL.lat, longitude: BARANGAY_HALL.lng };
                      const elevation = getElevationForPointSync(coords.latitude, coords.longitude);
                      const floodRisk = getFloodRiskLevel(elevation);
                      return (
                        <button
                          key={event._id}
                          onClick={() => flyToLocation(coords.longitude, coords.latitude)}
                          className="w-full text-left px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 hover:border-red-500/40 transition-all active:scale-95"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-base flex-shrink-0">📅</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-[11px] font-medium truncate leading-tight">{event.title}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px]" style={{ color: floodRisk.color }}>{floodRisk.icon}</span>
                                <span className="text-[9px] text-gray-400">~{elevation}m</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Landmarks List - Minimal Mobile-Friendly */}
          {showLandmarks && landmarks && landmarks.length > 0 && (
            <div className="bg-gray-900/90 backdrop-blur-md border border-emerald-500/30 rounded-lg p-2.5 shadow-xl w-64 md:w-72">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white font-medium text-xs">Landmarks</span>
                </div>
                <button onClick={() => setShowLandmarks(false)} className="text-gray-400 hover:text-white p-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => flyToLocation(BARANGAY_HALL.lng, BARANGAY_HALL.lat)}
                  className="w-full text-left px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base flex-shrink-0">{BARANGAY_HALL.icon}</span>
                    <span className="text-white text-[11px] font-medium leading-tight">Barangay Hall</span>
                  </div>
                </button>
                {landmarks.map((landmark: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => flyToLocation(landmark.longitude, landmark.latitude)}
                    className="w-full text-left px-2 py-1.5 rounded hover:opacity-80 transition-all active:scale-95"
                    style={{ 
                      backgroundColor: `${landmark.color}15`, 
                      borderColor: `${landmark.color}40`, 
                      border: '1px solid' 
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base flex-shrink-0">{landmark.icon}</span>
                      <span className="text-white text-[11px] font-medium leading-tight">{landmark.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MapboxMap;
