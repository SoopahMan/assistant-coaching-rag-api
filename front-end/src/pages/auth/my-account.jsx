import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/ui/back'


function MyAccount() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch('http://localhost:8000/me', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error('Failed to fetch user')

        const data = await response.json()
        setUser(data)
        setUsername(data.username || '')
        setRole(data.role || '')
      } catch (err) {
        console.error('Error fetch user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('access_token')
      const body = { username, role }
      if (password.trim()) body.password = password

      const response = await fetch(
        `http://localhost:8000/edit-users/${user.user_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) throw new Error('Failed to update')

      const updated = await response.json()
      setUser(updated)
      setPassword('') 
    } catch (err) {
      console.error('Update failed:', err)
      alert('Update gagal ❌')
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6">User not found</div>

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700">Role</label>
          <input
            type="text"
            value={role}
            disabled
            className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700">Password Baru</label>
          <div className="flex items-center border rounded-lg mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-l-lg focus:outline-none"
              placeholder="Isi jika ingin ubah password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="px-3 text-sm text-gray-600"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Update
          </Button>

          <BackButton />
        </div>

      </form>
    </div>
  )
}

export default MyAccount
