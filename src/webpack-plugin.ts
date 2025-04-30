import { Compiler, Compilation, sources } from 'webpack'

interface Options {
  // 插件配置选项
}

export class GlobalCommunicationWebpackPlugin {
  private options: Options

  constructor(options: Options = {}) {
    this.options = options
  }
  
  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('GlobalCommunicationWebpackPlugin', (compilation: Compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'GlobalCommunicationWebpackPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          for (const [filename, source] of Object.entries(assets)) {
            // 跳过非 JavaScript 文件
            if (!filename.endsWith('.js')) continue

            const content = source.source().toString()

            // 处理主进程文件
            if (filename.includes('main') || filename.includes('electron-main')) {
              const newContent = content.replace(
                /import\s+gc\s+from\s+['"]global-communication['"]/g,
                'import gc from "global-communication/main"'
              )
              compilation.updateAsset(filename, new sources.RawSource(newContent))
            }

            // 处理预加载脚本
            if (filename.includes('preload')) {
              const newContent = content.replace(
                /import\s+gc\s+from\s+['"]global-communication['"]/g,
                'import gc from "global-communication/preload"'
              )
              compilation.updateAsset(filename, new sources.RawSource(newContent))
            }

            // 处理渲染进程文件
            if (filename.includes('renderer') || filename.includes('src/renderer')) {
              const newContent = content.replace(
                /import\s+gc\s+from\s+['"]global-communication['"]/g,
                'import gc from "global-communication/renderer"'
              )
              compilation.updateAsset(filename, new sources.RawSource(newContent))
            }

            // 处理 Vue 组件
            if (filename.includes('.vue')) {
              const newContent = content.replace(
                /import\s+{\s*useGc\s*}\s+from\s+['"]global-communication['"]/g,
                'import { useGc } from "global-communication/vue"'
              )
              compilation.updateAsset(filename, new sources.RawSource(newContent))
            }
          }
        }
      )
    })
  }
}

export default GlobalCommunicationWebpackPlugin 