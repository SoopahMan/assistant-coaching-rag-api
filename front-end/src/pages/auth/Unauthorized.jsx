import React from 'react'
import BackButton from '@/components/ui/back'
import LogoutButton from '@/components/ui/logout'
import { ShieldAlert } from 'lucide-react'
import { getUser} from '@/helpers/auth'


function UnauthorizedPage() {
  const user = getUser()
  const hasToken = !!user?.token // cek apakah ada token


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Unauthorized Access
        </h1>

        <p className="text-gray-600 mb-6">
          This is a protected page. Only visible to authenticated users.
        </p>
        <div className="flex justify-center space-x-3">

        <div className="flex justify-center">
          {hasToken ? <BackButton /> : <LogoutButton />}
        </div>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
