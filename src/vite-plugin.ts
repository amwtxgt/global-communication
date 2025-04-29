import { Plugin } from 'vite'

interface Options {
  // 插件配置选项
}

export default function globalCommunicationPlugin(options: Options = {}): Plugin {
  return {
    name: 'vite-plugin-global-communication',
    
    config(config) {
      // 确保 Electron 预加载脚本可以访问 Node.js API
      if (config.build?.rollupOptions?.input?.toString().includes('preload')) {
        return {
          build: {
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
      return {}
    },

    transform(code, id) {
      // 处理主进程文件
      if (id.includes('main') || id.includes('electron-main')) {
        return {
          code: code.replace(
            /import\s+gc\s+from\s+['"]global-communication['"]/,
            'import gc from "global-communication/main"'
          ),
          map: null
        }
      }

      // 处理预加载脚本
      if (id.includes('preload')) {
        return {
          code: code.replace(
            /import\s+gc\s+from\s+['"]global-communication['"]/,
            'import gc from "global-communication/preload"'
          ),
          map: null
        }
      }

      // 处理渲染进程文件
      if (id.includes('renderer') || id.includes('src/renderer')) {
        return {
          code: code.replace(
            /import\s+gc\s+from\s+['"]global-communication['"]/,
            'import gc from "global-communication/renderer"'
          ),
          map: null
        }
      }

      // 处理 Vue 组件
      if (id.includes('.vue')) {
        return {
          code: code.replace(
            /import\s+{\s*useGc\s*}\s+from\s+['"]global-communication['"]/,
            'import { useGc } from "global-communication/vue"'
          ),
          map: null
        }
      }

      return null
    }
  }
} 