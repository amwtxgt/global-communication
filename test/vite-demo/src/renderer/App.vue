<template>
  <div class="app">
    <h1>Electron Vue App</h1>
    <button @click="openNewWindow">打开新窗口</button>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'

const openNewWindow = () => {
  ipcRenderer.send('open-new-window')
}
</script>

<style>
.app {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style> 