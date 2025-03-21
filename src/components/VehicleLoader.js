// src/components/VehicleLoader.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

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
    const modelPath = `${process.env.BASE_URL}assets/models/vehicles/${modelName}.fbx`;
    
    console.log(`Loading model from: ${modelPath}`);
    
    try {
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
            this.handleLoadError(modelName, onLoad, onError, error);
          }
        },
        (xhr) => {
          if (onProgress) onProgress(xhr);
        },
        (error) => {
          console.error(`Error loading model ${modelName}:`, error);
          this.handleLoadError(modelName, onLoad, onError, error);
        }
      );
    } catch (error) {
      console.error(`Exception during model loading setup for ${modelName}:`, error);
      this.handleLoadError(modelName, onLoad, onError, error);
    }
  }
  
  /**
   * Handle loading errors by creating a fallback model
   */
  handleLoadError(modelName, onLoad, onError, error) {
    console.log(`Creating fallback model for ${modelName}`);
    // Create a fallback geometric model
    const fallbackModel = this.createFallbackModel(modelName);
    
    // Cache the fallback model
    this.cache[modelName] = fallbackModel.clone();
    
    if (onLoad) onLoad(fallbackModel);
    if (onError) onError(error);
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
    
    // Create model based on type
    if (modelName.includes('sports') || modelName.includes('roadster')) {
      // Sleek, sports car shape
      this.createSportsCar(fallbackModel, fallbackColor);
    } else if (modelName.includes('monster') || modelName.includes('truck')) {
      // Taller, truck shape
      this.createTruck(fallbackModel, fallbackColor);
    } else if (modelName.includes('police')) {
      // Police vehicle with light bar
      this.createPoliceCar(fallbackModel, fallbackColor);
    } else {
      // Default car shape
      this.createSedan(fallbackModel, fallbackColor);
    }
    
    // Prepare for animation
    this.prepareForAnimation(fallbackModel);
    
    return fallbackModel;
  }
  
  createSportsCar(model, color) {
    const bodyMat = new THREE.MeshPhongMaterial({
      color: color,
      flatShading: true
    });
    
    // Low, sleek body
    const bodyGeom = new THREE.BoxGeometry(90, 25, 45);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 12.5;
    body.castShadow = true;
    body.receiveShadow = true;
    model.add(body);
    
    // Sleek roof
    const roofGeom = new THREE.BoxGeometry(50, 20, 45);
    const roof = new THREE.Mesh(roofGeom, bodyMat);
    roof.position.set(-15, 35, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    model.add(roof);
    
    // Windshield
    const windshieldMat = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7
    });
    const windshieldGeom = new THREE.BoxGeometry(3, 18, 35);
    const windshield = new THREE.Mesh(windshieldGeom, windshieldMat);
    windshield.position.set(10, 35, 0);
    model.add(windshield);
    
    // Wheels
    this.addWheelToFallback(model, -25, 10, 25, 12);
    this.addWheelToFallback(model, -25, 10, -25, 12);
    this.addWheelToFallback(model, 25, 10, 25, 12);
    this.addWheelToFallback(model, 25, 10, -25, 12);
    
    // Spoiler
    const spoilerGeom = new THREE.BoxGeometry(15, 5, 50);
    const spoiler = new THREE.Mesh(spoilerGeom, bodyMat);
    spoiler.position.set(-40, 40, 0);
    spoiler.castShadow = true;
    spoiler.receiveShadow = true;
    model.add(spoiler);
  }
  
  createTruck(model, color) {
    const bodyMat = new THREE.MeshPhongMaterial({
      color: color,
      flatShading: true
    });
    
    // Main body
    const bodyGeom = new THREE.BoxGeometry(75, 35, 55);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 27.5;
    body.castShadow = true;
    body.receiveShadow = true;
    model.add(body);
    
    // Cabin
    const cabinGeom = new THREE.BoxGeometry(35, 25, 45);
    const cabin = new THREE.Mesh(cabinGeom, bodyMat);
    cabin.position.set(-10, 52.5, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    model.add(cabin);
    
    // Windshield
    const windshieldMat = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7
    });
    const windshieldGeom = new THREE.BoxGeometry(3, 20, 35);
    const windshield = new THREE.Mesh(windshieldGeom, windshieldMat);
    windshield.position.set(10, 52.5, 0);
    model.add(windshield);
    
    // Extra large wheels
    this.addWheelToFallback(model, -20, 15, 30, 18);
    this.addWheelToFallback(model, -20, 15, -30, 18);
    this.addWheelToFallback(model, 20, 15, 30, 18);
    this.addWheelToFallback(model, 20, 15, -30, 18);
  }
  
  createPoliceCar(model, color) {
    // Create a basic sedan
    this.createSedan(model, 0x2233aa); // Police blue
    
    // Add light bar on roof
    const lightBarGeom = new THREE.BoxGeometry(20, 5, 40);
    const lightBarMat = new THREE.MeshPhongMaterial({
      color: 0x222222
    });
    
    const lightBar = new THREE.Mesh(lightBarGeom, lightBarMat);
    lightBar.position.set(-15, 55, 0);
    model.add(lightBar);
    
    // Red and blue lights
    const redLightGeom = new THREE.BoxGeometry(5, 5, 15);
    const redLightMat = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    
    const redLight = new THREE.Mesh(redLightGeom, redLightMat);
    redLight.position.set(-15, 60, -10);
    model.add(redLight);
    
    const blueLightGeom = new THREE.BoxGeometry(5, 5, 15);
    const blueLightMat = new THREE.MeshPhongMaterial({
      color: 0x0000ff,
      emissive: 0x0000ff,
      emissiveIntensity: 0.5
    });
    
    const blueLight = new THREE.Mesh(blueLightGeom, blueLightMat);
    blueLight.position.set(-15, 60, 10);
    model.add(blueLight);
  }
  
  createSedan(model, color) {
    const bodyMat = new THREE.MeshPhongMaterial({
      color: color,
      flatShading: true
    });
    
    // Car Body
    const bodyGeom = new THREE.BoxGeometry(80, 30, 50);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 15;
    body.castShadow = true;
    body.receiveShadow = true;
    model.add(body);
    
    // Car Roof
    const roofGeom = new THREE.BoxGeometry(40, 25, 50);
    const roof = new THREE.Mesh(roofGeom, bodyMat);
    roof.position.set(-15, 42.5, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    model.add(roof);
    
    // Windshield
    const windshieldMat = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7
    });
    const windshieldGeom = new THREE.BoxGeometry(3, 20, 40);
    const windshield = new THREE.Mesh(windshieldGeom, windshieldMat);
    windshield.position.set(10, 35, 0);
    model.add(windshield);
    
    // Wheels
    this.addWheelToFallback(model, -25, 10, 25);
    this.addWheelToFallback(model, -25, 10, -25);
    this.addWheelToFallback(model, 25, 10, 25);
    this.addWheelToFallback(model, 25, 10, -25);
  }
  
  /**
   * Add wheel to fallback model
   */
  addWheelToFallback(parent, x, y, z, size = 10) {
    const wheelGeom = new THREE.CylinderGeometry(size, size, 10, 16);
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
   * Prepare the vehicle for animation by identifying wheels and adding animation capabilities
   * @param {THREE.Object3D} model - The vehicle model
   * @param {boolean} animateWheels - Whether to animate the wheels (default: true)
   */
  prepareForAnimation(model, animateWheels = true) {
    model.userData = model.userData || {};
    model.userData.wheels = [];
    
    model.traverse(child => {
      // Identify wheel meshes based on their name
      if (child.isMesh && child.name && 
          (child.name.toLowerCase().includes('wheel') || 
           child.name.toLowerCase().includes('tire'))) {
        
        child.userData = child.userData || {};
        child.userData.isWheel = animateWheels; // Only mark as wheel if animation is enabled
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Store reference to wheel meshes for animation
        if (animateWheels) {
          model.userData.wheels.push(child);
        }
      }
      
      // Make sure all meshes cast and receive shadows
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Add animation method to the model
    model.animateWheels = function(speed) {
      if (!animateWheels) return; // Skip animation if disabled
      
      // Animate wheels
      if (this.userData && this.userData.wheels) {
        this.userData.wheels.forEach(wheel => {
          wheel.rotation.x += speed;
        });
      }
    };
  }
  
  /**
   * Apply a specific color to a vehicle model
   * @param {THREE.Object3D} model - The vehicle model
   * @param {number} color - The color as a hex value
   */
  setVehicleColor(model, color) {
    const material = new THREE.MeshPhongMaterial({
      color: color,
      flatShading: false,
      shininess: 120
    });
    
    // If model is a mesh, apply directly
    if (model.isMesh) {
      const name = model.name.toLowerCase();
      
      // Don't apply car color to wheels or windows
      if (name.includes('wheel') || name.includes('tire')) {
        // Create a black material for wheels
        const blackMaterial = new THREE.MeshStandardMaterial({
          color: 0x222222,
          roughness: 0.7,
          metalness: 0.5
        });
        model.material = blackMaterial;
      } 
      else if (name.includes('window') || name.includes('glass') || name.includes('windshield')) {
        // Create a glass-like material
        const glassMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x111a2b,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.7,
          envMapIntensity: 1
        });
        model.material = glassMaterial;
      }
      else {
        // Apply car color to other parts
        model.material = material;
      }
      return;
    }
    
    // Apply to all meshes in the model
    model.traverse(child => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        // Don't apply car color to wheels or windows
        if (name.includes('wheel') || name.includes('tire')) {
          // Create a black material for wheels
          const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.7,
            metalness: 0.5
          });
          child.material = blackMaterial;
        } 
        else if (name.includes('window') || name.includes('glass') || name.includes('windshield')) {
          // Create a glass-like material
          const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x111a2b,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7,
            envMapIntensity: 1
          });
          child.material = glassMaterial;
        }
        else {
          // Apply car color to other parts
          child.material = material.clone();
        }
      }
    });
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