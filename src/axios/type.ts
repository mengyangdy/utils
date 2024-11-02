import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios"


export type ContentType = 'text/html' | 'text/plain' | 'multipart/form-data' | 'application/json' | 'application/x-www-form-urlencoded' | 'application/octet-stream'

interface ResponseMap {
  blob: Blob;
  text: string;
  arrayBuffer: ArrayBuffer;
  stream: ReadableStream<Uint8Array>;
  document: Document;
}

export type ResponseType = keyof ResponseMap | 'json'

export interface RequestOption<ResponseData = any> {
  /**
   * 请求前的钩子
   *
   * 例如：你可以在这个钩子中添加Headers中的token
   *
   * @param config Axios配置
   */
  onRequest: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>
  /**
     * 检查后端响应是否成功的钩子
     *
     * @param response Axios响应
     */
  isBackendSuccess: (response: AxiosResponse<ResponseData>) => boolean
  /**
     * 后端请求失败后的钩子
     *
     * 例如：你可以在这个钩子中处理过期的令牌
     *
     * @param response Axios响应
     * @param instance Axios实例
     */
  onBackendFail: (response: AxiosResponse<ResponseData>, instance: AxiosInstance) => Promise<AxiosResponse | null> | Promise<void>
  /**
   * 当响应类型为json时转换后端响应
   *
   * @param response Axios响应
   */
  transformBackendResponse(response: AxiosResponse<ResponseData>): any | Promise<any>
  /**
     * 处理错误的钩子
     *
     * 例如：你可以在这个钩子中显示错误消息
     *
     * @param error
     */
  onError: (error: AxiosError<ResponseData>) => void | Promise<void>
}

export interface RequestInstanceCommon<T> {
  /**
  * 通过请求ID取消请求
  *
  * 如果请求从配置中提供了中止控制器的标志，则它不会被收集到中止控制器映射中
  *
  * @param requestId 请求ID
  */
  cancelRequest: (requestId: string) => void
  /**
     * 取消所有请求
     *
     * 如果请求从配置中提供了中止控制器的标志，则它不会被收集到中止控制器映射中
     */
  cancelAllRequest: () => void
  /** 你可以在请求实例中设置自定义状态 */
  state: T
}

export type MappedType<R extends ResponseType, JsonType = any> = R extends keyof ResponseMap
  ? ResponseMap[R]
  : JsonType;

export type CustomAxiosRequestConfig<R extends ResponseType = 'json'> = Omit<AxiosRequestConfig, 'responseType'> & {
  responseType?: R
}

export interface RequestInstance<S = Record<string, unknown>> extends RequestInstanceCommon<S> {
  <T = any, R extends ResponseType = 'json'>(config: CustomAxiosRequestConfig<R>): Promise<MappedType<R, T>>
}

export type FlatResponseSuccessData<T = any, ResponseData = any> = {
  data: T
  error: null,
  response: AxiosResponse<ResponseData>
}

export type FlatResponseFailData<ResponseData = any> = {
  data: null
  error: AxiosError<ResponseData>
  response: AxiosResponse<ResponseData>
}

export type FlatResponseData<T = any, ResponseData = any> =
  | FlatResponseSuccessData<T, ResponseData>
  | FlatResponseFailData<ResponseData>;

export interface FlatRequestInstance<S = Record<string, unknown>, ResponseData = any> extends RequestInstanceCommon<S> {
  <T = any, R extends ResponseType = 'json'>(
    config: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>, ResponseData>>;
}