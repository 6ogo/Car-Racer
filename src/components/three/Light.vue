<template>
    <div style="display: none"></div>
  </template>
  
  <script>
  export default {
    name: 'ThreeLight',
    inject: ['scene'],
    props: {
      obj: {
        type: Object,
        required: true
      },
      position: {
        type: Object,
        default: () => ({ x: 0, y: 0, z: 0 })
      }
    },
    mounted() {
      this.addToScene()
      this.updateLight()
    },
    beforeDestroy() {
      this.removeFromScene()
    },
    watch: {
      position: {
        handler() {
          this.updateLight()
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
      updateLight() {
        if (!this.obj) return
        
        if (this.position) {
          const { x = 0, y = 0, z = 0 } = this.position
          this.obj.position.set(x, y, z)
        }
      }
    }
  }
  </script>