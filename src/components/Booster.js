// src/components/Booster.js
import { Colors } from './common'
import * as THREE from 'three'

export default class Booster {
  constructor() {
    this.mesh = new THREE.Object3D()
    this.mesh.name = 'booster'
    
    // Create the main booster shape
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
    
    // Animation properties
    this.angle = 0
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
  }
}