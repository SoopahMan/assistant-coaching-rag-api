import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

function EditUser({ user, onClose, onSave }) {
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setRole(user.role || '')
      setPassword('') 
    }
  }, [user])
  
  if (!user) return null

const handleSubmit = async (e) => {
  e.preventDefault()

  const body = {}
    if (username !== user.username) body.username = username
    if (role !== user.role) body.role = role
    if (password) body.password = password

    if (Object.keys(body).length === 0) {
        alert('Tidak ada perubahan data')
        return
    }

  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`http://localhost:8000/edit-users/${user.user_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(err)
    }

    const updatedUser = await response.json()
    onSave(updatedUser)
    onClose()
  } catch (error) {
    console.error('Update gagal:', error)
  }
}


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-40">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative z-50"> 
        <h2 className="text-xl font-semibold mb-4">Edit User</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm text-gray-700">New Password</label>
            <div className="flex items-center border rounded-lg px-3 mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2 outline-none"
                placeholder="Leave empty if not changing"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-sm text-blue-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUser
