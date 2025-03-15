<template>
    <div style="display: none"></div>
  </template>
  
  <script>
  export default {
    name: 'ThreeCamera',
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
      this.updateCamera()
    },
    watch: {
      position: {
        handler() {
          this.updateCamera()
        },
        deep: true
      }
    },
    methods: {
      updateCamera() {
        if (!this.obj) return
        
        const { x, y, z } = this.position
        this.obj.position.set(x, y, z)
      }
    }
  }
  </script>