/**
 * @用途 定义gc (全局通信 Global communication)
 * @作者 黄敏
 * @创建时间 2021-05-28 21:48
 **/

/*
 * 为gc的主题制定格式，
 * key是主题，值为参数，
 * */


 interface GcParams {

}

 type Subscribes = {
	[P in keyof GcParams]: (...param: [...GcParams[P]]) => void
}

 type IpcTopic = keyof GcParams

//gc通讯类
 interface Client {
	//发送消息

	on<T extends string>(topic: T, param: T extends keyof Subscribes ? Subscribes[T] : (...p: any[]) => void, noSendSub?: boolean): void

	send<T extends string>(topic: T, ...param: T extends IpcTopic ? GcParams[T] : [any, 'ignore']): void //|any[]

	//发送消息，但只发给主进程
	sendMain<T extends string>(topic: T, ...param: T extends keyof GcParams ? GcParams[T] : any[]): void

	//只在当前进程发送
	sendCurrent<T extends string>(topic: T, ...param: T extends keyof GcParams ? GcParams[T] : any[]): void

	//放送到指到窗口
	sendToWebContents<T extends string>(webContents: number, topic: T, param?: T extends keyof GcParams ? GcParams[T] : any): void

	//订阅
	subscribes(subs: Partial<Subscribes>): void

	//取消订阅
	unsubscribes(subs: Partial<Subscribes>): void
}
