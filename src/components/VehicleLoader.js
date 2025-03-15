// src/components/VehicleLoader.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export default class VehicleLoader {
  constructor() {
    this.loader = new FBXLoader();
    this.cache = {}; // Cache for loaded models
    this.defaultScale = 0.025; // Default scale for the vehicles
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
      const clonedModel = this.cache[modelName].clone();
      if (onLoad) onLoad(clonedModel);
      return clonedModel;
    }

    // Load the model
    const modelPath = `/assets/models/vehicles/${modelName}.fbx`;
    
    this.loader.load(
      modelPath,
      (fbx) => {
        // Scale down the model
        fbx.scale.set(this.defaultScale, this.defaultScale, this.defaultScale);
        
        // Center the model
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        fbx.position.sub(center);
        
        // Adjust to ground level
        const size = box.getSize(new THREE.Vector3());
        fbx.position.y = size.y / 2;
        
        // Cache the model
        this.cache[modelName] = fbx.clone();
        
        // Apply materials (can be customized later)
        this.applyDefaultMaterials(fbx);
        
        if (onLoad) onLoad(fbx);
      },
      onProgress,
      onError
    );
  }
  
  /**
   * Apply default materials to the model
   * @param {THREE.Object3D} model - The loaded model
   */
  applyDefaultMaterials(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        // Check material name to apply correct color
        const matName = child.material ? child.material.name.toLowerCase() : '';
        
        if (matName.includes('body')) {
          // Body material
          child.material = new THREE.MeshPhongMaterial({
            color: 0x333333, // Default dark gray
            shininess: 30,
            specular: 0x333333
          });
        } else if (matName.includes('window') || matName.includes('glass')) {
          // Window/glass material
          child.material = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.7,
            shininess: 90,
            specular: 0xffffff
          });
        } else if (matName.includes('wheel') || matName.includes('tire')) {
          // Wheel/tire material
          child.material = new THREE.MeshPhongMaterial({
            color: 0x111111, 
            shininess: 10
          });
        } else if (matName.includes('headlight')) {
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
        
        if (matName.includes('body')) {
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
        const name = child.name.toLowerCase();
        if (name.includes('wheel') || name.includes('tire')) {
          wheels.push(child);
        }
      }
    });
    
    // Add animation method to the model
    model.animateWheels = (speed) => {
      wheels.forEach(wheel => {
        // Rotate wheels based on their orientation
        const isLeftWheel = wheel.name.toLowerCase().includes('left');
        const rotationDirection = isLeftWheel ? -1 : 1;
        wheel.rotation.z += speed * 0.1 * rotationDirection;
      });
    };
    
    return model;
  }
}