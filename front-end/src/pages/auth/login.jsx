import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiUrl from '@/config/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login as setAuth } from '@/helpers/auth'  // ganti nama biar tidak tabrakan


const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate() 

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const res = await apiUrl.post('/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    const { access_token, username: uname, role, expires_at } = res.data

    setAuth(access_token, { username: uname, role, expires_at })

    if (onLogin) {
      onLogin({ username: uname, role })
    }

    if (role === 'admin') {
      navigate('/home-admin', { replace: true })
    } else if (role === 'user') {
      navigate('/home-user', { replace: true })
    } else {
      navigate('/unauthorized', { replace: true })
    }
  } catch (err) {
    const msg = err?.response?.data?.detail || 'Incorrect username or password'
    setError(msg)
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px] shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username">Username </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="password">Password </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
