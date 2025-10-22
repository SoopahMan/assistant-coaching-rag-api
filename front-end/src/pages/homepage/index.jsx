import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser} from '@/helpers/auth'


const HomePage = () => {
  const navigate = useNavigate()
  const user = getUser()
  const userRole = user?.role || 'user' 
  const routePrefix = userRole === 'admin' ? '/admin' : '/user'

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Welcome to Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        {userRole === 'admin' && (
          <>
            <button 
              onClick={() => navigate(`${routePrefix}/document`)} 
              className="p-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
            >
              Document
            </button>
            <button 
              onClick={() => navigate(`${routePrefix}/database/connect`)} 
              className="p-4 bg-green-500 text-white rounded-lg shadow hover:bg-green-600"
            >
              Database
            </button>
          </>
        )}
        <button 
          onClick={() => navigate(`${routePrefix}/rag`)} 
          className="p-4 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600"
        >
          RAG
        </button>
        <button 
          onClick={() => navigate(`${routePrefix}/my-account`)} 
          className="p-4 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600"
        >
          My Account
        </button>
      </div>

      <button 
        onClick={handleLogout} 
        className="mt-8 px-6 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  )
}

export default HomePage
