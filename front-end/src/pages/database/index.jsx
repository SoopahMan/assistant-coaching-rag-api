import { useState } from 'react'
import apiUrl from '@/config/api'
import BackButton from '@/components/ui/back'
import SidebarDatabase from '@/components/layouts/sidebar/SidebarDatabase'
import { Link, useNavigate } from 'react-router-dom'


export default function Database() {
  const [dbType, setDbType] = useState('postgres')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
  e.preventDefault()
  setMessage('')

  try {
    const res = await apiUrl.post('/db/connect', {
      db_type: dbType,
      host,
      port: Number(port),
      username,
      password,
      database,
    })

    const data = res.data  
    setMessage(data.message)

    if (data.status) {
      navigate('/admin/database/view') 
    }
  } catch (err) {
    setMessage(err.response?.data?.detail || 'Connection failed')
  }
}


  return (
  <div className="flex min-h-screen bg-gray-100">
    <SidebarDatabase />

    {/* Main content */}
    <div className="flex-1 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-gray-800 text-center">
          Connect Database
        </h2>

        <select
          value={dbType}
          onChange={(e) => setDbType(e.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          <option value="postgres">Postgres</option>
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
        </select>

        {dbType !== 'sqlite' && (
          <>
            <input
              type="text"
              placeholder="Host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />

            <input
              type="number"
              placeholder="Port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          </>
        )}

        <input
          type="text"
          placeholder="Database"
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          className="w-full p-3 border rounded-lg"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
        >
          Connect
        </button>

        <div className="flex justify-center mt-3">
          <BackButton />
        </div>

        {message && (
          <p className="text-center text-sm mt-3 text-gray-700">{message}</p>
        )}
      </form>
    </div>
  </div>
)

}
