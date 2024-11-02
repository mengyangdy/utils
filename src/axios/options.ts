import { CreateAxiosDefaults } from "axios";
import { RequestOption } from "./type";
import { isHttpSuccess } from "./shared";
import { stringify } from "querystring";
import { IAxiosRetryConfig } from "axios-retry";

/**
 * 创建默认的请求选项
 * 
 * @param options 可选的请求选项部分，用于覆盖默认选项
 * @returns 返回完整的请求选项对象
 */
export function createDefaultOptions<ResponseData = any>(options?: Partial<RequestOption<ResponseData>>) {
  const opts: RequestOption<ResponseData> = {
    onRequest: async config => config,
    isBackendSuccess: _response => true,
    onBackendFail: async () => null,
    transformBackendResponse: async response => response.data,
    onError: async () => { }
  }

  Object.assign(opts, options)
  return opts
}

/**
 * 创建 Axios 配置对象
 * 
 * @param config 可选的配置选项，用于覆盖默认配置
 * @returns 返回完整的 Axios 配置对象
 */
export function createAxiosConfig(config?:Partial<CreateAxiosDefaults>){
  const TEN_SECONDS=10*1000
  const axiosConfig:CreateAxiosDefaults={
    timeout:TEN_SECONDS,
    headers:{
      'Content-Type':'application/json'
    },
    validateStatus:isHttpSuccess,
    paramsSerializer:params=>{
      return stringify(params)
    }
  }
  Object.assign(axiosConfig, config)
  return axiosConfig
}

/**
 * 创建重试配置选项
 * 
 * @param config 可选的配置选项，用于覆盖默认重试配置
 * @returns 返回完整的重试配置对象
 */
export function createRetryOptions(config?:Partial<CreateAxiosDefaults>){
  const retryConfig:IAxiosRetryConfig={
    retries:0
  }
  Object.assign(retryConfig,config)
  return retryConfig
}
