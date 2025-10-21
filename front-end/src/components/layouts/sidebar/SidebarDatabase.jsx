import { Link} from 'react-router-dom'

export default function SidebarDatabase() {
  return (
    <aside className="w-60 bg-white p-5 h-screen shadow-md space-y-5">
      <h2 className="text-3xl font-bold text-gray-800">
        <Link to="/home-admin" className="hover:text-gray-500 transition-colors">
          Database
        </Link>
      </h2>      
      <nav>
        <ul className="space-y-3">
          <li>
            <Link 
              to="/admin/database/connect" 
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Connect Database
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/database/view" 
              className="text-gray-700 hover:text-blue-600 transition"
            >
              View Table Database
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/database/connections" 
              className="text-gray-700 hover:text-blue-600 transition"
            >
              View Database
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
