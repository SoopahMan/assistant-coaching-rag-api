import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import  BackButton  from '@/components/ui/back'

export default function AddUserForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [message, setMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  

  const navigate = useNavigate()

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)

    if (value.length < 8) {
      setPasswordError('Password minimal 8 karakter')
    } else {
      setPasswordError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (passwordError) {
      setMessage(passwordError)
      return
    }

    try {
      const response = await fetch('http://localhost:8000/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ username, password, role }),
      })

      if (!response.ok) {
        const err = await response.json()
        if (err.detail && err.detail.includes('already exists')) {
          throw new Error('Username sudah digunakan, silakan pilih yang lain.')
        }
        throw new Error(err.detail || 'Username sudah digunakan, silakan pilih yang lain.')
      }

      const data = await response.json()
      setMessage(`User ${data.username} berhasil dibuat dengan role ${data.role}`)

      setUsername('')
      setPassword('')
      setRole('user')

      setTimeout(() => {
        navigate('/admin/user-management')
      }, 1000)

    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
<div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
  <form 
  onSubmit={handleSubmit} 
  className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md space-y-5"
  >
  <h2 className="text-2xl font-bold text-center text-gray-700">
    Tambah User
  </h2>
  <p className="text-sm text-center text-gray-500 mb-6">
    Silakan isi detail di bawah ini
  </p>

  <input
    type="text"
    placeholder="Username"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    className="w-full p-3 border border-gray-300 rounded-lg 
               focus:ring-2 focus:ring-blue-400 focus:outline-none"
    required
  />

  <div className="relative">
    <input
      type={showPassword ? 'text' : 'password'}
      placeholder="Password"
      value={password}
      onChange={handlePasswordChange}
      className="w-full p-3 border border-gray-300 rounded-lg 
                 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      required
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 
                 text-gray-600 text-sm"
    >
      {showPassword ? '🙈' : '👁️'}
    </button>
    {passwordError && (
      <p className="text-red-500 text-xs mt-1">{passwordError}</p>
    )}
  </div>

  <select
    value={role}
    onChange={(e) => setRole(e.target.value)}
    className="w-full p-3 border border-gray-300 rounded-lg 
               focus:ring-2 focus:ring-blue-400 focus:outline-none"
  >
    <option value="user">User</option>
    <option value="admin">Admin</option>
  </select>

  <button 
    type="submit" 
    className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium 
               hover:bg-blue-600 transition-colors duration-200"
  >
    Add User
  </button>

  {message && (
    <p className="mt-3 text-center text-sm text-red-500">{message}</p>
  )}

  <BackButton/>
</form>

</div>

  )
}

