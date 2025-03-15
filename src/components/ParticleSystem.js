// src/components/ParticleSystem.js
import * as THREE from 'three';

// Particle Emitter class
class ParticleEmitter {
  constructor(options = {}) {
    // Default options
    this.options = {
      position: new THREE.Vector3(0, 0, 0),
      positionSpread: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 1, 0),
      velocitySpread: new THREE.Vector3(0.2, 0.5, 0.2),
      acceleration: new THREE.Vector3(0, -0.1, 0),
      accelerationSpread: new THREE.Vector3(0, 0, 0),
      particleCount: 100,
      particlesPerSecond: 10,
      maxParticleLife: 2, // seconds
      particleSize: 1,
      particleSizeRange: 0.5,
      particleColor: new THREE.Color(0xffffff),
      particleColorEnd: new THREE.Color(0xffffff),
      blending: THREE.AdditiveBlending,
      texture: null,
      active: true,
      duration: 0, // 0 = infinite
      ...options
    };
    
    this.clock = new THREE.Clock();
    this.age = 0;
    this.alive = true;
    this.particles = [];
    this.emissionRate = this.options.particlesPerSecond;
    this.emissionCounter = 0;
    
    // Create geometry and material
    this.createParticleSystem();
  }
  
  createParticleSystem() {
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    
    // Create arrays for positions, colors, sizes
    const positions = new Float32Array(this.options.particleCount * 3);
    const colors = new Float32Array(this.options.particleCount * 3);
    const sizes = new Float32Array(this.options.particleCount);
    const opacities = new Float32Array(this.options.particleCount);
    const lifeTimes = new Float32Array(this.options.particleCount);
    
    // Initialize all particles to dead
    for (let i = 0; i < this.options.particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      colors[i * 3] = this.options.particleColor.r;
      colors[i * 3 + 1] = this.options.particleColor.g;
      colors[i * 3 + 2] = this.options.particleColor.b;
      
      sizes[i] = 0;
      opacities[i] = 0;
      lifeTimes[i] = 0;
      
      // Initialize particle data
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        acceleration: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 0,
        opacity: 0,
        age: 0,
        lifeTime: 0,
        alive: false,
        index: i
      });
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store for updates
    this.positionAttribute = geometry.attributes.position;
    this.colorAttribute = geometry.attributes.color;
    this.sizeAttribute = geometry.attributes.size;
    this.opacityAttribute = new THREE.BufferAttribute(opacities, 1);
    this.lifeTimeAttribute = new THREE.BufferAttribute(lifeTimes, 1);
    
    // Create shader material
    let material;
    
    if (this.options.texture) {
      material = new THREE.PointsMaterial({
        size: 1,
        map: this.options.texture,
        blending: this.options.blending,
        transparent: true,
        vertexColors: true
      });
    } else {
      material = new THREE.PointsMaterial({
        size: 1,
        blending: this.options.blending,
        transparent: true,
        vertexColors: true
      });
    }
    
    // Create the particle system
    this.particleSystem = new THREE.Points(geometry, material);
    
    // Store opacities for opacity-based visibility
    this.particleSystem.userData.opacities = opacities;
  }
  
  // Add to scene
  addToScene(scene) {
    scene.add(this.particleSystem);
  }
  
  // Remove from scene
  removeFromScene(scene) {
    scene.remove(this.particleSystem);
  }
  
  // Update the particle system
  update() {
    if (!this.alive) return false;
    
    const deltaTime = this.clock.getDelta();
    this.age += deltaTime;
    
    // Check if emitter has exceeded its duration
    if (this.options.duration > 0 && this.age >= this.options.duration) {
      this.alive = false;
      return false;
    }
    
    // Emit new particles
    if (this.options.active) {
      this.emissionCounter += deltaTime * this.emissionRate;
      
      while (this.emissionCounter >= 1) {
        this.emitParticle();
        this.emissionCounter -= 1;
      }
    }
    
    // Update existing particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (particle.alive) {
        particle.age += deltaTime;
        
        // Kill if too old
        if (particle.age >= particle.lifeTime) {
          this.killParticle(particle);
          continue;
        }
        
        // Calculate life progress (0 to 1)
        const lifeProgress = particle.age / particle.lifeTime;
        
        // Update position
        particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime));
        particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
        
        // Update size
        particle.size = this.interpolate(
          this.options.particleSize - this.options.particleSizeRange,
          this.options.particleSize + this.options.particleSizeRange,
          this.getLifecurve(lifeProgress)
        );
        
        // Update color
        particle.color.copy(this.options.particleColor).lerp(
          this.options.particleColorEnd,
          lifeProgress
        );
        
        // Update opacity (fade in/out)
        particle.opacity = this.getFadeOpacity(lifeProgress);
        
        // Update the buffers
        this.updateParticleBuffers(particle);
      }
    }
    
    // Mark attributes as needing update
    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
    
    return true;
  }
  
  // Emit a single particle
  emitParticle() {
    // Find a dead particle to reuse
    const particle = this.getDeadParticle();
    if (!particle) return; // No particles available
    
    // Calculate random position within range
    particle.position.copy(this.options.position).add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 2 * this.options.positionSpread.x,
        (Math.random() - 0.5) * 2 * this.options.positionSpread.y,
        (Math.random() - 0.5) * 2 * this.options.positionSpread.z
      )
    );
    
    // Calculate random velocity within range
    particle.velocity.copy(this.options.velocity).add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 2 * this.options.velocitySpread.x,
        (Math.random() - 0.5) * 2 * this.options.velocitySpread.y,
        (Math.random() - 0.5) * 2 * this.options.velocitySpread.z
      )
    );
    
    // Calculate random acceleration within range
    particle.acceleration.copy(this.options.acceleration).add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 2 * this.options.accelerationSpread.x,
        (Math.random() - 0.5) * 2 * this.options.accelerationSpread.y,
        (Math.random() - 0.5) * 2 * this.options.accelerationSpread.z
      )
    );
    
    // Set initial size
    particle.size = this.options.particleSize + 
      (Math.random() - 0.5) * this.options.particleSizeRange;
    
    // Set initial color
    particle.color.copy(this.options.particleColor);
    
    // Set opacity to 0 (will fade in)
    particle.opacity = 0;
    
    // Reset age
    particle.age = 0;
    
    // Set random lifetime within range
    particle.lifeTime = this.options.maxParticleLife * (0.5 + Math.random() * 0.5);
    
    // Mark as alive
    particle.alive = true;
    
    // Update the buffers
    this.updateParticleBuffers(particle);
  }
  
  // Find a dead particle to reuse
  getDeadParticle() {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].alive) {
        return this.particles[i];
      }
    }
    return null; // All particles are in use
  }
  
  // Update buffers for a particle
  updateParticleBuffers(particle) {
    const i = particle.index;
    
    // Update position
    this.positionAttribute.array[i * 3] = particle.position.x;
    this.positionAttribute.array[i * 3 + 1] = particle.position.y;
    this.positionAttribute.array[i * 3 + 2] = particle.position.z;
    
    // Update color
    this.colorAttribute.array[i * 3] = particle.color.r;
    this.colorAttribute.array[i * 3 + 1] = particle.color.g;
    this.colorAttribute.array[i * 3 + 2] = particle.color.b;
    
    // Update size
    this.sizeAttribute.array[i] = particle.size * particle.opacity;
    
    // Update opacity
    this.opacityAttribute.array[i] = particle.opacity;
    
    // Update lifetime
    this.lifeTimeAttribute.array[i] = particle.lifeTime;
  }
  
  // Kill a particle
  killParticle(particle) {
    particle.alive = false;
    particle.opacity = 0;
    
    // Update size to 0 to hide it
    this.sizeAttribute.array[particle.index] = 0;
  }
  
  // Get opacity based on life progress (fade in/out)
  getFadeOpacity(t) {
    // Fade in for first 10% of life
    if (t < 0.1) return t / 0.1;
    
    // Fade out for last 30% of life
    if (t > 0.7) return 1.0 - ((t - 0.7) / 0.3);
    
    // Full opacity in between
    return 1.0;
  }
  
  // Get size curve based on life progress
  getLifecurve(t) {
    // Particle grows quickly then slowly shrinks
    return 1.0 - Math.pow(t - 0.5, 2) * 2;
  }
  
  // Linear interpolation helper
  interpolate(min, max, factor) {
    return min + (max - min) * factor;
  }
  
  // Dispose of resources
  dispose() {
    if (this.particleSystem) {
      if (this.particleSystem.geometry) {
        this.particleSystem.geometry.dispose();
      }
      if (this.particleSystem.material) {
        if (this.particleSystem.material.map) {
          this.particleSystem.material.map.dispose();
        }
        this.particleSystem.material.dispose();
      }
    }
  }
  
  // Set emitter position
  setPosition(position) {
    this.options.position.copy(position);
  }
  
  // Start emitting
  start() {
    this.options.active = true;
    this.alive = true;
    this.age = 0;
    this.clock.start();
  }
  
  // Stop emitting
  stop() {
    this.options.active = false;
  }
  
  // Kill all particles
  reset() {
    for (let i = 0; i < this.particles.length; i++) {
      this.killParticle(this.particles[i]);
    }
    
    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
  }
}

// Main Particle System Manager
export default class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.emitters = [];
    this.isActive = true;
    this.clock = new THREE.Clock();
    this.textureLoader = new THREE.TextureLoader();
    
    // Preload common textures
    this.textures = {};
    this.preloadTextures();
  }
  
  preloadTextures() {
    // Common particle shapes
    const texturePromises = [
      this.loadTexture('circle', '/assets/particles/circle.png'),
      this.loadTexture('smoke', '/assets/particles/smoke.png'),
      this.loadTexture('spark', '/assets/particles/spark.png'),
      this.loadTexture('star', '/assets/particles/star.png')
    ];
    
    // Wait for all textures to load
    Promise.all(texturePromises)
      .then(() => {
        console.log('All particle textures loaded');
      })
      .catch(error => {
        console.error('Error loading particle textures:', error);
      });
  }
  
  loadTexture(name, url) {
    return new Promise((resolve, reject) => {
      try {
        this.textureLoader.load(
          url,
          texture => {
            this.textures[name] = texture;
            resolve(texture);
          },
          undefined,
          error => {
            console.error(`Error loading texture ${url}:`, error);
            reject(error);
          }
        );
      } catch (error) {
        console.error(`Error setting up texture load for ${url}:`, error);
        reject(error);
      }
    });
  }
  
  update() {
    if (!this.isActive) return;
    
    // Update all emitters and remove finished ones
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const isAlive = this.emitters[i].update();
      
      if (!isAlive) {
        // Remove from scene
        this.emitters[i].removeFromScene(this.scene);
        // Dispose resources
        this.emitters[i].dispose();
        // Remove from array
        this.emitters.splice(i, 1);
      }
    }
  }
  
  // Create an explosion effect
  createExplosion(position, options = {}) {
    const defaultOptions = {
      position: position.clone(),
      positionSpread: new THREE.Vector3(2, 2, 2),
      velocity: new THREE.Vector3(0, 2, 0),
      velocitySpread: new THREE.Vector3(10, 10, 10),
      acceleration: new THREE.Vector3(0, -5, 0),
      particleCount: 100,
      particlesPerSecond: 0, // Emit all at once
      maxParticleLife: 2,
      particleSize: 3,
      particleSizeRange: 2,
      particleColor: new THREE.Color(0xff4500), // Orange-red
      particleColorEnd: new THREE.Color(0x333333), // Dark gray smoke
      blending: THREE.AdditiveBlending,
      texture: this.textures.smoke || null,
      active: true,
      duration: 0.1 // Short burst
    };
    
    // Merge with custom options
    const emitterOptions = { ...defaultOptions, ...options };
    
    return this.createEmitter(emitterOptions);
  }
  
  // Create a coin collection effect
  createCoinEffect(position, options = {}) {
    const defaultOptions = {
      position: position.clone(),
      positionSpread: new THREE.Vector3(5, 5, 5),
      velocity: new THREE.Vector3(0, 8, 0),
      velocitySpread: new THREE.Vector3(3, 2, 3),
      acceleration: new THREE.Vector3(0, -2, 0),
      particleCount: 30,
      particlesPerSecond: 0, // Emit all at once
      maxParticleLife: 1.5,
      particleSize: 2,
      particleSizeRange: 1,
      particleColor: new THREE.Color(0xffdf00), // Gold
      particleColorEnd: new THREE.Color(0xffdf00),
      blending: THREE.AdditiveBlending,
      texture: this.textures.star || null,
      active: true,
      duration: 0.1 // Short burst
    };
    
    // Merge with custom options
    const emitterOptions = { ...defaultOptions, ...options };
    
    return this.createEmitter(emitterOptions);
  }
  
  // Create a shield effect
  createShieldEffect(position, options = {}) {
    const defaultOptions = {
      position: position.clone(),
      positionSpread: new THREE.Vector3(30, 20, 30),
      velocity: new THREE.Vector3(0, 0, 0),
      velocitySpread: new THREE.Vector3(5, 5, 5),
      acceleration: new THREE.Vector3(0, 0, 0),
      particleCount: 50,
      particlesPerSecond: 20,
      maxParticleLife: 1.0,
      particleSize: 3,
      particleSizeRange: 2,
      particleColor: new THREE.Color(0x4d88ff), // Light blue
      particleColorEnd: new THREE.Color(0x0044ff), // Darker blue
      blending: THREE.AdditiveBlending,
      texture: this.textures.spark || null,
      active: true,
      duration: 5 // Shield duration
    };
    
    // Merge with custom options
    const emitterOptions = { ...defaultOptions, ...options };
    
    return this.createEmitter(emitterOptions);
  }
  
  // Create a boost effect
  createBoostEffect(position, options = {}) {
    const defaultOptions = {
      position: position.clone(),
      positionSpread: new THREE.Vector3(5, 5, 5),
      velocity: new THREE.Vector3(-20, 0, 0), // Shoot backwards
      velocitySpread: new THREE.Vector3(5, 5, 5),
      acceleration: new THREE.Vector3(0, 0, 0),
      particleCount: 200,
      particlesPerSecond: 60,
      maxParticleLife: 1.0,
      particleSize: 4,
      particleSizeRange: 2,
      particleColor: new THREE.Color(0xff8800), // Orange
      particleColorEnd: new THREE.Color(0xff0000), // Red
      blending: THREE.AdditiveBlending,
      texture: this.textures.spark || null,
      active: true,
      duration: 0 // Continuous until stopped
    };
    
    // Merge with custom options
    const emitterOptions = { ...defaultOptions, ...options };
    
    return this.createEmitter(emitterOptions);
  }
  
  // Create a dust/smoke trail
  createDustTrail(position, options = {}) {
    const defaultOptions = {
      position: position.clone(),
      positionSpread: new THREE.Vector3(10, 0, 10),
      velocity: new THREE.Vector3(-5, 1, 0),
      velocitySpread: new THREE.Vector3(2, 1, 2),
      acceleration: new THREE.Vector3(0, 0.5, 0),
      particleCount: 100,
      particlesPerSecond: 15,
      maxParticleLife: 3.0,
      particleSize: 8,
      particleSizeRange: 4,
      particleColor: new THREE.Color(0xcccccc), // Light gray
      particleColorEnd: new THREE.Color(0x555555), // Dark gray
      blending: THREE.NormalBlending,
      texture: this.textures.smoke || null,
      active: true,
      duration: 0 // Continuous until stopped
    };
    
    // Merge with custom options
    const emitterOptions = { ...defaultOptions, ...options };
    
    return this.createEmitter(emitterOptions);
  }
  
  // Create a rain effect
  createRainEffect(cameraPosition, options = {}) {
    const defaultOptions = {
      position: cameraPosition.clone().add(new THREE.Vector3(0, 100, 0)),
      positionSpread: new THREE.Vector3(400, 0, 400),
      velocity: new THREE.Vector3(0, -100, 0),
      velocitySpread: new THREE.Vector3(10, 20, 10),
      acceleration: new THREE.Vector3(0, -20, 0),
      particleCount: 1000,
      particlesPerSecond: 200,
      maxParticleLife: 4.0,
      particleSize: 1.5,
      particleSizeRange: 1,
      particleColor: new THREE.Color(0x8888ff), // Bluish
      particleColorEnd: new THREE.Color(0x8888ff),
      blending: THREE.NormalBlending,
      texture: this.textures.spark || null,
      active: true,
      duration: 0 // Continuous until stopped
    };
    
    // Merge with custom options
    const emitterOptions = { ...defaultOptions, ...options };
    
    return this.createEmitter(emitterOptions);
  }
  
  // Create a snow effect
  createSnowEffect(cameraPosition, options = {}) {
    const defaultOptions = {
      position: cameraPosition.clone().add(new THREE.Vector3(0, 100, 0)),
      positionSpread: new THREE.Vector3(400, 0, 400),
      velocity: new THREE.Vector3(0, -20, 0),
      velocitySpread: new THREE.Vector3(10, 5, 10),
      acceleration: new THREE.Vector3(0, -5, 0),
      particleCount: 1000,
      particlesPerSecond: 100,
      maxParticleLife: 10.0,
      particleSize: 3,
      particleSizeRange: 2,
      particleColor: new THREE.Color(0xffffff), // White
      particleColorEnd: new THREE.Color(0xffffff),
      blending: THREE.NormalBlending,
      texture: this.textures.circle || null,
      active: true,
      duration: 0 // Continuous until stopped
    };
    
    // Merge with custom options
    const emitterOptions = { ...defaultOptions, ...options };
    
    return this.createEmitter(emitterOptions);
  }
  
  // Generic emitter creation
  createEmitter(options) {
    const emitter = new ParticleEmitter(options);
    emitter.addToScene(this.scene);
    this.emitters.push(emitter);
    return emitter;
  }
  
  // Remove all emitters
  clearAll() {
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      this.emitters[i].removeFromScene(this.scene);
      this.emitters[i].dispose();
    }
    
    this.emitters = [];
  }
  
  // Pause the particle system
  pause() {
    this.isActive = false;
  }
  
  // Resume the particle system
  resume() {
    this.isActive = true;
  }
  
  // Dispose of all resources
  dispose() {
    this.clearAll();
    
    // Dispose textures
    for (const name in this.textures) {
      if (this.textures[name]) {
        this.textures[name].dispose();
      }
    }
    
    this.textures = {};
  }
}