// src/components/EffectsManager.js
import * as THREE from 'three'
import { Colors } from './common'

export default class EffectsManager {
  constructor(scene) {
    this.scene = scene
    this.effects = []
    this.activeEffects = {}
  }
  
  createExplosion(position, color = 0xff5500, particleCount = 50, size = 1) {
    const explosion = new THREE.Object3D()
    explosion.position.copy(position)
    
    const particles = []
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    
    // Create particles with random directions
    for (let i = 0; i < particleCount; i++) {
      // Random direction
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      
      const x = Math.sin(phi) * Math.cos(theta)
      const y = Math.sin(phi) * Math.sin(theta)
      const z = Math.cos(phi)
      
      // Set initial positions at center
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      
      // Store particle data for animation
      particles.push({
        velocity: {
          x: x * (Math.random() * 2 + 1) * size,
          y: y * (Math.random() * 2 + 1) * size,
          z: z * (Math.random() * 2 + 1) * size
        },
        size: (Math.random() * 0.5 + 0.5) * size,
        index: i
      })
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    // Create point material
    const mat = new THREE.PointsMaterial({
      color: color,
      size: 2 * size,
      opacity: 1,
      transparent: true
    })
    
    const points = new THREE.Points(geo, mat)
    explosion.add(points)
    
    // Add to scene and track
    this.scene.add(explosion)
    
    const effect = {
      mesh: explosion,
      particles: particles,
      positions: positions,
      material: mat,
      lifetime: 0,
      maxLifetime: 60,
      type: 'explosion',
      update: () => {
        effect.lifetime++
        
        // Update all particles
        for (let i = 0; i < effect.particles.length; i++) {
          const p = effect.particles[i]
          
          // Apply velocity
          effect.positions[p.index * 3] += p.velocity.x
          effect.positions[p.index * 3 + 1] += p.velocity.y
          effect.positions[p.index * 3 + 2] += p.velocity.z
          
          // Add gravity
          p.velocity.y -= 0.05
          
          // Slow down
          p.velocity.x *= 0.98
          p.velocity.y *= 0.98
          p.velocity.z *= 0.98
        }
        
        effect.mesh.children[0].geometry.attributes.position.needsUpdate = true
        
        // Fade out
        effect.material.opacity = 1 - (effect.lifetime / effect.maxLifetime)
        
        // Return true if effect should be removed
        return effect.lifetime >= effect.maxLifetime
      }
    }
    
    this.effects.push(effect)
    return effect
  }
  
  createTrail(object, color = 0x87ceeb, particleCount = 20, size = 0.5) {
    if (this.activeEffects.trail) {
      // Trail already exists, just update it
      return this.activeEffects.trail
    }
    
    const trail = new THREE.Object3D()
    this.scene.add(trail)
    
    const particles = []
    
    const effect = {
      mesh: trail,
      particles: particles,
      type: 'trail',
      source: object,
      lifetime: 0,
      color: color,
      size: size,
      update: () => {
        // Get current position from source object
        const position = new THREE.Vector3()
        position.setFromMatrixPosition(object.matrixWorld)
        
        // Create new particle at current position
        if (effect.lifetime % 2 === 0) { // Only add particle every other frame
          this.addTrailParticle(trail, position, effect.particles, effect.color, effect.size)
          
          // Limit number of particles
          if (effect.particles.length > particleCount) {
            const removed = effect.particles.shift()
            trail.remove(removed.mesh)
          }
        }
        
        // Update existing particles
        for (let i = 0; i < effect.particles.length; i++) {
          const p = effect.particles[i]
          
          // Fade out
          p.opacity -= 0.03
          p.mesh.material.opacity = p.opacity
          
          // Grow slightly
          p.size *= 1.03
          p.mesh.scale.set(p.size, p.size, p.size)
        }
        
        effect.lifetime++
        
        // Continuous effect, never auto-remove
        return false
      }
    }
    
    this.effects.push(effect)
    this.activeEffects.trail = effect
    return effect
  }
  
  addTrailParticle(trail, position, particles, color, size) {
    // Create a small sphere or point for the trail
    const geo = new THREE.SphereGeometry(1, 4, 4)
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    })
    
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(position)
    mesh.position.y -= 10 // Slightly below car
    mesh.scale.set(size, size, size)
    
    trail.add(mesh)
    
    particles.push({
      mesh: mesh,
      opacity: 0.7,
      size: size
    })
  }
  
  createBoostEffect(object) {
    if (this.activeEffects.boost) {
      // Effect already exists, just extend its lifetime
      this.activeEffects.boost.lifetime = 0
      return this.activeEffects.boost
    }
    
    // Create special particle effects for boost
    const boost = new THREE.Object3D()
    this.scene.add(boost)
    
    // Use a trail with special colors
    const trailEffect = this.createTrail(object, 0xff6600, 30, 0.8)
    
    // Create flame effect behind the car
    const flameGeo = new THREE.ConeGeometry(5, 20, 16)
    flameGeo.rotateX(Math.PI)
    
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.8
    })
    
    const flame = new THREE.Mesh(flameGeo, flameMat)
    
    // Add to scene behind car
    boost.add(flame)
    
    const effect = {
      mesh: boost,
      type: 'boost',
      source: object,
      trail: trailEffect,
      flame: flame,
      lifetime: 0,
      maxLifetime: 180, // 3 seconds at 60fps
      update: () => {
        // Get current position from source object
        const position = new THREE.Vector3()
        position.setFromMatrixPosition(object.matrixWorld)
        
        // Position the flame behind the car
        effect.flame.position.copy(position)
        effect.flame.position.x -= 40 // Behind car
        effect.flame.position.y -= 5 // Slightly below car
        
        // Animate flame
        const scale = 0.8 + Math.sin(effect.lifetime * 0.3) * 0.2
        effect.flame.scale.set(scale, 1 + Math.sin(effect.lifetime * 0.5) * 0.3, scale)
        
        // Random flicker
        effect.flame.material.opacity = 0.7 + Math.random() * 0.3
        
        // Update lifetime
        effect.lifetime++
        
        // Return true if effect should be removed
        return effect.lifetime >= effect.maxLifetime
      }
    }
    
    this.effects.push(effect)
    this.activeEffects.boost = effect
    return effect
  }
  
  createShieldEffect(object, color = 0x4d88ff) {
    if (this.activeEffects.shield) {
      // Effect already exists, just extend its lifetime
      this.activeEffects.shield.lifetime = 0
      return this.activeEffects.shield
    }
    
    const shield = new THREE.Object3D()
    
    // Create shield bubble
    const bubbleGeo = new THREE.SphereGeometry(50, 16, 16)
    const bubbleMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMat)
    shield.add(bubble)
    
    // Add ring effect
    const ringGeo = new THREE.RingGeometry(48, 50, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    shield.add(ring)
    
    this.scene.add(shield)
    
    const effect = {
      mesh: shield,
      type: 'shield',
      source: object,
      lifetime: 0,
      maxLifetime: (60 * 5), // 5 seconds at 60fps
      update: () => {
        // Get current position from source object
        const position = new THREE.Vector3()
        position.setFromMatrixPosition(object.matrixWorld)
        
        // Position the shield around the car
        effect.mesh.position.copy(position)
        
        // Animate the shield
        effect.mesh.rotation.y += 0.02
        effect.mesh.rotation.z += 0.01
        
        // Pulse effect
        const pulse = 1 + Math.sin(effect.lifetime * 0.1) * 0.05
        bubble.scale.set(pulse, pulse, pulse)
        
        // Update the ring
        ring.scale.set(1 + Math.sin(effect.lifetime * 0.2) * 0.1, 1, 1 + Math.sin(effect.lifetime * 0.2) * 0.1)
        
        // Fade out at the end
        if (effect.lifetime > effect.maxLifetime - 60) {
          const fade = 1 - ((effect.lifetime - (effect.maxLifetime - 60)) / 60)
          bubble.material.opacity = 0.3 * fade
          ring.material.opacity = 0.5 * fade
        }
        
        // Update lifetime
        effect.lifetime++
        
        // Return true if effect should be removed
        return effect.lifetime >= effect.maxLifetime
      }
    }
    
    this.effects.push(effect)
    this.activeEffects.shield = effect
    return effect
  }
  
  createCoinCollectEffect(position) {
    // Create sparkles when collecting coins
    const sparkles = new THREE.Object3D()
    sparkles.position.copy(position)
    
    const particleCount = 20
    const particles = []
    
    for (let i = 0; i < particleCount; i++) {
      const geo = new THREE.BoxGeometry(1, 1, 1)
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 1
      })
      
      const particle = new THREE.Mesh(geo, mat)
      
      // Random position slightly offset from center
      particle.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )
      
      // Random velocity
      const velocity = {
        x: (Math.random() - 0.5) * 2,
        y: Math.random() * 2 + 1, // Mostly upward
        z: (Math.random() - 0.5) * 2
      }
      
      sparkles.add(particle)
      
      particles.push({
        mesh: particle,
        velocity: velocity
      })
    }
    
    this.scene.add(sparkles)
    
    // Create large sparkle ring
    const ringGeo = new THREE.RingGeometry(5, 20, 16)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    })
    
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    sparkles.add(ring)
    
    const effect = {
      mesh: sparkles,
      particles: particles,
      ring: ring,
      type: 'coinCollect',
      lifetime: 0,
      maxLifetime: 30,
      update: () => {
        // Update particles
        for (let i = 0; i < effect.particles.length; i++) {
          const p = effect.particles[i]
          
          // Move particle
          p.mesh.position.x += p.velocity.x
          p.mesh.position.y += p.velocity.y
          p.mesh.position.z += p.velocity.z
          
          // Add gravity
          p.velocity.y -= 0.1
          
          // Rotate particle
          p.mesh.rotation.x += 0.1
          p.mesh.rotation.y += 0.1
          
          // Fade out
          p.mesh.material.opacity = 1 - (effect.lifetime / effect.maxLifetime)
        }
        
        // Expand ring
        ring.scale.set(
          1 + effect.lifetime * 0.2,
          1,
          1 + effect.lifetime * 0.2
        )
        
        // Fade out ring
        ring.material.opacity = 0.7 * (1 - (effect.lifetime / effect.maxLifetime))
        
        // Update lifetime
        effect.lifetime++
        
        // Return true if effect should be removed
        return effect.lifetime >= effect.maxLifetime
      }
    }
    
    this.effects.push(effect)
    return effect
  }
  
  removeEffect(effect) {
    // Remove from scene
    this.scene.remove(effect.mesh)
    
    // Remove from active effects
    for (const key in this.activeEffects) {
      if (this.activeEffects[key] === effect) {
        delete this.activeEffects[key]
      }
    }
    
    // Remove from effects array
    const index = this.effects.indexOf(effect)
    if (index !== -1) {
      this.effects.splice(index, 1)
    }
  }
  
  update() {
    // Update all active effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i]
      
      // Call update method, which returns true if effect should be removed
      const shouldRemove = effect.update()
      
      if (shouldRemove) {
        this.removeEffect(effect)
      }
    }
  }
}