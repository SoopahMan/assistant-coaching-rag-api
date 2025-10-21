import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import apiUrl from '@/config/api'
import SidebarDatabase from '@/components/layouts/sidebar/SidebarDatabase'
import BackButton from '@/components/ui/back'



export default function ConnectionList() {
  const [connections, setConnections] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchConnections = async () => {
    try {
      const res = await apiUrl.get('/db/connections')
      setConnections(res.data.payload || [])
    } catch (err) {
      console.error(err)
      setMessage('Gagal memuat data koneksi')
    }
  }

  const fetchActive = async () => {
    try {
      const res = await apiUrl.get('/db/connections/active')
      if (res.data.payload) {
        setActiveId(res.data.payload.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const activateConnection = async (id) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await apiUrl.post(`/db/connections/${id}/activate`)
      if (res.data.status) {
        setActiveId(id)
        setMessage(res.data.message)
      } else {
        setMessage(res.data.message)
      }
    } catch (err) {
      setMessage(err, 'Gagal mengaktifkan koneksi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConnections()
    fetchActive()
  }, [])

  return (
  <div className="flex min-h-screen bg-gray-100">
    <SidebarDatabase />
    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {connections.map((conn) => (
        <Card
          key={conn.id}
          className={`shadow-md ${activeId === conn.id ? 'border-green-500' : ''}`}
        >
          <CardHeader>
            <CardTitle className="text-lg">
              {conn.name} ({conn.db_type})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Host: {conn.host}</p>
            <p className="text-sm text-gray-600">Database: {conn.database}</p>
            <p className="text-sm text-gray-600">User: {conn.username}</p>
            <div className="mt-3">
              <Button
                onClick={() => activateConnection(conn.id)}
                disabled={loading}
                className={activeId === conn.id ? 'bg-green-600' : ''}
              >
                {activeId === conn.id ? 'Active' : 'Activate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {message && (
        <div className="col-span-full text-center text-sm mt-4 text-blue-600">
          {message}
        </div>
      )}
    </div>
  </div>
  )
}
