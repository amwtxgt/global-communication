/**
 * 全局通信系统 - 预加载脚本
 * 
 * 该模块作为 Electron 预加载脚本，负责：
 * 1. 建立渲染进程与主进程之间的通信桥梁
 * 2. 提供安全的 IPC 通信接口
 * 3. 管理渲染进程的生命周期
 * 
 * @author 黄敏
 * @created 2021-12-19
 */

//ipc客户端
import {ipcRenderer, contextBridge} from 'electron'

/**
 * IPC 通信接口定义
 * 定义了渲染进程与主进程之间的通信方法
 */
export interface GcHandle {
  /** 移除指定渲染进程的客户端 */
  removeClient: (webContentId: number) => void
  
  /** 注册消息接收处理函数 */
  onmessage: (on: (topic: string, ...message: any) => void) => void
  
  /** 发送消息到所有订阅者 */
  send: (topic: string, ...message: any) => void

  /** 发送消息到主进程 */
  sendMain: (topic: string, ...message: any) => void
  
  /** 订阅指定主题 */
  subscribes: (tipics: string[], webContentId: number) => void
  
  /** 取消订阅指定主题 */
  unsubscribes: (tipics: string[], webContentId: number) => void
  
  /** 获取当前渲染进程的 ID */
  getWebContentId: () => number
}

/**
 * IPC 通信处理对象
 * 实现了与主进程通信的所有方法
 */
const gcHandle: GcHandle = {
  /**
   * 获取当前渲染进程的 ID
   * @returns {number} 渲染进程 ID
   */
  getWebContentId: () => ipcRenderer.sendSync('$ipc/webContentId/get'),
  
  /**
   * 移除指定渲染进程的客户端
   * @param {number} webContentId - 要移除的渲染进程 ID
   */
  removeClient: webContentId => ipcRenderer.send('$ipc/remove/client', webContentId),
  
  /**
   * 注册消息接收处理函数
   * @param {Function} on - 消息处理回调函数
   */
  onmessage: (on: (topic: string, ...message: any) => void) => {
    ipcRenderer.on('$ipc/message', (event, topic, ...message) => {
      on(topic, ...message)
    })
  },
  
  /**
   * 发送消息到所有订阅者
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   */
  send: (topic, ...message) => ipcRenderer.send('$ipc/send', topic, ...message),
  
  /**
   * 发送消息到主进程
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   */
  sendMain: (topic, ...message) => ipcRenderer.send('$ipc/sendmain', topic, ...message),
  
  /**
   * 订阅指定主题
   * @param {string[]} tipics - 要订阅的主题列表
   * @param {number} webContentId - 订阅的渲染进程 ID
   */
  subscribes: (tipics, webContentId) => ipcRenderer.send('$ipc/subscribes', tipics, webContentId),
  
  /**
   * 取消订阅指定主题
   * @param {string[]} tipics - 要取消订阅的主题列表
   * @param {number} webContentId - 取消订阅的渲染进程 ID
   */
  unsubscribes: (tipics, webContentId) => ipcRenderer.send('$ipc/unsubscribes', tipics, webContentId)
}

// 声明全局类型
declare global {
  var _gc_: Readonly<GcHandle>
}

// 将通信接口暴露到渲染进程的 window 对象中
contextBridge.exposeInMainWorld('_gc_', gcHandle)

// 设置全局变量
globalThis._gc_ = gcHandle

export default gcHandle
