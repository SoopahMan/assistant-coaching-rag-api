import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate, Link } from 'react-router-dom'
import BackButton from '@/components/ui/back'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import EditUser from './edit-user'


function DeleteConfirmModal({ user, onClose, onConfirm }) {
  if (!user) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Delete</h2>
        <p className="mb-6 text-gray-600">
          Are you sure you want to delete user <b>{user.username}</b>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => onConfirm(user.user_id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function UserManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch('http://localhost:8000/users', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/delete-user/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete user')

      setUsers(users.filter((u) => u.user_id !== userId))
      setDeletingUser(null) // tutup modal
    } catch (error) {
      console.error(error)
      alert('Error deleting user')
    }
  }

  const handleUpdateUser = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u))
    )
  }

  if (loading) return <div>Loading users...</div>

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-gray-800">
        <Link to="/home-admin" className="hover:text-gray-500 transition-colors">
          User Management
        </Link>
      </h2>
        <Button
          onClick={() => navigate('/admin/add-user')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-4 py-3 border-b text-left">ID</th>
              <th className="px-4 py-3 border-b text-left">Username</th>
              <th className="px-4 py-3 border-b text-left">Role</th>
              <th className="px-4 py-3 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.user_id}
                className="hover:bg-gray-50 transition duration-150"
              >
                <td className="px-4 py-3 border-b">{user.user_id}</td>
                <td className="px-4 py-3 border-b">{user.username}</td>
                <td className="px-4 py-3 border-b">{user.role}</td>
                <td className="px-4 py-3 border-b text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      onClick={() => setEditingUser(user)}
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-red-600 hover:text-red-800"
                      onClick={() => setDeletingUser(user)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <BackButton />
      </div>

      <EditUser
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleUpdateUser}
      />

      <DeleteConfirmModal
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default UserManagement
