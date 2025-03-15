<template>
    <div style="display: none">
      <slot></slot>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ThreeObject3D',
    inject: ['scene'],
    props: {
      obj: {
        type: Object,
        required: true
      },
      position: {
        type: Object,
        default: () => ({ x: 0, y: 0, z: 0 })
      },
      rotation: {
        type: Object,
        default: () => ({ x: 0, y: 0, z: 0 })
      },
      scale: {
        type: [Number, Object],
        default: 1
      }
    },
    mounted() {
      this.addToScene()
      this.updateTransform()
    },
    beforeDestroy() {
      this.removeFromScene()
    },
    watch: {
      position: {
        handler() {
          this.updateTransform()
        },
        deep: true
      },
      rotation: {
        handler() {
          this.updateTransform()
        },
        deep: true
      },
      scale: {
        handler() {
          this.updateTransform()
        },
        deep: true
      }
    },
    methods: {
      addToScene() {
        if (this.scene && this.obj) {
          this.scene.add(this.obj)
        }
      },
      removeFromScene() {
        if (this.scene && this.obj) {
          this.scene.remove(this.obj)
        }
      },
      updateTransform() {
        if (!this.obj) return
        
        // Update position
        if (this.position) {
          const { x = 0, y = 0, z = 0 } = this.position
          this.obj.position.set(x, y, z)
        }
        
        // Update rotation
        if (this.rotation) {
          const { x = 0, y = 0, z = 0 } = this.rotation
          this.obj.rotation.set(x, y, z)
        }
        
        // Update scale
        if (typeof this.scale === 'number') {
          this.obj.scale.set(this.scale, this.scale, this.scale)
        } else {
          const { x = 1, y = 1, z = 1 } = this.scale
          this.obj.scale.set(x, y, z)
        }
      }
    }
  }
  </script>