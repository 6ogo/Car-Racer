// src/components/Truck.js
import * as THREE from 'three';
import { Colors } from './common'; // Assuming common.js defines Colors

export default class Truck {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'truck';

    // Truck body
    const geomBody = new THREE.BoxGeometry(100, 40, 30);
    const matBody = new THREE.MeshPhongMaterial({ color: Colors.blue || 0x0000ff, flatShading: true });
    const body = new THREE.Mesh(geomBody, matBody);
    body.position.set(0, 20, 0);
    this.mesh.add(body);

    // Cabin
    const geomCabin = new THREE.BoxGeometry(40, 30, 30);
    const matCabin = new THREE.MeshPhongMaterial({ color: Colors.white || 0xffffff, flatShading: true });
    const cabin = new THREE.Mesh(geomCabin, matCabin);
    cabin.position.set(30, 35, 0);
    this.mesh.add(cabin);

    // Wheels
    const geomWheel = new THREE.CylinderGeometry(15, 15, 10, 32);
    const matWheel = new THREE.MeshPhongMaterial({ color: Colors.brownDark || 0x333333, flatShading: true });
    const wheelFL = new THREE.Mesh(geomWheel, matWheel);
    wheelFL.position.set(40, 10, 15);
    wheelFL.rotation.z = Math.PI / 2;
    this.mesh.add(wheelFL);

    const wheelFR = wheelFL.clone();
    wheelFR.position.z = -15;
    this.mesh.add(wheelFR);

    const wheelRL = wheelFL.clone();
    wheelRL.position.x = -40;
    this.mesh.add(wheelRL);

    const wheelRR = wheelRL.clone();
    wheelRR.position.z = -15;
    this.mesh.add(wheelRR);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
}