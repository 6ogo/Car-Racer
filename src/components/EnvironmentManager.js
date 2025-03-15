// src/components/EnvironmentManager.js
import * as THREE from 'three'
import { Colors } from './common'

export default class EnvironmentManager {
  constructor(scene) {
    this.scene = scene
    this.currentTheme = 'day'
    this.skyMesh = null
    this.lights = {}
    this.particles = []
    this.environmentObjects = []
    
    // Environment settings
    this.themes = {
      day: {
        skyColor: 0x87CEEB, // Sky blue
        fogColor: 0xf7d9aa,
        fogDensity: 0.002,
        lightIntensity: 0.9,
        ambientIntensity: 0.5,
        particleSystem: null
      },
      night: {
        skyColor: 0x0a1a2a, // Dark blue
        fogColor: 0x0a1a2a,
        fogDensity: 0.005,
        lightIntensity: 0.6,
        ambientIntensity: 0.2,
        particleSystem: null
      },
      sunset: {
        skyColor: 0xff7e50, // Orange sunset
        fogColor: 0xff7e50,
        fogDensity: 0.003,
        lightIntensity: 0.8,
        ambientIntensity: 0.4,
        particleSystem: null
      },
      rain: {
        skyColor: 0x4d4d4d, // Grey sky
        fogColor: 0x4d4d4d,
        fogDensity: 0.006,
        lightIntensity: 0.7,
        ambientIntensity: 0.3,
        particleSystem: 'rain'
      },
      snow: {
        skyColor: 0xf0f0f0, // Light grey
        fogColor: 0xf0f0f0,
        fogDensity: 0.004,
        lightIntensity: 0.8,
        ambientIntensity: 0.6,
        particleSystem: 'snow'
      },
      desert: {
        skyColor: 0x87CEEB, // Sky blue
        fogColor: 0xedc9af, // Sandy color
        fogDensity: 0.005,
        lightIntensity: 1.0,
        ambientIntensity: 0.7,
        particleSystem: 'dust'
      }
    }
    
    // Initialize components
    this.initSky()
    this.initLights()
  }
  
  initSky() {
    const skyGeom = new THREE.SphereGeometry(1000, 25, 25)
    const skyMat = new THREE.MeshPhongMaterial({
      color: this.themes[this.currentTheme].skyColor,
      side: THREE.BackSide
    })
    
    this.skyMesh = new THREE.Mesh(skyGeom, skyMat)
    this.scene.add(this.skyMesh)
  }
  
  initLights() {
    // Hemisphere light (sky/ground)
    this.lights.hemisphere = new THREE.HemisphereLight(
      0xaaaaaa, 0x000000, 
      this.themes[this.currentTheme].ambientIntensity
    )
    this.scene.add(this.lights.hemisphere)
    
    // Directional light (sun/moon)
    this.lights.directional = new THREE.DirectionalLight(
      0xffffff, 
      this.themes[this.currentTheme].lightIntensity
    )
    this.lights.directional.position.set(150, 350, 350)
    this.lights.directional.castShadow = true
    
    // Shadow properties
    this.lights.directional.shadow.camera.left = -400
    this.lights.directional.shadow.camera.right = 400
    this.lights.directional.shadow.camera.top = 400
    this.lights.directional.shadow.camera.bottom = -400
    this.lights.directional.shadow.camera.near = 1
    this.lights.directional.shadow.camera.far = 1000
    this.lights.directional.shadow.mapSize.width = 2048
    this.lights.directional.shadow.mapSize.height = 2048
    
    this.scene.add(this.lights.directional)
    
    // Ambient light for overall illumination
    this.lights.ambient = new THREE.AmbientLight(
      0xdc8874, 
      this.themes[this.currentTheme].ambientIntensity / 2
    )
    this.scene.add(this.lights.ambient)
  }
  
  setTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error('Theme not found:', themeName)
      return
    }
    
    const oldTheme = this.currentTheme
    this.currentTheme = themeName
    
    // Update sky
    if (this.skyMesh) {
      this.skyMesh.material.color.setHex(this.themes[themeName].skyColor)
    }
    
    // Update fog
    if (this.scene.fog) {
      this.scene.fog.color.setHex(this.themes[themeName].fogColor)
      this.scene.fog.density = this.themes[themeName].fogDensity
    } else {
      this.scene.fog = new THREE.FogExp2(
        this.themes[themeName].fogColor,
        this.themes[themeName].fogDensity
      )
    }
    
    // Update lights
    this.lights.directional.intensity = this.themes[themeName].lightIntensity
    this.lights.hemisphere.intensity = this.themes[themeName].ambientIntensity
    this.lights.ambient.intensity = this.themes[themeName].ambientIntensity / 2
    
    // Clear old particle system if exists
    this.clearParticles()
    
    // Create new particle system if needed
    if (this.themes[themeName].particleSystem) {
      this.createParticleSystem(this.themes[themeName].particleSystem)
    }
    
    // Update environment-specific objects
    this.updateEnvironmentObjects(oldTheme, themeName)
    
    return true
  }
  
  clearParticles() {
    for (let i = 0; i < this.particles.length; i++) {
      this.scene.remove(this.particles[i])
    }
    this.particles = []
  }
  
  createParticleSystem(type) {
    switch (type) {
      case 'rain':
        this.createRain()
        break
      case 'snow':
        this.createSnow()
        break
      case 'dust':
        this.createDust()
        break
    }
  }
  
  createRain() {
    const rainCount = 15000
    const rainGeometry = new THREE.BufferGeometry()
    const rainPositions = new Float32Array(rainCount * 3) // xyz for each point
    const rainVertices = []
    
    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() * 2000) - 1000
      const y = (Math.random() * 1000) + 200
      const z = (Math.random() * 2000) - 1000
      
      rainPositions[i * 3] = x
      rainPositions[i * 3 + 1] = y
      rainPositions[i * 3 + 2] = z
      
      rainVertices.push({
        velocity: (Math.random() * 2) + 8,
        x: x,
        y: y,
        z: z
      })
    }
    
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3))
    
    const rainMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.5,
      transparent: true,
      opacity: 0.6
    })
    
    const rain = new THREE.Points(rainGeometry, rainMaterial)
    this.scene.add(rain)
    
    // Store for animation and cleanup
    rain.vertices = rainVertices
    this.particles.push(rain)
  }
  
  createSnow() {
    const snowCount = 10000
    const snowGeometry = new THREE.BufferGeometry()
    const snowPositions = new Float32Array(snowCount * 3)
    const snowVertices = []
    
    for (let i = 0; i < snowCount; i++) {
      const x = (Math.random() * 2000) - 1000
      const y = (Math.random() * 1000) + 200
      const z = (Math.random() * 2000) - 1000
      
      snowPositions[i * 3] = x
      snowPositions[i * 3 + 1] = y
      snowPositions[i * 3 + 2] = z
      
      snowVertices.push({
        velocity: (Math.random() * 1) + 1,
        x: x,
        y: y,
        z: z,
        wobbleX: Math.random() * 0.2 - 0.1,
        wobbleZ: Math.random() * 0.2 - 0.1
      })
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3))
    
    const snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      transparent: true,
      opacity: 0.8
    })
    
    const snow = new THREE.Points(snowGeometry, snowMaterial)
    this.scene.add(snow)
    
    // Store for animation and cleanup
    snow.vertices = snowVertices
    this.particles.push(snow)
  }
  
  createDust() {
    const dustCount = 5000
    const dustGeometry = new THREE.BufferGeometry()
    const dustPositions = new Float32Array(dustCount * 3)
    const dustVertices = []
    
    for (let i = 0; i < dustCount; i++) {
      const x = (Math.random() * 2000) - 1000
      const y = (Math.random() * 400) + 10 // Lower height for dust
      const z = (Math.random() * 2000) - 1000
      
      dustPositions[i * 3] = x
      dustPositions[i * 3 + 1] = y
      dustPositions[i * 3 + 2] = z
      
      dustVertices.push({
        velocity: (Math.random() * 0.5) + 0.5,
        x: x,
        y: y,
        z: z,
        wobbleX: Math.random() * 0.3 - 0.15,
        wobbleZ: Math.random() * 0.3 - 0.15
      })
    }
    
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
    
    const dustMaterial = new THREE.PointsMaterial({
      color: 0xd2b48c, // Tan/sand color
      size: 1.5,
      transparent: true,
      opacity: 0.4
    })
    
    const dust = new THREE.Points(dustGeometry, dustMaterial)
    this.scene.add(dust)
    
    // Store for animation and cleanup
    dust.vertices = dustVertices
    this.particles.push(dust)
  }
  
  updateParticles() {
    // Only update if we have particles
    if (this.particles.length === 0) return
    
    this.particles.forEach(particle => {
      const positions = particle.geometry.attributes.position.array
      
      for (let i = 0; i < particle.vertices.length; i++) {
        const vertex = particle.vertices[i]
        
        // Update Y position (falling)
        vertex.y -= vertex.velocity
        
        // Update X,Z for wobble effect (snow, dust)
        if (vertex.wobbleX) {
          vertex.x += vertex.wobbleX
          vertex.z += vertex.wobbleZ
        }
        
        // Reset if below ground
        if (vertex.y < -200) {
          if (this.currentTheme === 'rain') {
            vertex.y = (Math.random() * 500) + 500
          } else {
            vertex.y = (Math.random() * 500) + 500
            vertex.x = (Math.random() * 2000) - 1000
            vertex.z = (Math.random() * 2000) - 1000
          }
        }
        
        // Keep within bounds
        if (vertex.x > 1000) vertex.x = -1000
        if (vertex.x < -1000) vertex.x = 1000
        if (vertex.z > 1000) vertex.z = -1000
        if (vertex.z < -1000) vertex.z = 1000
        
        // Update position
        positions[i * 3] = vertex.x
        positions[i * 3 + 1] = vertex.y
        positions[i * 3 + 2] = vertex.z
      }
      
      particle.geometry.attributes.position.needsUpdate = true
    })
  }
  
  updateEnvironmentObjects(oldTheme, newTheme) {
    // Remove old environment-specific objects
    for (let i = 0; i < this.environmentObjects.length; i++) {
      this.scene.remove(this.environmentObjects[i])
    }
    this.environmentObjects = []
    
    // Add new environment-specific objects
    switch (newTheme) {
      case 'night':
        this.addStars()
        this.addMoon()
        break
      case 'desert':
        this.addCacti()
        break
      case 'sunset':
        this.addSun()
        break
    }
  }
  
  addStars() {
    const starsCount = 2000
    const starsGeometry = new THREE.BufferGeometry()
    const starsPositions = new Float32Array(starsCount * 3)
    
    for (let i = 0; i < starsCount; i++) {
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 900 + Math.random() * 50
      
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      
      starsPositions[i * 3] = x
      starsPositions[i * 3 + 1] = y
      starsPositions[i * 3 + 2] = z
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3))
    
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      transparent: true,
      opacity: 0.8
    })
    
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    this.scene.add(stars)
    this.environmentObjects.push(stars)
  }
  
  addMoon() {
    const moonGeometry = new THREE.SphereGeometry(50, 32, 32)
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff
    })
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial)
    moon.position.set(500, 300, -800)
    
    // Add glow effect
    const moonGlowGeometry = new THREE.SphereGeometry(55, 32, 32)
    const moonGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaaaff,
      transparent: true,
      opacity: 0.2
    })
    
    const moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial)
    moon.add(moonGlow)
    
    this.scene.add(moon)
    this.environmentObjects.push(moon)
    
    // Add light from moon
    const moonLight = new THREE.PointLight(0xaaaaff, 0.5, 1000)
    moonLight.position.copy(moon.position)
    this.scene.add(moonLight)
    this.environmentObjects.push(moonLight)
  }
  
  addSun() {
    const sunGeometry = new THREE.SphereGeometry(80, 32, 32)
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd44
    })
    
    const sun = new THREE.Mesh(sunGeometry, sunMaterial)
    sun.position.set(500, 200, -800)
    
    // Add glow effect
    const sunGlowGeometry = new THREE.SphereGeometry(100, 32, 32)
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.3
    })
    
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial)
    sun.add(sunGlow)
    
    this.scene.add(sun)
    this.environmentObjects.push(sun)
  }
  
  addCacti() {
    const cactusCount = 20
    
    for (let i = 0; i < cactusCount; i++) {
      const cactus = this.createCactus()
      
      // Position randomly along the sides of the road
      const side = Math.random() > 0.5 ? 1 : -1
      cactus.position.set(
        (Math.random() * 1500) - 750, // X position along the road
        0, // On the ground
        (200 + Math.random() * 100) * side // Z position off to the sides
      )
      
      // Random rotation and scale
      cactus.rotation.y = Math.random() * Math.PI * 2
      const scale = 0.5 + Math.random() * 1.5
      cactus.scale.set(scale, scale, scale)
      
      this.scene.add(cactus)
      this.environmentObjects.push(cactus)
    }
  }
  
  createCactus() {
    const cactus = new THREE.Object3D()
    
    // Main body of the cactus
    const bodyGeometry = new THREE.CylinderGeometry(5, 6, 30, 8)
    const cactusMaterial = new THREE.MeshPhongMaterial({
      color: 0x2d7d32, // Dark green
      flatShading: true
    })
    
    const body = new THREE.Mesh(bodyGeometry, cactusMaterial)
    body.position.y = 15
    cactus.add(body)
    
    // Add arms to the cactus (50% chance for each arm)
    if (Math.random() > 0.5) {
      const armGeometry = new THREE.CylinderGeometry(3, 3, 15, 8)
      
      const leftArm = new THREE.Mesh(armGeometry, cactusMaterial)
      leftArm.position.set(0, 5, 0)
      leftArm.rotation.z = Math.PI / 4
      body.add(leftArm)
    }
    
    if (Math.random() > 0.5) {
      const armGeometry = new THREE.CylinderGeometry(3, 3, 15, 8)
      
      const rightArm = new THREE.Mesh(armGeometry, cactusMaterial)
      rightArm.position.set(0, 8, 0)
      rightArm.rotation.z = -Math.PI / 4
      body.add(rightArm)
    }
    
    return cactus
  }
  
  update() {
    // Update particle systems
    this.updateParticles()
    
    // Special environment updates
    // For example, slowly moving the sun/moon
    if (this.currentTheme === 'night' || this.currentTheme === 'sunset') {
      for (let obj of this.environmentObjects) {
        if (obj.type === 'Mesh' && (obj.position.x === 500 || obj.position.x === -500)) {
          obj.rotation.y += 0.001
        }
      }
    }
  }
}