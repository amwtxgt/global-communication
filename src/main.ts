/**
 * 全局通信系统 - 主进程模块
 * 
 * 该模块作为 Electron 主进程的通信核心，负责：
 * 1. 管理所有渲染进程的订阅关系
 * 2. 处理消息的转发和分发
 * 3. 提供主进程的订阅和发布功能
 * 
 * 使用示例：
 * ```typescript
 * // 在主进程中订阅主题
 * gc.on('topic-name', (message) => {
 *   console.log('收到消息:', message);
 * });
 * 
 * // 发送消息到所有订阅者
 * gc.send('topic-name', '消息内容');
 * 
 * // 发送消息到指定渲染进程，在渲染进程中不起作用
 * gc.sendToWebContents(webContentId, 'topic-name', '消息内容');
 * ```
 */

import {ipcMain, webContents, IpcMainEvent} from 'electron'
import { Client, Subscribes } from './gc'

class IpcMain implements Client {
  /**
   * 渲染进程订阅的主题映射
   * 键：主题名称
   * 值：订阅该主题的渲染进程 ID 数组
   */
  rendererTopics: {
    [topic: string]: number[]
  } = {}

  /**
   * 主进程订阅的主题映射
   * 键：主题名称
   * 值：该主题对应的回调函数数组
   */
  mainSubTopics: {
    [topic: string]: Function[]
  } = {}

  /**
   * 自动生成的 ID 计数器
   * 用于生成唯一的渲染进程 ID
   */
  autoId: number = 1

  	/**
	 * 一维数组去重
	 * @param  {Array} arr  一维数组
	 * @return {any[]} 去重后的一维数组
	 * */
	arrayUnique<T>(arr: T[]): T[] {
		let res:T[] = []
		let json: any = {}
		for (let i = 0; i < arr.length; i++) {
			let key: any = arr[i]
			if (typeof arr[i] === 'object' && arr[i] != null) {
				key = JSON.stringify(arr[i])
			}
			if (!json[key] && arr[i]!==undefined) {
				res.push(arr[i])
				json[key] = true
			}
		}
		return res
	}

  /**
   * 构造函数
   * 初始化 IPC 事件监听
   */
  constructor() {
    //获取windowBrowser id
    ipcMain.on('$ipc/webContentId/get', (e: IpcMainEvent) => {
      e.returnValue = e.sender.id
    })

    //删除客户端
    ipcMain.on('$ipc/remove/client', (e: any, webContentId: number) => {
      //i 是主题
      for (let i in this.rendererTopics) {
        let index = this.rendererTopics[i].findIndex(id => webContentId === id)
        if (index > -1) {
          this.rendererTopics[i].splice(index, 1)

          if (this.rendererTopics[i].length === 0) {
            //当该主题已经没有id,直接取消订阅
            delete this.rendererTopics[i]
          }
        }
      }
    })

    /**
     * 处理渲染进程发送的消息
     * 将消息转发给所有订阅者
     */
    ipcMain.on('$ipc/send', (e: any, topic: string, ...message: any) => {
      this.send(topic, ...message)
    })

    /**
     * 处理发送到主进程的消息
     */
    ipcMain.on('$ipc/sendmain', (e: any, topic: string, ...message: any) => {
      this.sendMain(topic, ...message)
    })

    //renderer主题订阅
    ipcMain.on('$ipc/subscribes', (e: any, tops: string[], webContentId: number) => {
      tops.forEach(topic => {
        if (this.rendererTopics[topic]) {
          if (!this.rendererTopics[topic].includes(webContentId)) this.rendererTopics[topic].push(webContentId)
        } else {
          this.rendererTopics[topic] = [webContentId]
        }
      })
    })

    //取消renderer主题订阅
    ipcMain.on('$ipc/unsubscribes', (e: any, tops: string[], webContentId: number) => {
      tops.forEach(topic => {
        if (!this.rendererTopics[topic]) return
        let index = this.rendererTopics[topic].findIndex(id => id === webContentId)
        if (index > -1) {
          this.rendererTopics[topic].splice(index, 1)
        }
        if (this.rendererTopics[topic].length === 0) {
          delete this.rendererTopics[topic]
        }
      })
    })
  }

  /**
   * 发送消息到所有订阅者
   * 包括渲染进程和主进程的订阅者
   * 
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   * @param {any[]} arg - 额外的消息参数
   */
  send(topic: string, message?: any, ...arg: any) {
    try {
      //浏览器添加时的特殊处理
      if ('标签页新增' === topic && message instanceof Array) {
        message.forEach(u => {
          this.autoId++
          u.id = this.autoId
        })
      }

      //获取订阅主题的数量,
      let clientIds: number[] = []

      //直接配置的，没有通配符
      if (this.rendererTopics[topic] && this.rendererTopics[topic].length) {
        clientIds = clientIds.concat(this.rendererTopics[topic])
      }

      if (!clientIds.length && !this.rendererTopics[topic] && !this.mainSubTopics[topic]) {
        console.warn('gc 没有订阅该主题', topic)
        return
      }
      try {
        let str = typeof message !== 'object' ? String(message) : JSON.stringify(message)

        console.warn('gc通知', topic, str.length > 50 ? str.substring(0, 50) + '...' : str) // message ?? '', ...arg
      } catch (e) {}

      clientIds = this.arrayUnique(clientIds)

      clientIds.forEach(id => {
        let webc = webContents.fromId(id)
        webc && webc.send('$ipc/message', topic, message, ...arg)
      })

      //主程序主题
      this.sendMain(topic, message, ...arg)
    } catch (e) {
      console.error('错误了', e)
    }
  }

  /**
   * 发送消息到指定的渲染进程
   * 
   * @param {number} webContactId - 目标渲染进程 ID
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   */
  sendToWebContents(webContactId: number, topic: string, message?: any) {
    //是否有订阅该主题
    //主题是否有包含webContactId
    if (this.rendererTopics[topic] && this.rendererTopics[topic].length && this.rendererTopics[topic].includes(webContactId)) {
      let webc = webContents.fromId(webContactId)
      webc && webc.send('$ipc/message', topic, message)
    }
  }

  /**
   * 发送消息到主进程的订阅者
   * 
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   * @param {any[]} arg - 额外的消息参数
   */
  sendMain(topic: string, message?: any, ...arg: any) {
    //主程序主题
    if (this.mainSubTopics[topic]) {
      this.mainSubTopics[topic].forEach(cb => cb(message, ...arg))
    }
  }

  /**
   * 发送消息到当前进程
   * 实际上是发送到主进程的订阅者
   * 
   * @param {string} topic - 消息主题
   * @param {any[]} message - 消息内容
   */
  sendCurrent(topic: string, ...message: any) {
    this.sendMain(topic, ...message)
  }

  /**
   * 订阅主题
   * 
   * @param {string} topic - 要订阅的主题
   * @param {Function} param - 消息处理回调函数
   */
  on<T extends string>(topic: T, param: T extends keyof Subscribes ? Subscribes[T] : (...p: any[]) => void) {
    if (this.mainSubTopics[topic]) {
      this.mainSubTopics[topic].push(param)
    } else {
      this.mainSubTopics[topic] = [param]
    }
  }

  /**
   * 批量订阅主题
   * 
   * @param {Object} subs - 订阅配置对象
   */
  subscribes(subs: Partial<Subscribes>): void {
    for (let i in subs) {
      let fun = subs[<keyof Subscribes>i]

      if (fun) this.on(i, fun)
    }
  }

  /**
   * 取消订阅主题
   * 
   * @param {Object} subs - 要取消的订阅配置
   */
  unsubscribes(subs: Partial<Subscribes>): void {
    for (let i in subs) {
      if (this.mainSubTopics[i]) {
        let topic = this.mainSubTopics[i]

        if (topic.length > 1) {
          topic.some((v, index) => {
            if (v === subs[<keyof Subscribes>i]) {
              topic.splice(index, 1)
              return true
            }
          })
        } else if (topic.length === 1 && topic[0] === subs[<keyof Subscribes>i]) {
          delete this.mainSubTopics[i]
        }
      }
    }
  }
}

let gc = new IpcMain()

export default gc
