<template>
    <div style="display: none"></div>
  </template>
  
  <script>
  export default {
    name: 'ThreeAnimation',
    inject: ['scene'],
    props: {
      fn: {
        type: Function,
        required: true
      }
    },
    data() {
      return {
        animationId: null
      }
    },
    mounted() {
      this.startAnimation()
    },
    beforeDestroy() {
      this.stopAnimation()
    },
    methods: {
      animate() {
        if (this.fn) {
          this.fn()
        }
        this.animationId = requestAnimationFrame(this.animate)
      },
      startAnimation() {
        this.animate()
      },
      stopAnimation() {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId)
          this.animationId = null
        }
      }
    }
  }
  </script>