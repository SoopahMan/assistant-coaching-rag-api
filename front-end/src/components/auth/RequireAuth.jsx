import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, } from 'react'
import { getToken, getUser} from '@/helpers/auth'


const RequireAuth = ({ allowedRoles }) => {

  const token = getToken()
  const user = getUser()
  const navigate = useNavigate()
  useEffect(() => {
  }, [token, navigate])
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default RequireAuth
