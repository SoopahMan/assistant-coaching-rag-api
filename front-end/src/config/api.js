import axios from 'axios'
import { notification } from 'antd'

const apiUrl = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})


apiUrl.interceptors.request.use((request) => {
  const accessToken = localStorage.getItem('access_token')
  if (accessToken) {
    request.headers.Authorization = `Bearer ${accessToken}`
    // request.headers.AccessToken = accessToken
  }
  return request
})

apiUrl.interceptors.response.use(undefined, (error) => {
  // Errors handling
  const { response } = error
  const { data } = response
  if (data.code && data.code === 401) {
    history.push('/auth/login')
  } else if (!data.payload) {
    notification.warning({
      message: 'Gagal',
      description: data.message,
    })
  } else {
    notification.warning({
      message: 'Gagal',
      description: data.payload,
    })
  }
})
export default apiUrl
