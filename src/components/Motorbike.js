// src/components/Motorbike.js
import * as THREE from 'three';
import { Colors } from './common'; // Assuming common.js defines Colors

export default class Motorbike {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'motorbike';

    // Frame
    const geomFrame = new THREE.BoxGeometry(50, 10, 10);
    const matFrame = new THREE.MeshPhongMaterial({ color: Colors.red || 0xff0000, flatShading: true });
    const frame = new THREE.Mesh(geomFrame, matFrame);
    frame.position.set(0, 10, 0);
    this.mesh.add(frame);

    // Handlebars
    const geomHandlebars = new THREE.BoxGeometry(5, 5, 20);
    const handlebars = new THREE.Mesh(geomHandlebars, matFrame);
    handlebars.position.set(25, 15, 0);
    this.mesh.add(handlebars);

    // Wheels
    const geomWheel = new THREE.CylinderGeometry(10, 10, 5, 32);
    const matWheel = new THREE.MeshPhongMaterial({ color: Colors.brownDark || 0x333333, flatShading: true });
    const wheelF = new THREE.Mesh(geomWheel, matWheel);
    wheelF.position.set(20, 5, 0);
    wheelF.rotation.z = Math.PI / 2;
    this.mesh.add(wheelF);

    const wheelR = wheelF.clone();
    wheelR.position.x = -20;
    this.mesh.add(wheelR);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
}