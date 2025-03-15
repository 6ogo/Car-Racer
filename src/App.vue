<template>
    <div id="app">
      <router-view/>
    </div>
  </template>
  
  <script>
  export default {
    name: 'App'
  }
  </script>
  
  <style>
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    touch-action: none; /* Disable browser handling of all touch gestures */
  }
  
  body {
    font-family: 'Arial', sans-serif;
    background: #f7d9aa;
  }
  
  #app {
    height: 100%;
  }
  </style>