"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: { address: string; lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

// Barangay 37 - Bitano coordinates (from Google Maps)
const DEFAULT_CENTER = {
  lng: 123.7480647,
  lat: 13.1466871
};

export function LocationPickerModal({ 
  isOpen, 
  onClose, 
  onSelectLocation,
  initialLocation 
}: LocationPickerModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [locationAddress, setLocationAddress] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !mapContainer.current || map.current) return;

    // Initialize map
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 15,
      pitch: 0,
      antialias: true,
      attributionControl: false  // Remove Mapbox attribution
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#10b981'
    });

    if (initialLocation) {
      marker.current.setLngLat([initialLocation.lng, initialLocation.lat]).addTo(map.current);
    }

    // Handle marker drag
    marker.current.on('dragend', async () => {
      const lngLat = marker.current!.getLngLat();
      setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
      await fetchAddress(lngLat.lat, lngLat.lng);
    });

    // Handle map click
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ lat, lng });
      
      if (marker.current) {
        marker.current.setLngLat([lng, lat]).addTo(map.current!);
      }
      
      await fetchAddress(lat, lng);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, initialLocation]);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setLocationAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setLocationAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation({
        address: locationAddress || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Select Location</h2>
                <p className="text-emerald-100 text-sm">Click on the map to pick an exact location</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div
            ref={mapContainer}
            className="w-full h-[500px]"
          />
          
          {/* Location Display */}
          {selectedLocation && (
            <div className="absolute bottom-4 left-4 right-4 bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 border border-emerald-500">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-white font-semibold mb-1">Selected Location:</p>
                  <p className="text-gray-300 text-sm">{locationAddress || 'Loading address...'}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-900 border-t border-gray-700">
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Check className="w-5 h-5 mr-2" />
              Confirm Location
            </Button>
            <Button
              onClick={onClose}
              className="px-6 bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600 font-semibold py-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
