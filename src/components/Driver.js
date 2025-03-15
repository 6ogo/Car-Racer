// src/components/Driver.js
import { Colors } from './common'
import * as THREE from 'three'

export default class Driver {
  constructor () {
    this.mesh = new THREE.Object3D()
    this.mesh.name = 'driver'
    this.angleHairs = 0

    // Body
    const bodyGeom = new THREE.BoxGeometry(12, 15, 15)
    const bodyMat = new THREE.MeshPhongMaterial({color: Colors.brown, flatShading: true})
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.position.set(-2, -8, 0)
    this.mesh.add(body)

    // Face
    const faceGeom = new THREE.BoxGeometry(10, 10, 10)
    const faceMat = new THREE.MeshLambertMaterial({color: Colors.pink})
    const face = new THREE.Mesh(faceGeom, faceMat)
    face.position.y = 7
    this.mesh.add(face)

    // Hair
    const hairGeom = new THREE.BoxGeometry(4, 4, 4)
    const hairMat = new THREE.MeshLambertMaterial({color: Colors.brown})
    
    // Hair Top
    this.hairsTop = new THREE.Object3D()
    
    for (let i = 0; i < 9; i++) {
      const hair = new THREE.Mesh(hairGeom, hairMat)
      const col = i % 3
      const row = Math.floor(i / 3)
      hair.position.set(-4 + row * 4, 11, -4 + col * 4)
      this.hairsTop.add(hair)
    }
    
    this.mesh.add(this.hairsTop)

    // Eyes
    const eyeGeom = new THREE.BoxGeometry(2, 3, 3)
    const eyeMat = new THREE.MeshLambertMaterial({color: Colors.white})
    
    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat)
    leftEye.position.set(5, 7, -3)
    this.mesh.add(leftEye)
    
    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat)
    rightEye.position.set(5, 7, 3)
    this.mesh.add(rightEye)
    
    // Pupils
    const pupilGeom = new THREE.BoxGeometry(1, 1, 1)
    const pupilMat = new THREE.MeshLambertMaterial({color: Colors.brownDark})
    
    // Left Pupil
    const leftPupil = new THREE.Mesh(pupilGeom, pupilMat)
    leftPupil.position.set(0.5, 0, 0)
    leftEye.add(leftPupil)
    
    // Right Pupil
    const rightPupil = new THREE.Mesh(pupilGeom, pupilMat)
    rightPupil.position.set(0.5, 0, 0)
    rightEye.add(rightPupil)
  }

  updateHairs() {
    // Add slight animation to the driver's hair
    const hairs = this.hairsTop.children
    const l = hairs.length

    for (let i = 0; i < l; i++) {
      const hair = hairs[i]
      hair.scale.y = 0.75 + Math.cos(this.angleHairs + i / 3) * 0.25
    }
    
    this.angleHairs += 0.16
  }
}