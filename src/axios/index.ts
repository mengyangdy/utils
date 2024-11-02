import axios, { AxiosError } from "axios"
import type { AxiosResponse, CreateAxiosDefaults, InternalAxiosRequestConfig } from "axios"
import { CustomAxiosRequestConfig, FlatRequestInstance, MappedType, RequestInstance, RequestOption, ResponseType } from "./type"
import { createAxiosConfig, createDefaultOptions, createRetryOptions } from "./options"
import axiosRetry from "axios-retry"
import { nanoid } from "nanoid"
import { REQUEST_ID_KEY, BACKEND_ERROR_CODE } from "./constant"



function createCommonRequest<ResponseData = any>(
  axiosConfig?: CreateAxiosDefaults,
  options?: Partial<RequestOption<ResponseData>>
) {
  const opts = createDefaultOptions<ResponseData>(options)
  const axiosConf = createAxiosConfig(axiosConfig)
  const instance = axios.create(axiosConf)

  const abortControllerMap = new Map<string, AbortController>()

  // axios 配置 重试
  const retryOptions = createRetryOptions(axiosConf)
  axiosRetry(instance, retryOptions)

  // 请求拦截器
  instance.interceptors.request.use(conf => {
    const config: InternalAxiosRequestConfig = { ...conf }

    // 设置请求id
    const requestId = nanoid()
    config.headers.set(REQUEST_ID_KEY, requestId)

    // 配置中止控制器
    if (!config.signal) {
      const abortController = new AbortController()
      config.signal = abortController.signal
      abortControllerMap.set(requestId, abortController)
    }

    // 通过钩子处理配置
    const handlerConfig = opts.onRequest?.(config) || config

    return handlerConfig
  })

  // 响应拦截器
  instance.interceptors.response.use(
    async response => {
      const responseType: ResponseType = (response.config?.responseType as ResponseType) || 'json'

      if (responseType !== 'json' || opts.isBackendSuccess(response.data)) {
        return Promise.resolve(response)
      }

      const fail = await opts.onBackendFail(response, instance)
      if (fail) {
        return fail
      }

      const backendError = new AxiosError<ResponseData>(
        'the backend request error',
        BACKEND_ERROR_CODE,
        response.config,
        response.request,
        response
      )

      await opts.onError(backendError)

      return Promise.reject(backendError)
    },
    async (error: AxiosError<ResponseData>) => {
      await opts.onError(error)
      return Promise.reject(error)
    }
  )

  /**
   * 取消指定请求ID的网络请求
   * @param requestId - 请求的唯一标识符，通过nanoid生成的字符串
   * @description 
   * - 通过请求ID从 abortControllerMap 中获取对应的 AbortController
   * - 如果找到对应的控制器，则中止请求并从 Map 中删除该控制器
   */
  function cancelRequest(requestId: string) {
    const abortController = abortControllerMap.get(requestId)
    if (abortController) {
      abortController.abort()
      abortControllerMap.delete(requestId)
    }
  }

  /**
     * 取消所有正在进行的网络请求
     * @description
     * - 遍历 abortControllerMap 中的所有 AbortController
     * - 调用每个控制器的 abort() 方法来中止请求
     * - 最后清空 abortControllerMap
     */
  function cancelAllRequest() {
    abortControllerMap.forEach(abortController => {
      abortController.abort()
    })
    abortControllerMap.clear()
  }

  return {
    instance,
    opts,
    cancelRequest,
    cancelAllRequest
  }
}

/**
 * 创建一个自定义的请求实例
 * @template ResponseData - 后端响应数据的类型
 * @template State - 请求实例状态的类型
 * @param {CreateAxiosDefaults} [axiosConfig] - axios 的配置选项
 * @param {Partial<RequestOption<ResponseData>>} [options] - 自定义请求选项
 * @returns {RequestInstance<State>} 返回一个增强的请求实例，包含以下功能：
 * - 请求取消功能 (cancelRequest, cancelAllRequest)
 * - 状态管理 (state)
 * - 自动类型转换
 * - 响应类型处理
 */
export function createRequest<ResponseData = any, State = Record<string, unknown>>(
  axiosConfig?: CreateAxiosDefaults,
  options?: Partial<RequestOption<ResponseData>>
) {
  const { instance, opts, cancelRequest, cancelAllRequest } = createCommonRequest<ResponseData>(axiosConfig, options)

  const request: RequestInstance<State> = async function request<T = any, R extends ResponseType = 'json'>(config: CustomAxiosRequestConfig) {
    const response: AxiosResponse<ResponseData> = await instance(config)

    const responseType = response.config?.responseType || 'json'

    if (responseType === 'json') {
      return opts.transformBackendResponse(response)
    }
    return response.data as MappedType<R, T>
  } as RequestInstance<State>
  request.cancelRequest = cancelRequest
  request.cancelAllRequest = cancelAllRequest
  request.state = {} as State

  return request
}

/**
 * 创建一个扁平的请求实例
 * 
 * @param axiosConfig Axios配置，用于创建Axios实例
 * @param options 请求选项，用于配置请求的钩子和行为
 * @returns 返回一个扁平的请求实例，其响应数据为 { data: any, error: AxiosError }
 */
export function createFlatRequest<ResponseData = any, State = Record<string, unknown>>(axiosConfig?: CreateAxiosDefaults, options?: Partial<RequestOption<ResponseData>>) {
  const { instance, opts, cancelRequest, cancelAllRequest } = createCommonRequest<ResponseData>(axiosConfig, options)

  const flatRequest: FlatRequestInstance<State, ResponseData> = async function flatRequest<T = any, R extends ResponseType = 'json'>(config: CustomAxiosRequestConfig) {
    try {
      const response: AxiosResponse<ResponseData> = await instance(config)

      const responseType = response.config?.responseType || 'json'

      if (responseType === 'json') {
        const data = opts.transformBackendResponse(response)

        return {
          data,
          error: null,
          response
        }
      }
      return {
        data: response.data as MappedType<R, T>,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error,
        response: (error as AxiosError<ResponseData>).response
      }
    }
  } as FlatRequestInstance<State, ResponseData>
  flatRequest.cancelRequest = cancelRequest
  flatRequest.cancelAllRequest = cancelAllRequest
  flatRequest.state = {} as State

  return flatRequest
}

export { BACKEND_ERROR_CODE, REQUEST_ID_KEY }

export type * from './type'
export type { CreateAxiosDefaults, AxiosError }