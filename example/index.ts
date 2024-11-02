import { createRequest, createFlatRequest, BACKEND_ERROR_CODE, REQUEST_ID_KEY } from '../src/axios/index'

type Response<T = unknown> = {
  code: string
  msg: string
  data: T
}

type DemoResponse<T = unknown> = {
  status: string
  message: string
  result: T
}

interface RequestInstanceState {
  refreshTokenFn: Promise<boolean> | null
  errMsgStack: string[]
}

export const request = createFlatRequest<Response, RequestInstanceState>(
  {
    baseURL: 'xxx',
    headers: {
      token: 'xxx'
    }
  },
  {
    async onRequest(config) {
      // 添加一些额外信息
      const token = localStorage.get('token')
      Object.assign(config.headers, { token })
      return config
    },
    isBackendSuccess(response) {
      // 自定义后端返回什么code算是请求成功
      return Number(response.data.code) === (200 || 300 || 400 || 500)
    },
    async onBackendFail(response, instance) {
      // 接口返回错误后的一些处理
      return null
    },
    transformBackendResponse(response) {
      // 转换后端返回的数据
      return response.data.data
    },
    onError(error) {
      // 接口错误后的一些处理
    }
  }
)

export const demoRequest = createRequest<DemoResponse>(
  {
    baseURL: 'xxx'
  },
  {
    async onRequest(config) {
      const { headers } = config;

      // set token
      const token = localStorage.get('token');
      const Authorization = token ? `Bearer ${token}` : null;
      Object.assign(headers, { Authorization });

      return config;
    },
    isBackendSuccess(response) {
      return response.data.status === '200';
    },
    async onBackendFail(_response) {

    },
    transformBackendResponse(response) {
      return response.data.result;
    },
    onError(error) {

    }
  }
)