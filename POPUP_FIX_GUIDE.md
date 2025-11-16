# Map Popup & Marker Fixes - Complete Guide

## 🎯 Issues to Fix

1. **❌ Popup has no close button** - Can't dismiss popups
2. **❌ Popups overflow outside map** - Going past screen edge
3. **❌ Projects/events not showing on map** - Only in list, no markers visible
4. **❌ Flood zones don't work** - Need better elevation + risk display
5. **❌ Items without location** - Need default placement

---

## ✅ Solution Summary

### 1. Add Close Buttons to All Popups
```typescript
// Every popup needs these options:
new mapboxgl.Popup({
  closeButton: true,       // ✅ Shows X button
  closeOnClick: true,      // ✅ Close when clicking map
  maxWidth: '320px',       // ✅ Constrain width
  className: 'custom-popup' // ✅ Custom styling
})
```

### 2. Make Popups Scrollable & Constrained
```css
/* Add to global styles */
.custom-popup .mapboxgl-popup-content {
  max-height: 400px;         /* Don't go taller than 400px */
  max-width: 320px;          /* Don't go wider than 320px */
  overflow-y: auto;          /* Scroll if content too long */
  overflow-x: hidden;        /* No horizontal scroll */
}

.custom-popup .mapboxgl-popup-content::-webkit-scrollbar {
  width: 5px;                /* Thin scrollbar */
}
```

### 3. Ensure Project/Event Markers Are Visible

**Problem**: Markers might not be showing because:
- GIS layers not initialized
- Clustering hiding individual markers
- Data not being passed to map

**Solution**:
```typescript
// Make sure these layers exist:
map.addLayer({
  id: 'unclustered-projects',
  type: 'circle',
  source: 'projects-gis',
  filter: ['!', ['has', 'point_count']], // Only non-clustered
  paint: {
    'circle-color': '#3b82f6',  // Blue for projects
    'circle-radius': 10,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#fff'
  }
});

map.addLayer({
  id: 'unclustered-events',
  type: 'circle',
  source: 'events-gis',
  filter: ['!', ['has', 'point_count']], // Only non-clustered
  paint: {
    'circle-color': '#ef4444',  // Red for events
    'circle-radius': 10,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#fff'
  }
});
```

### 4. Handle Items Without Location
```typescript
// For projects/events without coordinates, use barangay center
const getCoordinates = (item: any) => {
  if (item.coordinates) {
    return {
      lat: item.coordinates.latitude,
      lng: item.coordinates.longitude
    };
  }
  // Default to barangay center
  return {
    lat: BARANGAY_CENTER.lat,
    lng: BARANGAY_CENTER.lng
  };
};

// When adding markers:
const coords = getCoordinates(project);
features.push({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [coords.lng, coords.lat]
  },
  properties: {
    ...project,
    hasLocation: !!project.coordinates
  }
});
```

### 5. Fix Flood Risk Display

**Current Issue**: Flood zones are rectangles but don't show elevation properly

**Better Solution**: Combine elevation indication with flood risk
```typescript
// Enhanced flood risk with elevation
const getFloodRiskWithElevation = (lat: number, lng: number) => {
  const elevation = getElevationForPointSync(lat, lng);
  const risk = getFloodRiskLevel(elevation);
  
  return {
    elevation: `${elevation}m ASL`,
    riskLevel: risk.label,
    riskColor: risk.color,
    riskIcon: risk.icon,
    description: `Elevation: ${elevation}m | ${risk.label}`,
    warning: elevation < 5 ? `⚠️ Low elevation area - flood prone` : null
  };
};

// In popup:
const floodInfo = getFloodRiskWithElevation(lat, lng);
popup.setHTML(`
  <div>
    <p>⛰️ <strong>Elevation:</strong> ${floodInfo.elevation}</p>
    <p style="color: ${floodInfo.riskColor}">
      ${floodInfo.riskIcon} <strong>Flood Risk:</strong> ${floodInfo.riskLevel}
    </p>
    ${floodInfo.warning ? `<div class="warning">${floodInfo.warning}</div>` : ''}
  </div>
`);
```

---

## 📝 Step-by-Step Implementation

### Step 1: Add Custom Popup Styles

Add this to your `MapboxMap.tsx` component (inside the return, before the map div):

```typescript
<style jsx global>{`
  /* Popup container - constrain to map area */
  .custom-popup .mapboxgl-popup-content {
    max-height: 400px;
    max-width: 320px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    padding: 12px;
  }
  
  /* Custom scrollbar for popup content */
  .custom-popup .mapboxgl-popup-content::-webkit-scrollbar {
    width: 5px;
  }
  .custom-popup .mapboxgl-popup-content::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.3);
    border-radius: 3px;
  }
  .custom-popup .mapboxgl-popup-content::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.5);
    border-radius: 3px;
  }
  
  /* Close button styling */
  .custom-popup .mapboxgl-popup-close-button {
    font-size: 20px;
    padding: 4px 8px;
    color: #6b7280;
    right: 4px;
    top: 4px;
  }
  .custom-popup .mapboxgl-popup-close-button:hover {
    background-color: #f3f4f6;
    color: #1f2937;
    border-radius: 4px;
  }
  
  /* Popup tip (arrow) */
  .custom-popup .mapboxgl-popup-tip {
    border-top-color: white;
  }
  
  /* Warning box inside popup */
  .popup-warning {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 4px;
    padding: 6px;
    margin-top: 6px;
    font-size: 10px;
    color: #92400e;
  }
`}</style>
```

### Step 2: Update All Popup Creation Code

Find every instance of `new mapboxgl.Popup()` and update it:

**Before**:
```typescript
new mapboxgl.Popup()
  .setLngLat([lng, lat])
  .setHTML(content)
  .addTo(map.current);
```

**After**:
```typescript
new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  maxWidth: '320px',
  className: 'custom-popup'
})
  .setLngLat([lng, lat])
  .setHTML(content)
  .addTo(map.current);
```

### Step 3: Make Popup Content Scrollable

Update your popup HTML to include max-height and overflow:

```typescript
const popupHTML = `
  <div style="max-height: 380px; overflow-y: auto; padding: 8px;">
    <h3 style="font-size: 16px; margin-bottom: 6px;">${title}</h3>
    <div style="font-size: 12px;">
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Elevation:</strong> ${elevation}m ASL</p>
      <p style="color: ${riskColor}"><strong>Flood Risk:</strong> ${riskLevel}</p>
      ${warning ? `<div class="popup-warning">${warning}</div>` : ''}
    </div>
  </div>
`;
```

### Step 4: Ensure Markers Are Visible

In your `initializeGISLayers()` function, after adding the source, add the marker layers:

```typescript
// Add project markers
map.current.addLayer({
  id: 'project-markers',
  type: 'circle',
  source: 'projects-gis',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#3b82f6',      // Blue
    'circle-radius': 10,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff'
  }
});

// Add event markers
map.current.addLayer({
  id: 'event-markers',
  type: 'circle',
  source: 'events-gis',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#ef4444',      // Red
    'circle-radius': 10,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff'
  }
});

// Add click handlers
map.current.on('click', 'project-markers', (e) => {
  const props = e.features[0].properties;
  const coords = e.lngLat;
  
  // Show popup with close button
  new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: '320px',
    className: 'custom-popup'
  })
    .setLngLat(coords)
    .setHTML(createPopupHTML(props, 'project'))
    .addTo(map.current);
});
```

### Step 5: Handle Items Without Coordinates

```typescript
// Helper function
const ensureCoordinates = (item: any) => {
  if (item.coordinates && item.coordinates.latitude && item.coordinates.longitude) {
    return {
      lat: item.coordinates.latitude,
      lng: item.coordinates.longitude,
      hasRealLocation: true
    };
  }
  
  // Default to barangay center
  return {
    lat: BARANGAY_CENTER.lat,
    lng: BARANGAY_CENTER.lng,
    hasRealLocation: false
  };
};

// When creating GeoJSON features:
const projectFeatures = projects?.map((project) => {
  const coords = ensureCoordinates(project);
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [coords.lng, coords.lat]
    },
    properties: {
      ...project,
      hasRealLocation: coords.hasRealLocation
    }
  };
}) || [];

// In popup, show if location is estimated:
const locationText = props.hasRealLocation 
  ? props.location 
  : `${props.location || 'Location TBD'} (approx. - using barangay center)`;
```

### Step 6: Enhance Flood Risk Display

```typescript
// Enhanced flood risk function
const getDetailedFloodRisk = (lat: number, lng: number) => {
  const elevation = getElevationForPointSync(lat, lng);
  const distanceFromCoast = calculateDistance(
    { lat, lng },
    { lat: 13.1396, lng: 123.7342 }
  );
  
  let riskLevel, riskColor, riskIcon, description;
  
  if (elevation < 1) {
    riskLevel = 'Critical';
    riskColor = '#dc2626';
    riskIcon = '🌊';
    description = 'Immediate flood risk from storm surge';
  } else if (elevation < 2.5) {
    riskLevel = 'High';
    riskColor = '#ea580c';
    riskIcon = '💧';
    description = 'Frequent flooding during heavy rain';
  } else if (elevation < 5) {
    riskLevel = 'Moderate';
    riskColor = '#f59e0b';
    riskIcon = '🟡';
    description = 'Occasional flooding in extreme weather';
  } else if (elevation < 8) {
    riskLevel = 'Low';
    riskColor = '#eab308';
    riskIcon = '🟢';
    description = 'Rarely affected by flooding';
  } else {
    riskLevel = 'Safe';
    riskColor = '#22c55e';
    riskIcon = '✅';
    description = 'Generally safe from flooding';
  }
  
  return {
    elevation: `${elevation}m`,
    elevationFull: `${elevation}m ASL`,
    distanceFromCoast: `${Math.round(distanceFromCoast)}m`,
    riskLevel,
    riskColor,
    riskIcon,
    description,
    showWarning: elevation < 5
  };
};

// In popup HTML:
const floodInfo = getDetailedFloodRisk(lat, lng);
const popupHTML = `
  <div>
    <p><span style="font-size: 14px;">⛰️</span> <strong>Elevation:</strong> ${floodInfo.elevationFull}</p>
    <p><span style="font-size: 14px;">🌊</span> <strong>From coast:</strong> ${floodInfo.distanceFromCoast}</p>
    <p style="color: ${floodInfo.riskColor}">
      <span style="font-size: 14px;">${floodInfo.riskIcon}</span>
      <strong>Flood Risk:</strong> ${floodInfo.riskLevel}
    </p>
    <p style="font-size: 10px; color: #6b7280;">${floodInfo.description}</p>
    ${floodInfo.showWarning ? `
      <div class="popup-warning">
        ⚠️ <strong>Warning:</strong> This area is flood-prone. Take precautions during heavy rain and storm surge.
      </div>
    ` : ''}
  </div>
`;
```

---

## 🧪 Testing Checklist

After implementing fixes, test these scenarios:

### Popup Functionality
- [ ] Click a project marker → popup appears with close button (X)
- [ ] Click the X → popup closes
- [ ] Click elsewhere on map → popup closes
- [ ] Popup with long content → scrollable, doesn't overflow screen
- [ ] Popup near edge → stays within map area

### Markers Visibility
- [ ] Blue circles visible for projects with locations
- [ ] Red circles visible for events with locations
- [ ] Items without locations show at barangay center
- [ ] Clustering works at zoom 14 and below
- [ ] Individual markers visible at zoom 15+

### Flood Risk Display
- [ ] Every popup shows elevation in meters
- [ ] Flood risk color-coded (red/orange/yellow/green)
- [ ] Risk level label matches elevation
- [ ] Warning appears for locations <5m elevation
- [ ] Distance from coast calculated correctly

---

## 🚀 Quick Fix Checklist

If you only want the essential fixes right now:

### 1. ✅ Add Close Buttons (2 minutes)
Find all `new mapboxgl.Popup()` and add:
```typescript
{
  closeButton: true,
  closeOnClick: true,
  maxWidth: '320px',
  className: 'custom-popup'
}
```

### 2. ✅ Constrain Popup Size (1 minute)
Add to popup HTML wrapper:
```html
<div style="max-height: 380px; overflow-y: auto; padding: 8px;">
  <!-- content -->
</div>
```

### 3. ✅ Show Markers (3 minutes)
Add marker layers after sources:
```typescript
map.addLayer({
  id: 'project-markers',
  type: 'circle',
  source: 'projects-gis',
  paint: {
    'circle-color': '#3b82f6',
    'circle-radius': 10
  }
});
```

### 4. ✅ Better Flood Display (2 minutes)
Show both elevation AND risk:
```html
<p>⛰️ Elevation: ${elevation}m ASL</p>
<p style="color: ${color}">${icon} Flood Risk: ${level}</p>
```

---

## 📸 Expected Results

### Before (Issues):
- ❌ No way to close popups
- ❌ Popups overflow screen
- ❌ No markers visible on map
- ❌ Only list shows projects/events
- ❌ Flood zones don't make sense

### After (Fixed):
- ✅ X button closes popups
- ✅ Popups scroll if content too long
- ✅ Blue/red markers visible on map
- ✅ Click markers → show info
- ✅ Clear elevation + flood risk for every location
- ✅ Items without coords use barangay center

---

**Status**: 📝 Guide Complete  
**Implementation Time**: ~15 minutes  
**Complexity**: Low-Medium  
**Impact**: High - Major UX improvements

**Priority Order**:
1. Add close buttons (most urgent)
2. Constrain popup size (prevents overflow)
3. Show markers (visibility issue)
4. Better flood display (clarity)
