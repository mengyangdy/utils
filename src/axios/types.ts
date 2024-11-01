import {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from "axios";

export interface RequestOption<ResponseData = any> {
  onRequest: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>
  isBackendSuccess: (response: AxiosResponse<ResponseData>) => boolean

  onBackendFail: (response: AxiosResponse<ResponseData>, instance: AxiosInstance) => Promise<AxiosResponse | null> | Promise<void>

  transformBackendResponse(response: AxiosResponse<ResponseData>): any | Promise<any>

  onError: (error: AxiosError<ResponseData>) => void | Promise<void>
}

interface ResponseMap {
  blob: Blob;
  text: string;
  arrayBuffer: ArrayBuffer;
  stream: ReadableStream<Uint8Array>;
  document: Document;
}
export type ResponseType=keyof ResponseMap | 'json'

export type MappedType<R extends ResponseType,JsonType = any>=R extends keyof ResponseMap?ResponseMap[R]:JsonType

export interface RequestInstanceCommon<T> {
  /**
   * cancel the request by request id
   *
   * if the request provide abort controller sign from config, it will not collect in the abort controller map
   *
   * @param requestId
   */
  cancelRequest: (requestId: string) => void;
  /**
   * cancel all request
   *
   * if the request provide abort controller sign from config, it will not collect in the abort controller map
   */
  cancelAllRequest: () => void;
  /** you can set custom state in the request instance */
  state: T;
}

export type CustomAxiosRequestConfig<R extends ResponseType = 'json'> = Omit<AxiosRequestConfig, 'responseType'> & {
  responseType?: R;
};

export interface RequestInstance<S = Record<string, unknown>> extends RequestInstanceCommon<S> {
  <T = any, R extends ResponseType = 'json'>(config: CustomAxiosRequestConfig<R>): Promise<MappedType<R, T>>;
}

export type FlatResponseSuccessData<T = any, ResponseData = any> = {
  data: T;
  error: null;
  response: AxiosResponse<ResponseData>;
};

export type FlatResponseFailData<ResponseData = any> = {
  data: null;
  error: AxiosError<ResponseData>;
  response: AxiosResponse<ResponseData>;
};

export type FlatResponseData<T = any, ResponseData = any> =
  | FlatResponseSuccessData<T, ResponseData>
  | FlatResponseFailData<ResponseData>

export interface FlatRequestInstance<S = Record<string, unknown>, ResponseData = any> extends RequestInstanceCommon<S> {
  <T = any, R extends ResponseType = 'json'>(
    config: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>, ResponseData>>;
}
