<template>
    <div ref="container"></div>
  </template>
  
  <script>
  export default {
    name: 'ThreeRenderer',
    props: {
      obj: {
        type: Object,
        required: true
      },
      size: {
        type: Object,
        default: () => ({ w: window.innerWidth, h: window.innerHeight })
      }
    },
    data() {
      return {
        animationId: null,
        initialized: false
      }
    },
    watch: {
      size: {
        handler(newSize) {
          if (this.initialized && this.obj) {
            this.obj.setSize(newSize.w, newSize.h)
          }
        },
        deep: true
      }
    },
    mounted() {
      this.init()
    },
    beforeDestroy() {
      this.dispose()
    },
    methods: {
      init() {
        if (!this.obj) return
        
        const container = this.$refs.container
        container.appendChild(this.obj.domElement)
        
        this.obj.setSize(this.size.w, this.size.h)
        this.initialized = true
      },
      dispose() {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId)
        }
        
        // Clean up renderer resources
        if (this.obj) {
          this.obj.dispose()
        }
      }
    }
  }
  </script>
  
  <style scoped>
  div {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  </style>