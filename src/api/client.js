import axios from 'axios'

const client = axios.create({ baseURL: '/api', timeout: 10000 })

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || '请求失败'
    return Promise.reject(new Error(msg))
  }
)

export default client
