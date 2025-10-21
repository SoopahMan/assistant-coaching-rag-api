import { useEffect, useState } from 'react'
import apiUrl from '@/config/api'
import Sidebar from '@/components/layouts/sidebar/SidebarDatabase'

const ViewDatabase = () => {
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Ambil daftar tabel
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await apiUrl.get('/db/tables')
        setTables(res.data.payload || [])
      } catch (err) {
        setError(err.response?.data?.detail || 'Gagal mengambil daftar tabel')
      }
    }
    fetchTables()
  }, [])

  // Query isi tabel
  const fetchTableData = async (table) => {
    setLoading(true)
    setRows([])
    try {
      const res = await apiUrl.get(`/db/query?table=${table}`)
      setRows(res.data.payload || [])
    } catch (err) {
      setError(err.response?.data?.detail ||'Gagal mengambil isi tabel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-4">View Database</h2>

        {/* Dropdown pilih tabel */}
        <select
          value={selectedTable}
          onChange={(e) => {
            setSelectedTable(e.target.value)
            fetchTableData(e.target.value)
          }}
          className="border p-2 rounded-lg mb-4"
        >
          <option value="">-- Pilih Tabel --</option>
          {tables.map((table, i) => (
            <option key={i} value={table}>
              {table}
            </option>
          ))}
        </select>

        {/* Tampilkan data tabel */}
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full border">
              <thead>
                <tr>
                  {Object.keys(rows[0]).map((col, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 border bg-gray-200 text-sm text-left"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-4 py-2 border text-sm">
                        {val !== null ? val.toString() : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          selectedTable && <p className="text-gray-600">Tidak ada data</p>
        )}
      </div>
    </div>
  )
}

export default ViewDatabase
