
/**
 * 判断 HTTP 状态码是否表示成功
 * @param status HTTP 状态码
 * @returns 如果状态码在 200-299 之间或等于 304(Not Modified)则返回 true，否则返回 false
 */
export function isHttpSuccess(status:number){
  const isSuccessCode=status >=200 && status <300
  return isSuccessCode || status === 304
}