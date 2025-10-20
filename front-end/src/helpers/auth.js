// auth.js
import { jwtDecode } from 'jwt-decode'
export const login = (token, user) => {
  localStorage.setItem('access_token', token)
  localStorage.setItem('user', JSON.stringify(user)) 
}

export const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  const token = localStorage.getItem('access_token')

  if (!user || !token) return null

  const decoded = jwtDecode(token)
  const now = Date.now() / 1000

  if (decoded.exp && decoded.exp < now) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    return { expired: true }
  }
  return { ...JSON.parse(user), token, expired: false }
}

export const getToken = () => {
  return localStorage.getItem('access_token')
}


