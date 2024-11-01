

export function isHttpSuccess(status:number){
  const isSuccessCode=status>=200 && status <300
  return isSuccessCode || status === 304
}
