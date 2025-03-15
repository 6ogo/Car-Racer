// src/components/ResourceManager.js
export default class ResourceManager {
    constructor() {
      // Track all resources that need cleanup
      this.resources = {
        meshes: new Set(),
        geometries: new Set(),
        materials: new Set(),
        textures: new Set(),
        scenes: new Set(),
        renderers: new Set(),
        composers: new Set(),
        controls: new Set(),
        pools: new Set(),
        sounds: new Set(),
        animations: new Set(),
        timers: new Set(),
        eventListeners: new Set(),
        custom: new Set()
      };
      
      // Scene reference for scene-specific cleanup
      this.scene = null;
      
      // GPU memory usage tracking
      this.lastMemoryUsage = 0;
      
      // Memory leak detection
      this.memoryCheckInterval = null;
      this.memoryCheckEnabled = false;
    }
    
    // Set a scene reference
    setScene(scene) {
      this.scene = scene;
      this.resources.scenes.add(scene);
      return this;
    }
    
    // Track a mesh resource
    trackMesh(mesh) {
      this.resources.meshes.add(mesh);
      return this;
    }
    
    // Track multiple meshes
    trackMeshes(meshes) {
      meshes.forEach(mesh => this.resources.meshes.add(mesh));
      return this;
    }
    
    // Track a geometry resource
    trackGeometry(geometry) {
      this.resources.geometries.add(geometry);
      return this;
    }
    
    // Track a material resource
    trackMaterial(material) {
      this.resources.materials.add(material);
      return this;
    }
    
    // Track a texture resource
    trackTexture(texture) {
      this.resources.textures.add(texture);
      return this;
    }
    
    // Track a renderer resource
    trackRenderer(renderer) {
      this.resources.renderers.add(renderer);
      return this;
    }
    
    // Track a post-processing composer
    trackComposer(composer) {
      this.resources.composers.add(composer);
      return this;
    }
    
    // Track controls (e.g., OrbitControls)
    trackControls(controls) {
      this.resources.controls.add(controls);
      return this;
    }
    
    // Track object pools
    trackPool(pool) {
      this.resources.pools.add(pool);
      return this;
    }
    
    // Track sound resources
    trackSound(sound) {
      this.resources.sounds.add(sound);
      return this;
    }
    
    // Track animation mixers or clips
    trackAnimation(animation) {
      this.resources.animations.add(animation);
      return this;
    }
    
    // Track timers (setTimeout/setInterval IDs)
    trackTimer(timerID) {
      this.resources.timers.add(timerID);
      return this;
    }
    
    // Track event listeners for cleanup
    trackEventListener(element, event, handler, options) {
      this.resources.eventListeners.add({
        element,
        event,
        handler,
        options
      });
      return this;
    }
    
    // Track custom resource with custom disposal method
    trackCustom(resource, disposeMethod) {
      this.resources.custom.add({
        resource,
        dispose: disposeMethod
      });
      return this;
    }
    
    // Dispose of a specific mesh and its children
    disposeMesh(mesh) {
      if (!mesh) return;
      
      // Remove from scene if it has a parent
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      
      // Dispose geometry if it exists
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      
      // Dispose material if it exists
      if (mesh.material) {
        this.disposeMaterial(mesh.material);
      }
      
      // Recursively dispose children
      if (mesh.children && mesh.children.length > 0) {
        const children = [...mesh.children]; // Clone array to avoid modification issues
        for (const child of children) {
          this.disposeMesh(child);
        }
      }
      
      // Remove from tracked resources
      this.resources.meshes.delete(mesh);
    }
    
    // Dispose of a specific material
    disposeMaterial(material) {
      if (!material) return;
      
      // Handle array of materials
      if (Array.isArray(material)) {
        material.forEach(m => this.disposeMaterial(m));
        return;
      }
      
      // Dispose textures
      const textureKeys = [
        'map', 'normalMap', 'bumpMap', 'displacementMap', 'roughnessMap',
        'metalnessMap', 'alphaMap', 'aoMap', 'emissiveMap', 'envMap',
        'lightMap', 'specularMap'
      ];
      
      for (const key of textureKeys) {
        if (material[key]) {
          material[key].dispose();
          this.resources.textures.delete(material[key]);
        }
      }
      
      // Dispose material itself
      material.dispose();
      
      // Remove from tracked resources
      this.resources.materials.delete(material);
    }
    
    // Dispose of a specific geometry
    disposeGeometry(geometry) {
      if (!geometry) return;
      
      geometry.dispose();
      
      // Remove from tracked resources
      this.resources.geometries.delete(geometry);
    }
    
    // Dispose of a specific texture
    disposeTexture(texture) {
      if (!texture) return;
      
      texture.dispose();
      
      // Remove from tracked resources
      this.resources.textures.delete(texture);
    }
    
    // Dispose of a specific renderer
    disposeRenderer(renderer) {
      if (!renderer) return;
      
      renderer.dispose();
      
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      
      // Remove from tracked resources
      this.resources.renderers.delete(renderer);
    }
    
    // Dispose of a specific composer
    disposeComposer(composer) {
      if (!composer) return;
      
      if (composer.passes) {
        for (const pass of composer.passes) {
          if (pass.dispose) {
            pass.dispose();
          }
        }
      }
      
      // Remove from tracked resources
      this.resources.composers.delete(composer);
    }
    
    // Dispose of specific controls
    disposeControls(controls) {
      if (!controls) return;
      
      if (controls.dispose) {
        controls.dispose();
      }
      
      // Remove from tracked resources
      this.resources.controls.delete(controls);
    }
    
    // Dispose of a specific pool
    disposePool(pool) {
      if (!pool) return;
      
      if (pool.dispose) {
        pool.dispose();
      }
      
      // Remove from tracked resources
      this.resources.pools.delete(pool);
    }
    
    // Dispose of a specific sound
    disposeSound(sound) {
      if (!sound) return;
      
      if (sound.isPlaying) {
        sound.stop();
      }
      
      if (sound.buffer) {
        sound.buffer = null;
      }
      
      // Remove from tracked resources
      this.resources.sounds.delete(sound);
    }
    
    // Dispose of a specific animation
    disposeAnimation(animation) {
      if (!animation) return;
      
      if (animation.stopAllAction) {
        animation.stopAllAction();
      }
      
      if (animation.uncacheRoot && animation.uncacheClips) {
        // If it's a mixer
        animation.uncacheRoot(animation.getRoot());
        animation.uncacheClips();
      }
      
      // Remove from tracked resources
      this.resources.animations.delete(animation);
    }
    
    // Clear a specific timer
    clearTimer(timerID) {
      if (!timerID) return;
      
      clearTimeout(timerID);
      clearInterval(timerID);
      
      // Remove from tracked resources
      this.resources.timers.delete(timerID);
    }
    
    // Remove a specific event listener
    removeEventListener(listenerObj) {
      if (!listenerObj || !listenerObj.element || !listenerObj.event || !listenerObj.handler) return;
      
      listenerObj.element.removeEventListener(
        listenerObj.event,
        listenerObj.handler,
        listenerObj.options
      );
      
      // Remove from tracked resources
      this.resources.eventListeners.delete(listenerObj);
    }
    
    // Dispose of a specific custom resource
    disposeCustom(customObj) {
      if (!customObj || !customObj.resource || !customObj.dispose) return;
      
      customObj.dispose(customObj.resource);
      
      // Remove from tracked resources
      this.resources.custom.delete(customObj);
    }
    
    // Clear all objects from a scene except specified ones
    clearScene(excludeMeshes = []) {
      if (!this.scene) return;
      
      const excludeSet = new Set(excludeMeshes);
      
      // Clone children array to avoid modification issues
      const children = [...this.scene.children];
      
      for (const child of children) {
        // Skip excluded meshes
        if (excludeSet.has(child)) continue;
        
        // Dispose the mesh
        this.disposeMesh(child);
      }
    }
    
    // Dispose of all resources
    disposeAll() {
      // Dispose meshes
      for (const mesh of this.resources.meshes) {
        this.disposeMesh(mesh);
      }
      
      // Dispose geometries
      for (const geometry of this.resources.geometries) {
        this.disposeGeometry(geometry);
      }
      
      // Dispose materials
      for (const material of this.resources.materials) {
        this.disposeMaterial(material);
      }
      
      // Dispose textures
      for (const texture of this.resources.textures) {
        this.disposeTexture(texture);
      }
      
      // Dispose renderers
      for (const renderer of this.resources.renderers) {
        this.disposeRenderer(renderer);
      }
      
      // Dispose composers
      for (const composer of this.resources.composers) {
        this.disposeComposer(composer);
      }
      
      // Dispose controls
      for (const controls of this.resources.controls) {
        this.disposeControls(controls);
      }
      
      // Dispose pools
      for (const pool of this.resources.pools) {
        this.disposePool(pool);
      }
      
      // Dispose sounds
      for (const sound of this.resources.sounds) {
        this.disposeSound(sound);
      }
      
      // Dispose animations
      for (const animation of this.resources.animations) {
        this.disposeAnimation(animation);
      }
      
      // Clear timers
      for (const timerID of this.resources.timers) {
        this.clearTimer(timerID);
      }
      
      // Remove event listeners
      for (const listener of this.resources.eventListeners) {
        this.removeEventListener(listener);
      }
      
      // Dispose custom resources
      for (const custom of this.resources.custom) {
        this.disposeCustom(custom);
      }
      
      // Clear scenes
      for (const scene of this.resources.scenes) {
        // Only dispose our tracked scene
        if (scene === this.scene) {
          this.clearScene();
        }
      }
      
      // Clear all tracking sets
      for (const key in this.resources) {
        this.resources[key].clear();
      }
      
      // Stop memory leak detection
      this.stopMemoryLeakDetection();
      
      console.log('All resources have been disposed');
    }
    
    // Log current resource counts
    logResourceCounts() {
      const counts = {};
      
      for (const key in this.resources) {
        counts[key] = this.resources[key].size;
      }
      
      console.table(counts);
      return counts;
    }
    
    // Check for possible memory leaks by tracking resource count increases
    startMemoryLeakDetection(interval = 10000) {
      if (this.memoryCheckInterval) {
        this.stopMemoryLeakDetection();
      }
      
      this.memoryCheckEnabled = true;
      
      // Take initial snapshot
      const initialCounts = this.logResourceCounts();
      let lastCounts = { ...initialCounts };
      let checkCount = 0;
      
      this.memoryCheckInterval = setInterval(() => {
        if (!this.memoryCheckEnabled) return;
        
        const currentCounts = this.logResourceCounts();
        checkCount++;
        
        // Check for increases
        const increases = {};
        let hasIncrease = false;
        
        for (const key in currentCounts) {
          if (currentCounts[key] > lastCounts[key]) {
            increases[key] = {
              previous: lastCounts[key],
              current: currentCounts[key],
              increase: currentCounts[key] - lastCounts[key]
            };
            hasIncrease = true;
          }
        }
        
        if (hasIncrease) {
          console.warn('Potential memory leak detected. Resource count increases:');
          console.table(increases);
        }
        
        // Estimated GPU memory usage (if available in debug tools)
        if (window.performance && window.performance.memory) {
          const currentMemory = window.performance.memory.totalJSHeapSize;
          const memoryDiff = currentMemory - this.lastMemoryUsage;
          
          console.log(`Memory usage: ${(currentMemory / 1048576).toFixed(2)} MB (${memoryDiff > 0 ? '+' : ''}${(memoryDiff / 1048576).toFixed(2)} MB)`);
          
          this.lastMemoryUsage = currentMemory;
        }
        
        // Update last counts
        lastCounts = { ...currentCounts };
        
      }, interval);
      
      // Add the interval to tracked timers
      this.resources.timers.add(this.memoryCheckInterval);
      
      return this.memoryCheckInterval;
    }
    
    // Stop memory leak detection
    stopMemoryLeakDetection() {
      if (this.memoryCheckInterval) {
        clearInterval(this.memoryCheckInterval);
        this.resources.timers.delete(this.memoryCheckInterval);
        this.memoryCheckInterval = null;
      }
      
      this.memoryCheckEnabled = false;
    }
    
    // Force garbage collection (only works in some debug environments)
    forceGC() {
      if (window.gc) {
        try {
          window.gc();
          console.log('Forced garbage collection');
        } catch (e) {
          console.warn('Could not force garbage collection:', e);
        }
      } else {
        console.warn('Garbage collection not available. Run with --expose-gc flag in Node.js or use Chrome with special flags.');
      }
    }
  }