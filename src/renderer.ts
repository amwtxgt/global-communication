/**
 * 全局通信系统 - 渲染进程模块
 * 
 * 该模块提供了在渲染进程中进行进程间通信的功能，包括：
 * 1. 主题订阅和取消订阅
 * 2. 消息发送和接收
 * 3. 进程间通信管理
 * 
 * 使用示例：
 * ```typescript
 * // 订阅主题
 * gc.on('topic-name', (message) => {
 *   console.log('收到消息:', message);
 * });
 * 
 * // 发送消息
 * gc.send('topic-name', '消息内容');
 * 
 * // 批量订阅
 * gc.subscribes({
 *   'topic1': (msg) => console.log(msg),
 *   'topic2': (msg) => console.log(msg)
 * });
 * //发送消息到当前页面，只有当前页面能收到通知，性能最好
 * gc.sendCurrent('topic-name', '消息内容');
 * ```
 */

//在渲染器进程 (网页) 中。
/*
 * mqtt 渲染端处理
 * */

/*
 * 主题订阅映射表
 * 键：表示已经订阅的主题
 * 值：是一个数组，存储该主题对应的回调函数
 */
const topics: {[topic: string]: Function[]} = {}

//当前渲染层id
const webContentId: number = globalThis._gc_?globalThis._gc_.getWebContentId():1

/**
 * 渲染进程通信接口
 * 扩展了基础的 Client 接口，添加了消息分拣功能
 */
interface RendererClient extends Client {
  sortingMessages(topic: string, ...msg: any): void
}

/**
 * 全局通信对象
 * 提供了完整的进程间通信功能
 */
const gc: RendererClient = {
  /**
   * 消息分拣处理
   * 将接收到的消息分发给对应主题的所有订阅者
   * 
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   */
  async sortingMessages(topic: string, ...message: any) {
    process.env.NODE_ENV === 'development' && console.warn('%c收到fgc: ' + topic, 'background:#3F6FFB;color:#fff', ...message)

    //获取订阅主题的数量
    let funs: Function[] = []

    //直接配置
    if (topics[topic] && topics[topic].length) {
      funs = funs.concat(topics[topic])
    }

    if (!funs.length) {
      process.env.NODE_ENV === 'development' && console.warn('%c没有订阅该主题: ' + topic, 'background:#E86C5D;color:#fff')
      return
    }

    if (funs.length) {
      funs.forEach(func => {
        typeof func === 'function' && func(...message)
      })
    }
  },

  /**
   * 发送本地消息
   * 只会通知本机的订阅者
   * 
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   */
  send(topic, ...message) {
    _gc_.send(topic, ...message)
  },

  /**
   * 发送消息到主进程
   * 
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   */
  sendMain(topic, ...message) {
    _gc_.sendMain(topic, ...message)
  },

  /**
   * 发送消息到指定渲染进程
   * 注意：在渲染进程中此方法不起作用
   * 
   * @param {number} webConents - 目标渲染进程ID
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   */
  sendToWebContents(webConents, topic, ...message) {
    _gc_.send(topic, ...message)
  },

  /**
   * 发送消息到当前进程
   * 只有当前页面能收到通知，性能最好
   * 
   * @param {string} topic - 消息主题
   * @param {any} message - 消息内容
   */
  sendCurrent(topic, ...message) {
    gc.sortingMessages(topic, ...message)
  },

  /**
   * 订阅主题
   * 
   * @param {string} topicName - 要订阅的主题名称
   * @param {Function} cb - 消息回调函数
   * @param {boolean} noSendSub - 是否不向主进程发送订阅请求
   */
  on(topicName, cb, noSendSub) {
    if (!noSendSub) {
      _gc_.subscribes([topicName], webContentId)
    }

    let topic = topics[topicName]
    if (topic) {
      //对比两个函数是否一样
      let isRepetition = topic.some(v => v === cb)

      //把执行函数加到对应的主题上
      if (!isRepetition) {
        topic.push(cb)
      }
    } else {
      //把执行函数加到对应的主题上
      topics[topicName] = [cb]
    }
  },

  /**
   * 批量订阅主题
   * 
   * @param {Object} subs - 订阅配置对象
   * @example
   * gc.subscribes({
   *   'topic1': (msg) => console.log(msg),
   *   'topic2': (msg) => console.log(msg)
   * });
   */
  subscribes(subs) {
    let tops = Object.keys(subs) //主题数组
    _gc_.subscribes(tops, webContentId)
    for (let i in subs) {
      let fun = subs[<IpcTopic>i]
      if (fun) gc.on(i, fun, true)
    }
  },

  /**
   * 取消订阅主题
   * 
   * @param {Object} subs - 要取消的订阅配置
   * @example
   * gc.unsubscribes({
   *   'topic1': callbackFunction
   * });
   */
  unsubscribes(subs: Partial<Subscribes>) {
    //存放需要取消订阅的主题
    //不是所有的主题都要取消订阅，有些主题可能存在多个function,
    //只有剩下一个function的时候，才是真正取消订阅
    let unSubList: string[] = []

    for (let i in subs) {
      if (topics[i]) {
        let topic = topics[i]

        if (topic.length > 1) {
          topic.some((v, index) => {
            if (v === subs[<IpcTopic>i]) {
              topic.splice(index, 1)
              return true
            }
          })
        } else if (topic.length === 1 && topic[0] === subs[<IpcTopic>i]) {
          unSubList.push(i)
          delete topics[i]
        }
      } else {
        unSubList.push(i)
      }
    }

    if (unSubList.length) _gc_.unsubscribes(unSubList, webContentId)
  }
}

if(globalThis._gc_){
  //自动向父组件注册该渲染层，使该渲染层能收到通知
  _gc_.onmessage((topic: string, ...message: any) => {
    gc.sortingMessages(topic, ...message)
  })

  window.addEventListener('unload', () => {
    _gc_.removeClient(webContentId)
  })

}

export default gc
