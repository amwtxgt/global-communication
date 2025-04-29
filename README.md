# Global Communication

Electron 全局通信系统，支持主进程和渲染进程之间的消息通信。

## 安装

```bash
npm install global-communication
```

## 快速开始

### 1. Vite 项目配置

在 `vite.config.ts` 中：

```typescript
import { defineConfig } from 'vite'
import globalCommunication from 'global-communication/vite-plugin'

export default defineConfig({
  plugins: [
    globalCommunication()
  ]
})
```

### 2. Webpack 项目配置

在 `webpack.config.js` 中：

```javascript
const { GlobalCommunicationWebpackPlugin } = require('global-communication/webpack-plugin')

module.exports = {
  plugins: [
    new GlobalCommunicationWebpackPlugin()
  ]
}
```

### 3. 使用示例

现在你可以在任何文件中直接导入 `global-communication`，插件会自动处理正确的导入路径：

```typescript
// 在任何文件中
import gc from 'global-communication'

// 在 Vue 组件中
import { useGc } from 'global-communication'

// 使用方式保持不变
gc.on('topic-name', (message) => {
  console.log('收到消息:', message)
})

gc.send('topic-name', '消息内容')
```

### 4. Vue 组件中使用

```typescript
import { useGc } from 'global-communication'

export default {
  setup() {
    const { reset, clear } = useGc({
      'topic1': (msg) => console.log(msg),
      'topic2': (msg) => console.log(msg)
    })

    // 动态更新订阅
    const updateSubs = () => {
      reset({
        'new-topic': (msg) => console.log(msg)
      })
    }

    return { updateSubs }
  }
}
```

## API 文档

### 主进程 API

#### gc.send(topic: string, ...message: any)
发送消息到所有订阅者。

#### gc.sendMain(topic: string, ...message: any)
发送消息到主进程的订阅者。

#### gc.sendToWebContents(webContentId: number, topic: string, ...message: any)
发送消息到指定的渲染进程。

#### gc.on(topic: string, callback: Function)
订阅主题。

#### gc.subscribes(subs: Object)
批量订阅主题。

#### gc.unsubscribes(subs: Object)
取消订阅主题。

### 渲染进程 API

#### gc.send(topic: string, ...message: any)
发送消息到所有订阅者。

#### gc.sendMain(topic: string, ...message: any)
发送消息到主进程。

#### gc.sendCurrent(topic: string, ...message: any)
发送消息到当前进程（性能最好）。

#### gc.on(topic: string, callback: Function, noSendSub?: boolean)
订阅主题。

#### gc.subscribes(subs: Object)
批量订阅主题。

#### gc.unsubscribes(subs: Object)
取消订阅主题。

### Vue 集成 API

#### useGc(subs?: Object)
在 Vue 组件中使用全局通信。

返回对象包含：
- `reset(newSubs?: Object)`: 重置订阅内容
- `clear()`: 清理所有订阅

## 注意事项

1. 确保在主进程中正确配置了预加载脚本
2. 在渲染进程中，通信接口通过 `_gc_` 全局变量访问
3. 使用 Vue 集成时，组件卸载时会自动取消订阅
4. 发送消息时，确保目标进程已经订阅了相应的主题

## 许可证

MIT 