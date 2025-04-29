/**
 * Vue 组件通信集成模块
 * 
 * 该模块提供了在 Vue 组件中使用全局通信系统的便捷方式，包括：
 * 1. 自动订阅和取消订阅管理
 * 2. 组件生命周期内的通信管理
 * 3. 动态更新订阅内容
 * 
 * 使用示例：
 * ```typescript
 * // 在组件 setup 中使用
 * import useGc from './vueSetup'
 * 
 * export default {
 *   setup() {
 *     const { reset, clear } = useGc({
 *       'topic1': (msg) => console.log(msg),
 *       'topic2': (msg) => console.log(msg)
 *     })
 * 
 *     // 动态更新订阅
 *     const updateSubs = () => {
 *       reset({
 *         'new-topic': (msg) => console.log(msg)
 *       })
 *     }
 * 
 *     return { updateSubs }
 *   }
 * }
 * ```
 */

import {onBeforeUnmount} from 'vue'
import renderer from './renderer'

/**
 * 订阅配置类型
 * 用于定义需要订阅的主题和对应的处理函数
 */
type Sub = Partial<Subscribes>

/**
 * Vue 组件通信集成函数
 * 提供在 Vue 组件中使用全局通信系统的便捷方式
 * 
 * @param {Sub} subs - 需要订阅的主题配置，如无订阅或取消订阅，可不传
 * @returns {Object} 返回包含重置和清理方法的对象
 */
export default (subs?: Sub) => {
  // 当前订阅配置
  let currentSubs: Sub = subs ?? {}

  // 初始订阅
  renderer.subscribes(currentSubs)

  // 组件卸载时自动取消订阅
  onBeforeUnmount(() => {
    renderer.unsubscribes(currentSubs)
  })

  return {
    /**
     * 重置订阅内容
     * 取消当前所有订阅，并订阅新的主题
     * 
     * @param {Sub} newSubs - 新的订阅配置，如无订阅或取消订阅，可不传
     */
    reset: (newSubs?: Sub) => {
      // 取消当前订阅
      renderer.unsubscribes(currentSubs)
      // 更新订阅配置
      currentSubs = newSubs ?? {}
      // 延迟执行新订阅，确保取消订阅已完成
      setTimeout(() => {
        renderer.subscribes(currentSubs)
      }, 10)
    },

    /**
     * 清理所有订阅
     * 取消当前组件的所有订阅
     */
    clear() {
      renderer.unsubscribes(currentSubs)
    }
  }
}
