<template>
    <div style="display: none">
      <slot></slot>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ThreeScene',
    props: {
      obj: {
        type: Object,
        required: true
      }
    },
    provide() {
      return {
        scene: this.obj
      }
    }
  }
  </script>