// src/components/VehicleLoader.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export default class VehicleLoader {
  constructor() {
    this.loader = new FBXLoader();
    this.cache = {}; // Cache for loaded models
    this.defaultScale = 0.025; // Default scale for the vehicles
    this.fallbackColors = {
      sports_car: 0xf25346,
      sedan: 0x68c3c0,
      monster_truck: 0x669900,
      pickup: 0xff6633,
      muscle: 0xcc3300,
      roadster: 0xffcc00,
      suv: 0x336699,
      hatchback: 0x99cc33,
      limousine: 0x000000,
      van: 0x6633cc
    };
  }

  /**
   * Load a vehicle model
   * @param {string} modelName - Name of the model file without extension
   * @param {function} onLoad - Callback when model is loaded
   * @param {function} onProgress - Callback for loading progress
   * @param {function} onError - Callback for loading errors
   */
  loadVehicle(modelName, onLoad, onProgress, onError) {
    // Check if model is already cached
    if (this.cache[modelName]) {
      console.log(`Using cached model for ${modelName}`);
      const clonedModel = this.cache[modelName].clone();
      
      // Re-prepare the model (ensures animation methods are properly transferred)
      this.prepareForAnimation(clonedModel);
      
      if (onLoad) setTimeout(() => onLoad(clonedModel), 0);
      return clonedModel;
    }

    // Load the model
    const modelPath = `/assets/models/vehicles/${modelName}.fbx`;
    
    console.log(`Loading model from: ${modelPath}`);
    
    this.loader.load(
      modelPath,
      (fbx) => {
        try {
          console.log(`Successfully loaded model: ${modelName}`);
          
          // Scale down the model
          fbx.scale.set(this.defaultScale, this.defaultScale, this.defaultScale);
          
          // Center the model
          const box = new THREE.Box3().setFromObject(fbx);
          const center = box.getCenter(new THREE.Vector3());
          fbx.position.sub(center);
          
          // Adjust to ground level
          const size = box.getSize(new THREE.Vector3());
          fbx.position.y = size.y / 2;
          
          // Apply materials (can be customized later)
          this.applyDefaultMaterials(fbx, modelName);
          
          // Make a clean clone for caching
          this.cache[modelName] = fbx.clone();
          
          if (onLoad) onLoad(fbx);
        } catch (error) {
          console.error(`Error processing model ${modelName}:`, error);
          if (onError) onError(error);
        }
      },
      (xhr) => {
        if (onProgress) onProgress(xhr);
      },
      (error) => {
        console.error(`Error loading model ${modelName}:`, error);
        
        // Create a fallback geometric model
        const fallbackModel = this.createFallbackModel(modelName);
        
        // Cache the fallback model
        this.cache[modelName] = fallbackModel.clone();
        
        if (onLoad) onLoad(fallbackModel);
        if (onError) onError(error);
      }
    );
  }
  
  /**
   * Create a simple geometric fallback model if FBX loading fails
   * @param {string} modelName - Name of the model
   */
  createFallbackModel(modelName) {
    console.log(`Creating fallback model for ${modelName}`);
    
    // Create a group for the fallback model
    const fallbackModel = new THREE.Group();
    
    // Determine fallback color based on model name
    const fallbackColor = this.fallbackColors[modelName] || 0xcccccc;
    
    // Create a simple car shape
    const bodyGeom = new THREE.BoxGeometry(80, 30, 50);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: fallbackColor,
      flatShading: true
    });
    
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    fallbackModel.add(body);
    
    // Add a roof
    const roofGeom = new THREE.BoxGeometry(40, 25, 50);
    const roof = new THREE.Mesh(roofGeom, bodyMat);
    roof.position.set(-15, 25, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    fallbackModel.add(roof);
    
    // Add wheels
    this.addWheelToFallback(fallbackModel, -25, -15, 25);
    this.addWheelToFallback(fallbackModel, -25, -15, -25);
    this.addWheelToFallback(fallbackModel, 25, -15, 25);
    this.addWheelToFallback(fallbackModel, 25, -15, -25);
    
    // Prepare for animation
    this.prepareForAnimation(fallbackModel);
    
    return fallbackModel;
  }
  
  /**
   * Add wheel to fallback model
   */
  addWheelToFallback(parent, x, y, z) {
    const wheelGeom = new THREE.CylinderGeometry(10, 10, 10, 16);
    wheelGeom.rotateZ(Math.PI / 2);
    
    const wheelMat = new THREE.MeshPhongMaterial({
      color: 0x333333,
      flatShading: true
    });
    
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    
    // Tag as wheel for animation
    wheel.userData.isWheel = true;
    wheel.name = `wheel_${x < 0 ? 'rear' : 'front'}_${z < 0 ? 'right' : 'left'}`;
    
    parent.add(wheel);
    return wheel;
  }
  
  /**
   * Apply default materials to the model
   * @param {THREE.Object3D} model - The loaded model
   * @param {string} modelName - Name of the model for specific adjustments
   */
  applyDefaultMaterials(model, modelName) {
    // Get fallback color for this model type
    const baseColor = this.fallbackColors[modelName] || 0x333333;
    
    model.traverse((child) => {
      if (child.isMesh) {
        // Store original material for reference
        child.userData.originalMaterial = child.material;
        
        // Check material name to apply correct color
        const matName = child.material && child.material.name ? 
                        child.material.name.toLowerCase() : '';
        
        if (matName.includes('body') || child.name.toLowerCase().includes('body')) {
          // Body material
          child.material = new THREE.MeshPhongMaterial({
            color: baseColor,
            shininess: 30,
            specular: 0x333333
          });
        } else if (matName.includes('window') || matName.includes('glass') || 
                  child.name.toLowerCase().includes('window') || 
                  child.name.toLowerCase().includes('glass')) {
          // Window/glass material
          child.material = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.7,
            shininess: 90,
            specular: 0xffffff
          });
        } else if (matName.includes('wheel') || matName.includes('tire') ||
                  child.name.toLowerCase().includes('wheel') || 
                  child.name.toLowerCase().includes('tire')) {
          // Wheel/tire material
          child.material = new THREE.MeshPhongMaterial({
            color: 0x111111, 
            shininess: 10
          });
          
          // Tag as wheel for animation
          child.userData.isWheel = true;
        } else if (matName.includes('headlight') || 
                  child.name.toLowerCase().includes('headlight') || 
                  child.name.toLowerCase().includes('light')) {
          // Headlight material
          child.material = new THREE.MeshPhongMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
          });
        } else {
          // Default material
          child.material = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            shininess: 30
          });
        }
        
        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }
  
  /**
   * Apply a specific color to a vehicle model
   * @param {THREE.Object3D} model - The vehicle model
   * @param {number} color - The color as a hex value
   */
  setVehicleColor(model, color) {
    model.traverse((child) => {
      if (child.isMesh) {
        const matName = child.material ? child.material.name.toLowerCase() : '';
        
        // Apply color to body parts
        if (matName.includes('body') || 
            child.name.toLowerCase().includes('body') || 
            (!matName.includes('wheel') && 
             !matName.includes('glass') && 
             !matName.includes('window') && 
             !matName.includes('tire') &&
             !matName.includes('light'))) {
          child.material.color.setHex(color);
        }
      }
    });
    
    return model;
  }
  
  /**
   * Get an animated wheels version of the vehicle
   * @param {THREE.Object3D} model - The vehicle model
   */
  prepareForAnimation(model) {
    // Find and store references to wheels for animation
    const wheels = [];
    
    model.traverse((child) => {
      if (child.isMesh) {
        // Identify wheels by name or user data
        if (child.userData.isWheel || 
            child.name.toLowerCase().includes('wheel') || 
            child.name.toLowerCase().includes('tire')) {
          wheels.push(child);
        }
      }
    });
    
    // Add animation method to the model
    model.animateWheels = (speed) => {
      wheels.forEach(wheel => {
        // Analyze wheel position/name to determine rotation direction
        const name = wheel.name.toLowerCase();
        let rotationDirection = 1;
        
        // Wheels on left side rotate in opposite direction
        if (name.includes('left') || 
            (wheel.position.z > 0 && wheel.parent === model)) {
          rotationDirection = -1;
        }
        
        // Apply rotation
        wheel.rotation.z += speed * 0.1 * rotationDirection;
      });
    };
    
    return model;
  }
  
  /**
   * Preload all vehicle models to cache
   * @param {Array} modelNames - Array of model names to preload
   * @param {Function} onComplete - Callback when all models are loaded
   */
  preloadVehicles(modelNames, onComplete) {
    console.log('Preloading vehicles:', modelNames);
    
    let loadedCount = 0;
    const totalCount = modelNames.length;
    
    const checkComplete = () => {
      loadedCount++;
      console.log(`Loaded ${loadedCount} of ${totalCount} vehicles`);
      
      if (loadedCount >= totalCount && onComplete) {
        onComplete();
      }
    };
    
    // Load each model
    modelNames.forEach(modelName => {
      this.loadVehicle(
        modelName,
        () => checkComplete(),
        undefined,
        () => checkComplete() // Count even if there's an error (will use fallback)
      );
    });
  }
}