export function deepClone<T>(originValue: T, map = new WeakMap<object, any>()): T {
  function isObject(originValue: any) {
    return typeof originValue === 'object' && originValue !== null
  }

  // 如果是Symbol类型的
  if (typeof originValue === 'symbol') {
    return Symbol(originValue.description) as unknown as T
  }

  // 如果是原始类型 直接返回
  if (!isObject(originValue)) {
    return originValue as T
  }

  // 如果是时间
  if (originValue instanceof Date){
    return new Date(originValue) as unknown as T
  }
  // 如果是正则
  if (originValue instanceof RegExp) {
    return new RegExp(originValue) as unknown as T
  }

  // 如果是set类型
  if (originValue instanceof Set) {
    const newSet = new Set<T | object | string | number | boolean | bigint | symbol | undefined>()
    for (const setItem of originValue) {
      newSet.add(deepClone(setItem))
    }
    return newSet as unknown as T
  }

  // 如果是map类型
  if (originValue instanceof Map) {
    const newMap = new Map <any, any>()
    for (const [key, value] of originValue) {
      newMap.set(key, value)
    }
    return newMap as unknown as T
  }

  // 如果是函数类型 不要进行深拷贝
  if (typeof originValue === 'function') {
    return originValue as T
  }

  // 如果是对象类型 才需要创建

  //处理循环引用的问题
  if (map.get((originValue as object) )) {
    return map.get(originValue as object) as T
  }

  let newObj:any
  if(Array.isArray(originValue)){
    newObj = [] as unknown as T;
  }else{
    newObj = {} as unknown as T;
  }
  map.set((originValue as object), newObj)
  // 遍历普通的key
  for (const key in originValue) {
    newObj[key] = deepClone(originValue[key], map)
  }

  // for...in遍历不了Symbol的key
  // 需要单独处理
  const symbolKeys = Object.getOwnPropertySymbols(originValue)
  for (const symbolKey of symbolKeys) {
    // @ts-ignore
    newObj[Symbol(symbolKey.description)] = deepClone(originValue[symbolKey],map)
  }

  return newObj
}
