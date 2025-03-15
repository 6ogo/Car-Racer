// src/components/Car.js
import { Colors } from './common'
import Driver from './Driver'
import * as THREE from 'three'

export default class Car {
  constructor () {
    this.mesh = new THREE.Object3D()
    this.mesh.name = 'car'

    // Car Body
    const geomBody = new THREE.BoxGeometry(80, 30, 50, 1, 1, 1)
    const matBody = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})

    // Modify the vertices to create a sporty car shape
    geomBody.vertices[4].y -= 10
    geomBody.vertices[4].z += 20
    geomBody.vertices[5].y -= 10
    geomBody.vertices[5].z -= 20
    geomBody.vertices[6].y += 10
    geomBody.vertices[6].z += 20
    geomBody.vertices[7].y += 10
    geomBody.vertices[7].z -= 20

    const body = new THREE.Mesh(geomBody, matBody)
    body.castShadow = true
    body.receiveShadow = true
    this.mesh.add(body)

    // Car Roof
    const geomRoof = new THREE.BoxGeometry(40, 25, 50, 1, 1, 1)
    const matRoof = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})
    
    const roof = new THREE.Mesh(geomRoof, matRoof)
    roof.position.x = -15
    roof.position.y = 25
    roof.castShadow = true
    roof.receiveShadow = true
    this.mesh.add(roof)

    // Windshield
    const geomWindshield = new THREE.BoxGeometry(3, 20, 40, 1, 1, 1)
    const matWindshield = new THREE.MeshPhongMaterial({color: Colors.blue, transparent: true, opacity: 0.3, flatShading: true})
    const windshield = new THREE.Mesh(geomWindshield, matWindshield)
    windshield.position.set(10, 20, 0)
    windshield.castShadow = true
    windshield.receiveShadow = true
    this.mesh.add(windshield)

    // Wheels
    this.createWheel(-25, -15, 25)
    this.createWheel(-25, -15, -25)
    this.createWheel(25, -15, 25)
    this.createWheel(25, -15, -25)

    // Driver
    this.driver = new Driver()
    this.driver.mesh.position.set(-15, 25, 0)
    this.mesh.add(this.driver.mesh)

    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
  }

  createWheel(x, y, z) {
    const wheelGeometry = new THREE.CylinderGeometry(10, 10, 10, 16)
    wheelGeometry.rotateZ(Math.PI / 2)
    const wheelMaterial = new THREE.MeshPhongMaterial({color: Colors.brownDark, flatShading: true})
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheel.position.set(x, y, z)
    wheel.castShadow = true
    wheel.receiveShadow = true
    this.mesh.add(wheel)

    // Hubcap
    const hubcapGeometry = new THREE.CircleGeometry(6, 8)
    const hubcapMaterial = new THREE.MeshPhongMaterial({color: Colors.white, flatShading: true})
    const hubcap = new THREE.Mesh(hubcapGeometry, hubcapMaterial)
    hubcap.position.set(5, 0, 0)
    hubcap.rotation.y = Math.PI / 2
    wheel.add(hubcap)

    return wheel
  }
}