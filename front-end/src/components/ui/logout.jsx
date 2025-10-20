import { useNavigate } from 'react-router-dom'
import { logout } from '@/helpers/auth'
import { Button } from '@/components/ui/button'

const LogoutButton = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500 text-white rounded-lg cursor-pointer hover:bg-red-600"
    >
      Logout
    </Button>
  )
}

export default LogoutButton
