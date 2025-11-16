# 🏢 Custom 3D Models Guide

## ✅ Changes Completed

### Removed Features
1. ❌ **Elevation-Based Flood Risk** toggle - Removed
2. ❌ **Flood Risk Legend** - Removed 
3. ❌ **Barangay Info Panel** - Removed
4. ✅ **3D Landmarks Info Panel** - Added (shows SM City, Yashano Mall, Mayon)

---

## 🏗️ Adding Custom 3D Models

### Yes, It's Possible!

You can add custom 3D models for specific buildings using Mapbox's **Custom Layer API** with **three.js**. Here's how:

---

## 📦 Required Dependencies

First, install three.js:

```bash
npm install three @types/three
```

---

## 🎯 Implementation Plan

### 1. SM City Legazpi 
**Location**: Approximately 13.14459°N, 123.74510°E
**Type**: Large shopping mall (4-5 stories)
**Model**: Custom 3D box with blue tint

### 2. Yashano Mall
**Location**: Approximately 13.14507°N, 123.74656°E  
**Type**: Shopping mall (3-4 stories)
**Model**: Custom 3D box with purple tint

### 3. Mayon Volcano
**Location**: Approximately 13.2572°N, 123.6856°E (summit)
**Type**: Iconic perfect cone volcano (2,463m elevation)
**Model**: Custom cone geometry with texture

---

## 💻 Code Implementation

### Step 1: Add three.js Import

Add to the top of `MapboxMap.tsx`:

```typescript
import * as THREE from 'three';
```

### Step 2: Create Custom 3D Layer

Add this function before the `useEffect`:

```typescript
// Custom 3D Models Layer using three.js
const create3DModelsLayer = (): mapboxgl.CustomLayerInterface => {
  let camera: THREE.Camera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;
  let smCityMesh: THREE.Mesh, yashanoMesh: THREE.Mesh, mayonMesh: THREE.Mesh;
  
  // Mapbox coordinates to world coordinates
  const modelOrigin = [BARANGAY_CENTER.lng, BARANGAY_CENTER.lat];
  const modelAltitude = 0;
  const modelRotate = [Math.PI / 2, 0, 0];
  
  const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    modelOrigin as [number, number],
    modelAltitude
  );
  
  const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z || 0,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
  };
  
  return {
    id: '3d-models',
    type: 'custom',
    renderingMode: '3d',
    
    onAdd: function(map, gl) {
      camera = new THREE.Camera();
      scene = new THREE.Scene();
      
      // Directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
      directionalLight.position.set(0, 70, 100).normalize();
      scene.add(directionalLight);
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);
      
      // SM City Legazpi (Blue Mall)
      const smCityCoords = mapboxgl.MercatorCoordinate.fromLngLat([123.74510, 13.14459], 0);
      const smCityGeometry = new THREE.BoxGeometry(150, 150, 80); // 150m x 150m, 80m tall
      const smCityMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x3b82f6, // Blue
        opacity: 0.9,
        transparent: true
      });
      smCityMesh = new THREE.Mesh(smCityGeometry, smCityMaterial);
      smCityMesh.position.x = (smCityCoords.x - modelTransform.translateX) / modelTransform.scale;
      smCityMesh.position.y = (smCityCoords.y - modelTransform.translateY) / modelTransform.scale;
      smCityMesh.position.z = 40; // Half the height
      scene.add(smCityMesh);
      
      // Yashano Mall (Purple Mall)
      const yashanoCoords = mapboxgl.MercatorCoordinate.fromLngLat([123.74656, 13.14507], 0);
      const yashanoGeometry = new THREE.BoxGeometry(100, 80, 50); // 100m x 80m, 50m tall
      const yashanoMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xa855f7, // Purple
        opacity: 0.9,
        transparent: true
      });
      yashanoMesh = new THREE.Mesh(yashanoGeometry, yashanoMaterial);
      yashanoMesh.position.x = (yashanoCoords.x - modelTransform.translateX) / modelTransform.scale;
      yashanoMesh.position.y = (yashanoCoords.y - modelTransform.translateY) / modelTransform.scale;
      yashanoMesh.position.z = 25; // Half the height
      scene.add(yashanoMesh);
      
      // Mayon Volcano (Red Cone) - Visible from far away
      const mayonCoords = mapboxgl.MercatorCoordinate.fromLngLat([123.6856, 13.2572], 0);
      const mayonGeometry = new THREE.ConeGeometry(1500, 2463, 32); // Base 3km diameter, 2463m tall
      const mayonMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xef4444, // Red/volcanic
        opacity: 0.85,
        transparent: true
      });
      mayonMesh = new THREE.Mesh(mayonGeometry, mayonMaterial);
      mayonMesh.position.x = (mayonCoords.x - modelTransform.translateX) / modelTransform.scale;
      mayonMesh.position.y = (mayonCoords.y - modelTransform.translateY) / modelTransform.scale;
      mayonMesh.position.z = 1231.5; // Half the height (summit at 2463m)
      scene.add(mayonMesh);
      
      // Use Mapbox GL JS's WebGL context
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      
      renderer.autoClear = false;
    },
    
    render: function(gl, matrix) {
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );
      
      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);
      
      camera.projectionMatrix = m.multiply(l);
      renderer.resetState();
      renderer.render(scene, camera);
    }
  };
};
```

### Step 3: Add the Layer on Map Load

Inside the `map.current.on('load', ...)` callback, after adding 3D buildings:

```typescript
// Add custom 3D models layer
if (map.current && !map.current.getLayer('3d-models')) {
  map.current.addLayer(create3DModelsLayer() as any);
}
```

---

## 🎨 Customization Options

### Change Colors
```typescript
// In the material definition
color: 0x3b82f6  // Blue (hex color)
color: 0xa855f7  // Purple
color: 0xef4444  // Red
```

### Change Size
```typescript
// BoxGeometry(width, depth, height)
new THREE.BoxGeometry(150, 150, 80)  // SM City: 150m x 150m, 80m tall

// ConeGeometry(radius, height, segments)
new THREE.ConeGeometry(1500, 2463, 32)  // Mayon: 3km base, 2463m tall
```

### Add Textures
```typescript
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/path/to/texture.png');
const material = new THREE.MeshLambertMaterial({ map: texture });
```

---

## 📍 Exact Coordinates

### SM City Legazpi
- **Latitude**: 13.14459°N
- **Longitude**: 123.74510°E
- **Height**: ~80 meters (4-5 floors)
- **Color**: Blue (#3b82f6)

### Yashano Mall
- **Latitude**: 13.14507°N  
- **Longitude**: 123.74656°E
- **Height**: ~50 meters (3-4 floors)
- **Color**: Purple (#a855f7)

### Mayon Volcano
- **Latitude**: 13.2572°N (summit)
- **Longitude**: 123.6856°E
- **Height**: 2,463 meters above sea level
- **Color**: Red/volcanic (#ef4444)
- **Shape**: Perfect cone

---

## 🎯 Benefits of Custom 3D Models

1. **Landmarks Stand Out** - Easier to navigate and orient
2. **Brand Recognition** - SM City and Yashano are recognizable
3. **Tourist Attraction** - Mayon Volcano is a major landmark
4. **Better Context** - Users understand the geography better
5. **Professional Look** - Shows attention to detail

---

## 🚀 Alternative: Using GLB/GLTF Models

For more realistic models, you can use actual 3D model files:

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
loader.load('/models/sm-city.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(x, y, z);
  scene.add(model);
});
```

**Where to get models**:
- Sketchfab (free 3D models)
- Google 3D Warehouse
- Blender (create your own)

---

## 📊 Performance Considerations

### Optimization Tips:
1. **Low-poly models** - Use simple geometries (boxes, cones)
2. **LOD (Level of Detail)** - Show simpler models when zoomed out
3. **Culling** - Don't render models outside viewport
4. **Limit draw calls** - Combine similar meshes

### Recommended Settings:
- **SM City / Yashano**: Show at zoom ≥ 14
- **Mayon**: Show at zoom ≥ 12 (visible from far away)
- **3D Buildings**: Show at zoom ≥ 15

---

## 🎓 Learning Resources

- [Mapbox Custom Layers](https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/)
- [three.js Documentation](https://threejs.org/docs/)
- [Mapbox + three.js Tutorial](https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model-threejs/)

---

## ✅ Summary

**Removed**:
- ❌ Elevation-Based Flood Risk toggle
- ❌ Flood Risk Legend  
- ❌ Barangay Info Panel

**Added**:
- ✅ 3D Landmarks Info Panel (placeholder for models)

**Next Steps**:
1. Install three.js: `npm install three @types/three`
2. Add the `create3DModelsLayer()` function
3. Call `addLayer()` on map load
4. Test and adjust positions/sizes
5. Optionally add textures or GLB models

**Result**: Professional 3D landmarks that make your map unique and help users navigate! 🎯
