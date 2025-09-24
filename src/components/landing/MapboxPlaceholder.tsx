"use client";

import { MapPin, Navigation, Building, Home, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function MapboxPlaceholder() {
  const importantLocations = [
    {
      name: "Barangay Hall",
      type: "Government",
      icon: <Building className="w-4 h-4" />,
      address: "Main Street, Barangay Bitano",
      color: "from-blue-500 to-blue-600"
    },
    {
      name: "Community Center",
      type: "Community",
      icon: <Home className="w-4 h-4" />,
      address: "Community Avenue, Barangay Bitano",
      color: "from-green-500 to-green-600"
    },
    {
      name: "Health Center",
      type: "Healthcare",
      icon: <Phone className="w-4 h-4" />,
      address: "Health Street, Barangay Bitano",
      color: "from-red-500 to-red-600"
    },
    {
      name: "Public Market",
      type: "Commercial",
      icon: <Building className="w-4 h-4" />,
      address: "Market Road, Barangay Bitano",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Map Placeholder */}
      <div className="relative w-full h-96 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl overflow-hidden shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-emerald-300 dark:border-gray-500"></div>
            ))}
          </div>
        </div>
        
        {/* Map Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Interactive Community Map
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
              Explore Barangay Bitano and discover important locations, facilities, and landmarks in our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                <MapPin className="w-4 h-4 mr-2" />
                View Full Map
              </Button>
            </div>
          </div>
          
          {/* Floating Location Markers */}
          <div className="absolute top-4 left-4">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          <div className="absolute top-1/3 right-1/4">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          <div className="absolute bottom-1/3 left-1/3">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          <div className="absolute bottom-4 right-4">
            <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
        </div>
        
        {/* Map Controls Placeholder */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="w-10 h-10 bg-white/90 rounded-lg shadow-lg flex items-center justify-center">
            <span className="text-gray-600 font-bold">+</span>
          </div>
          <div className="w-10 h-10 bg-white/90 rounded-lg shadow-lg flex items-center justify-center">
            <span className="text-gray-600 font-bold">-</span>
          </div>
        </div>
      </div>

      {/* Important Locations */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Important Locations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {importantLocations.map((location, index) => (
            <Card key={location.name} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 bg-gradient-to-br ${location.color} rounded-xl flex items-center justify-center mx-auto mb-4 text-white`}>
                  {location.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{location.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{location.type}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{location.address}</p>
                <Button 
                  size="sm" 
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Directions
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Map Integration Notice */}
      <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon: Interactive Mapbox Integration
          </h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            We're working on integrating a fully interactive map powered by Mapbox to help you navigate 
            Barangay Bitano with ease. Features will include real-time directions, location search, 
            and detailed information about community facilities.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              Real-time Navigation
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              Location Search
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              Facility Information
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              Offline Maps
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
