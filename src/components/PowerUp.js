// src/components/PowerUp.js
import { Colors } from './common'
import * as THREE from 'three'

export default class PowerUp {
  constructor(type) {
    this.mesh = new THREE.Object3D()
    this.mesh.name = 'powerup'
    this.type = type
    
    // Animation properties
    this.angle = 0
    
    // Create powerup based on type
    switch(type) {
      case 'boost':
        this.createBoostPowerUp()
        break
      case 'shield':
        this.createShieldPowerUp()
        break
      case 'magnet':
        this.createMagnetPowerUp()
        break
      case 'multiplier':
        this.createMultiplierPowerUp()
        break
      default:
        this.createBoostPowerUp()
    }
  }
  
  createBoostPowerUp() {
    // Create the main booster shape - green cube
    const geom = new THREE.BoxGeometry(15, 15, 15)
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.green,
      flatShading: true,
      transparent: true,
      opacity: 0.8
    })
    
    const cube = new THREE.Mesh(geom, mat)
    cube.castShadow = true
    this.mesh.add(cube)
    
    // Add arrow indicating speed boost
    this.createArrow()
  }
  
  createShieldPowerUp() {
    // Create a protective bubble/shield - blue sphere
    const geom = new THREE.SphereGeometry(15, 16, 16)
    const mat = new THREE.MeshPhongMaterial({
      color: 0x4d88ff, // Light blue
      flatShading: false,
      transparent: true,
      opacity: 0.6
    })
    
    const shield = new THREE.Mesh(geom, mat)
    shield.castShadow = true
    this.mesh.add(shield)
    
    // Inner shield
    const innerGeom = new THREE.SphereGeometry(10, 16, 16)
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x0055ff, // Darker blue
      flatShading: false,
      transparent: true,
      opacity: 0.4
    })
    
    const innerShield = new THREE.Mesh(innerGeom, innerMat)
    this.mesh.add(innerShield)
    
    // Shield icon in center
    const iconGeom = new THREE.BoxGeometry(8, 8, 2)
    const iconMat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    })
    
    const icon = new THREE.Mesh(iconGeom, iconMat)
    this.mesh.add(icon)
  }
  
  createMagnetPowerUp() {
    // Create magnet shape - red horseshoe
    const base = new THREE.Object3D()
    this.mesh.add(base)
    
    // Create the magnet body
    const bodyGeom = new THREE.TorusGeometry(10, 5, 16, 32, Math.PI)
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0xff3333, // Red
      flatShading: true
    })
    
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.rotation.x = Math.PI / 2
    body.rotation.z = Math.PI
    body.position.y = 5
    base.add(body)
    
    // Create magnet poles
    const poleGeom = new THREE.CylinderGeometry(3, 3, 10, 8)
    const poleMat1 = new THREE.MeshPhongMaterial({
      color: 0xff3333, // Red
      flatShading: true
    })
    
    const poleMat2 = new THREE.MeshPhongMaterial({
      color: 0xcccccc, // Silver
      flatShading: true
    })
    
    const pole1 = new THREE.Mesh(poleGeom, poleMat1)
    pole1.position.set(10, 0, 0)
    base.add(pole1)
    
    const pole2 = new THREE.Mesh(poleGeom, poleMat1)
    pole2.position.set(-10, 0, 0)
    base.add(pole2)
    
    // Metal tips
    const tipGeom = new THREE.CylinderGeometry(3.5, 3.5, 2, 8)
    
    const tip1 = new THREE.Mesh(tipGeom, poleMat2)
    tip1.position.set(10, -6, 0)
    base.add(tip1)
    
    const tip2 = new THREE.Mesh(tipGeom, poleMat2)
    tip2.position.set(-10, -6, 0)
    base.add(tip2)
    
    // Invisible outer ring for collision detection
    this.collisionRing = new THREE.Mesh(
      new THREE.RingGeometry(25, 26, 32),
      new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        visible: false
      })
    )
    this.collisionRing.rotation.x = Math.PI / 2
    this.mesh.add(this.collisionRing)
  }
  
  createMultiplierPowerUp() {
    // Create x2 multiplier - golden star
    const starShape = new THREE.Shape()
    
    const numPoints = 10
    const outerRadius = 15
    const innerRadius = 7
    
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (Math.PI / numPoints) * i
      const x = Math.sin(angle) * radius
      const y = Math.cos(angle) * radius
      
      if (i === 0) {
        starShape.moveTo(x, y)
      } else {
        starShape.lineTo(x, y)
      }
    }
    
    starShape.closePath()
    
    const extrudeSettings = {
      depth: 3,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 1,
      bevelThickness: 1
    }
    
    const starGeom = new THREE.ExtrudeGeometry(starShape, extrudeSettings)
    const starMat = new THREE.MeshPhongMaterial({
      color: 0xffcc00, // Gold
      flatShading: true,
      specular: 0xffffcc,
      shininess: 100
    })
    
    const star = new THREE.Mesh(starGeom, starMat)
    star.rotation.x = Math.PI / 2
    this.mesh.add(star)
    
    // Add "x2" text
    const textGeom = new THREE.TextGeometry('x2', {
      font: undefined, // This would need to be set later with a loaded font
      size: 5,
      height: 1
    })
    
    const textMat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    })
    
    // Note: We'll need to load a font before this works
    // For now, we'll add a simple stand-in
    const x2Geom = new THREE.BoxGeometry(8, 8, 1)
    const x2Mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    })
    
    const x2 = new THREE.Mesh(x2Geom, x2Mat)
    x2.position.z = 3
    this.mesh.add(x2)
  }
  
  createArrow() {
    // Arrow body
    const arrowBodyGeom = new THREE.BoxGeometry(5, 2, 8)
    const arrowMat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    })
    
    const arrowBody = new THREE.Mesh(arrowBodyGeom, arrowMat)
    arrowBody.position.set(0, 8, 0)
    this.mesh.add(arrowBody)
    
    // Arrow head (triangle)
    const arrowHeadGeom = new THREE.ConeGeometry(4, 8, 3)
    arrowHeadGeom.rotateX(Math.PI / 2)
    
    const arrowHead = new THREE.Mesh(arrowHeadGeom, arrowMat)
    arrowHead.position.set(0, 8, 8)
    this.mesh.add(arrowHead)
  }
  
  // Update method for animations
  update() {
    // Make it float up and down
    this.mesh.position.y += Math.sin(this.angle) * 0.1
    this.angle += 0.1
    
    // Rotate slightly
    this.mesh.rotation.y += 0.02
    
    if (this.type === 'magnet') {
      // Special rotation for magnet
      this.mesh.children[0].rotation.y += 0.01
    } else if (this.type === 'multiplier') {
      // Special rotation for multiplier (star)
      this.mesh.rotation.z += 0.02
    }
  }
}