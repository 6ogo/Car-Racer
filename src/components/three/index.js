// src/components/three/index.js
import Vue from 'vue'
import Renderer from './Renderer.vue'
import Scene from './Scene.vue'
import Camera from './Camera.vue'
import Object3D from './Object3D.vue'
import Light from './Light.vue'
import Animation from './Animation.vue'

const components = {
  Renderer,
  Scene,
  Camera,
  Object3D,
  Light,
  Animation
}

const ThreePlugin = {
  install(Vue) {
    // Register all components
    Object.keys(components).forEach(name => {
      Vue.component(`three-${name.toLowerCase()}`, components[name])
    })
  }
}

export default ThreePlugin

// Allow individual component imports
export { Renderer, Scene, Camera, Object3D, Light, Animation }