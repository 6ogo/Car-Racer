// src/components/AssetLoader.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Singleton pattern
let instance = null;

export default class AssetLoader {
  constructor() {
    // Enforce singleton pattern
    if (instance) {
      return instance;
    }
    
    instance = this;
    
    // Initialize loaders
    this.textureLoader = new THREE.TextureLoader();
    this.fbxLoader = new FBXLoader();
    this.gltfLoader = new GLTFLoader();
    
    // Progress tracking
    this.loadingManager = new THREE.LoadingManager();
    this.setupLoadingManager();
    
    // Set loaders to use our loading manager
    this.textureLoader.manager = this.loadingManager;
    this.fbxLoader.manager = this.loadingManager;
    this.gltfLoader.manager = this.loadingManager;
    
    // Asset cache
    this.textures = new Map();
    this.models = new Map();
    this.materials = new Map();
    this.sounds = new Map();
    
    // Queue of assets to load
    this.queue = [];
    this.isLoading = false;
    this.loadPromise = null;
    
    // Global loading state
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.progress = 0;
  }
  
  setupLoadingManager() {
    // Set up loading manager callbacks
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading: ${url}`);
      this.isLoading = true;
      this.totalAssets = itemsTotal;
    };
    
    this.loadingManager.onLoad = () => {
      console.log('Loading complete!');
      this.isLoading = false;
      
      // If we have a progress DOM element, update it
      const progressBar = document.getElementById('loading-bar');
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      
      const loadingText = document.getElementById('loading-text');
      if (loadingText) {
        loadingText.textContent = 'Loading complete!';
      }
      
      // Hide loading screen after a short delay
      setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
          }, 500);
        }
      }, 500);
    };
    
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.loadedAssets = itemsLoaded;
      this.totalAssets = itemsTotal;
      this.progress = itemsLoaded / itemsTotal;
      
      // Update progress in the DOM if elements exist
      const progressBar = document.getElementById('loading-bar');
      if (progressBar) {
        progressBar.style.width = `${this.progress * 100}%`;
      }
      
      const loadingText = document.getElementById('loading-text');
      if (loadingText) {
        loadingText.textContent = `Loading... ${Math.floor(this.progress * 100)}%`;
      }
      
      console.log(`Loading progress: ${Math.floor(this.progress * 100)}% (${itemsLoaded}/${itemsTotal})`);
    };
    
    this.loadingManager.onError = (url) => {
      console.error(`Error loading: ${url}`);
      
      // Show error in the DOM if elements exist
      const loadingText = document.getElementById('loading-text');
      if (loadingText) {
        loadingText.textContent = `Error loading assets`;
        loadingText.style.color = 'red';
      }
    };
  }
  
  // Add an asset to the load queue
  queueAsset(type, url, options = {}) {
    this.queue.push({ type, url, options });
    return this;
  }
  
  // Queue multiple assets
  queueAssets(assets) {
    for (const asset of assets) {
      this.queueAsset(asset.type, asset.url, asset.options);
    }
    return this;
  }
  
  // Load all queued assets
  loadAll() {
    if (this.isLoading) {
      console.warn('Already loading assets. Wait for completion or call cancelLoading() first.');
      return this.loadPromise;
    }
    
    if (this.queue.length === 0) {
      console.warn('No assets in the queue to load.');
      return Promise.resolve([]);
    }
    
    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      const results = [];
      
      // Process queue sequentially (helps avoid memory spikes)
      const processQueue = (index = 0) => {
        if (index >= this.queue.length) {
          // Queue is empty, resolve promise
          this.queue = [];
          this.isLoading = false;
          resolve(results);
          return;
        }
        
        const asset = this.queue[index];
        
        // Load the asset
        this.loadAsset(asset.type, asset.url, asset.options)
          .then(result => {
            results.push(result);
            processQueue(index + 1);
          })
          .catch(error => {
            console.error(`Failed to load asset: ${asset.url}`, error);
            // Continue loading other assets even if one fails
            processQueue(index + 1);
          });
      };
      
      // Start processing the queue
      processQueue();
    });
    
    return this.loadPromise;
  }
  
  // Cancel current loading process
  cancelLoading() {
    if (!this.isLoading) {
      return;
    }
    
    this.loadingManager.onStart = null;
    this.loadingManager.onLoad = null;
    this.loadingManager.onProgress = null;
    this.loadingManager.onError = null;
    
    // Create new loaders with new manager
    this.loadingManager = new THREE.LoadingManager();
    this.setupLoadingManager();
    
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.fbxLoader = new FBXLoader(this.loadingManager);
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    
    this.isLoading = false;
    this.queue = [];
    this.loadPromise = null;
  }
  
  // Load a single asset
  loadAsset(type, url, options = {}) {
    switch (type) {
      case 'texture':
        return this.loadTexture(url, options);
      case 'model-fbx':
        return this.loadModelFBX(url, options);
      case 'model-gltf':
        return this.loadModelGLTF(url, options);
      case 'material':
        return this.loadMaterial(url, options);
      case 'sound':
        return this.loadSound(url, options);
      default:
        return Promise.reject(new Error(`Unknown asset type: ${type}`));
    }
  }
  
  // Load a texture
  loadTexture(url, options = {}) {
    // Check if already loaded
    if (this.textures.has(url)) {
      return Promise.resolve(this.textures.get(url));
    }
    
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Apply options
          if (options.repeat) {
            texture.repeat.set(options.repeat.x || 1, options.repeat.y || 1);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
          }
          if (options.flipY !== undefined) {
            texture.flipY = options.flipY;
          }
          
          // Cache the texture
          this.textures.set(url, texture);
          resolve(texture);
        },
        (progress) => {
          // Progress callback
        },
        (error) => {
          console.error(`Error loading texture: ${url}`, error);
          reject(error);
        }
      );
    });
  }
  
  // Load an FBX model
  loadModelFBX(url, options = {}) {
    // Check if already loaded
    if (this.models.has(url)) {
      // Clone the model to avoid modifying the cached version
      const clone = this.models.get(url).clone();
      return Promise.resolve(this.prepareModel(clone, options));
    }
    
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (model) => {
          // Cache the original model
          this.models.set(url, model.clone());
          
          // Prepare and return the model
          resolve(this.prepareModel(model, options));
        },
        (progress) => {
          // Progress callback
        },
        (error) => {
          console.error(`Error loading FBX model: ${url}`, error);
          reject(error);
        }
      );
    });
  }
  
  // Load a GLTF model
  loadModelGLTF(url, options = {}) {
    // Check if already loaded
    if (this.models.has(url)) {
      // Clone the model to avoid modifying the cached version
      const clone = this.models.get(url).scene.clone();
      return Promise.resolve(this.prepareModel(clone, options));
    }
    
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          // Cache the original model
          this.models.set(url, { scene: gltf.scene.clone(), animations: gltf.animations });
          
          // Prepare and return the model
          resolve(this.prepareModel(gltf.scene, options, gltf.animations));
        },
        (progress) => {
          // Progress callback
        },
        (error) => {
          console.error(`Error loading GLTF model: ${url}`, error);
          reject(error);
        }
      );
    });
  }
  
  // Helper to prepare loaded models
  prepareModel(model, options, animations = []) {
    // Apply scale
    if (options.scale) {
      if (typeof options.scale === 'number') {
        model.scale.set(options.scale, options.scale, options.scale);
      } else {
        model.scale.set(
          options.scale.x || 1,
          options.scale.y || 1,
          options.scale.z || 1
        );
      }
    }
    
    // Apply position
    if (options.position) {
      model.position.set(
        options.position.x || 0,
        options.position.y || 0,
        options.position.z || 0
      );
    }
    
    // Apply rotation
    if (options.rotation) {
      model.rotation.set(
        options.rotation.x || 0,
        options.rotation.y || 0,
        options.rotation.z || 0
      );
    }
    
    // Set up shadows
    if (options.castShadow || options.receiveShadow) {
      model.traverse(child => {
        if (child.isMesh) {
          if (options.castShadow) {
            child.castShadow = true;
          }
          if (options.receiveShadow) {
            child.receiveShadow = true;
          }
        }
      });
    }
    
    // Apply custom materials
    if (options.materials) {
      model.traverse(child => {
        if (child.isMesh && options.materials[child.name]) {
          child.material = options.materials[child.name];
        }
      });
    }
    
    // Process animations
    if (animations && animations.length > 0) {
      model.animations = animations;
    }
    
    return model;
  }
  
  // Load a material or create one from textures
  loadMaterial(name, options = {}) {
    // Check if already loaded
    if (this.materials.has(name)) {
      return Promise.resolve(this.materials.get(name));
    }
    
    // If no textures are provided, create a basic material
    if (!options.textures) {
      const material = new THREE.MeshStandardMaterial(options);
      this.materials.set(name, material);
      return Promise.resolve(material);
    }
    
    // Load all required textures first
    const texturePromises = [];
    const textureData = {};
    
    for (const [mapType, textureUrl] of Object.entries(options.textures)) {
      const promise = this.loadTexture(textureUrl)
        .then(texture => {
          textureData[mapType] = texture;
        });
      
      texturePromises.push(promise);
    }
    
    // Create material after all textures are loaded
    return Promise.all(texturePromises)
      .then(() => {
        // Create material with options
        const materialOptions = { ...options };
        delete materialOptions.textures;
        
        // Set textures
        for (const [mapType, texture] of Object.entries(textureData)) {
          switch (mapType) {
            case 'map':
              materialOptions.map = texture;
              break;
            case 'normalMap':
              materialOptions.normalMap = texture;
              break;
            case 'roughnessMap':
              materialOptions.roughnessMap = texture;
              break;
            case 'metalnessMap':
              materialOptions.metalnessMap = texture;
              break;
            case 'aoMap':
              materialOptions.aoMap = texture;
              break;
            case 'emissiveMap':
              materialOptions.emissiveMap = texture;
              break;
            case 'displacementMap':
              materialOptions.displacementMap = texture;
              break;
            // Additional map types can be added as needed
          }
        }
        
        const material = new THREE.MeshStandardMaterial(materialOptions);
        this.materials.set(name, material);
        return material;
      });
  }
  
  // Load a sound
  loadSound(url, options = {}) {
    // Check if already loaded
    if (this.sounds.has(url)) {
      return Promise.resolve(this.sounds.get(url));
    }
    
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = url;
      
      // Apply options
      if (options.loop !== undefined) {
        audio.loop = options.loop;
      }
      if (options.volume !== undefined) {
        audio.volume = options.volume;
      }
      
      // Handle load events
      audio.addEventListener('canplaythrough', () => {
        this.sounds.set(url, audio);
        resolve(audio);
      });
      
      audio.addEventListener('error', (error) => {
        console.error(`Error loading sound: ${url}`, error);
        reject(error);
      });
      
      // Start loading
      audio.load();
    });
  }
  
  // Get an asset from cache
  getTexture(url) {
    return this.textures.get(url);
  }
  
  getModel(url) {
    return this.models.get(url);
  }
  
  getMaterial(name) {
    return this.materials.get(name);
  }
  
  getSound(url) {
    return this.sounds.get(url);
  }
  
  // Clear specific caches
  clearTextureCache() {
    this.textures.forEach(texture => texture.dispose());
    this.textures.clear();
  }
  
  clearModelCache() {
    this.models.clear();
  }
  
  clearMaterialCache() {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
  }
  
  clearSoundCache() {
    this.sounds.clear();
  }
  
  // Clear all caches
  clearCache() {
    this.clearTextureCache();
    this.clearModelCache();
    this.clearMaterialCache();
    this.clearSoundCache();
  }
  
  // Dispose of all resources
  dispose() {
    this.cancelLoading();
    this.clearCache();
    instance = null;
  }
  
  // Static method to get the instance
  static getInstance() {
    if (!instance) {
      instance = new AssetLoader();
    }
    return instance;
  }
}