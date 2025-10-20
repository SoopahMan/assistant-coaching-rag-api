import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const BackButton = () => {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1) 
  }

  return (
    <Button 
      onClick={handleBack}
      variant="secondary"
    className="bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
      Back
    </Button>
  )
}

export default BackButton
