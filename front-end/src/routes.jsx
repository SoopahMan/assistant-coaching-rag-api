import { Route, Routes, Navigate } from 'react-router-dom'
import Home from './pages/home'
import Login from './pages/auth/login'
import RequireAuth from './components/auth/RequireAuth'
import UnauthorizedPage from './pages/auth/Unauthorized'
import Homepage from './pages/homepage'
import UserManagement from './pages/auth/view_user'
import AddUser from './pages/auth/add-user' 
import MyAccount from './pages/auth/my-account'
import Database from './pages/database'
import ViewDatabase from './pages/database/view-database'
import ConnectionList from './pages/database/list-connection'

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />    
    <Route path="/login" element={<Login />} />
    
    
    <Route element={<RequireAuth allowedRoles={['admin']} />}> 
      <Route path="/admin/rag" element={<Home />} />
      <Route path="/home-admin" element={<Homepage />} />
      <Route path="/admin/user-management" element={<UserManagement/>}/>
      <Route path="/admin/add-user" element={<AddUser />}></Route>
      <Route path="/admin/my-account" element={<MyAccount/>}/>
      <Route path="/admin/database/connect" element={<Database/>}></Route>
      <Route path="/admin/database/view" element={<ViewDatabase/>}></Route>
      <Route path="/admin/database/connections" element={<ConnectionList/>}></Route>
    </Route>

    <Route element={<RequireAuth allowedRoles={['user']} />}>
      <Route path="/home-user" element={<Homepage />} />
      <Route path="/user/rag" element={<Home/>}/>
      <Route path="/user/my-account" element={<MyAccount/>}/>
    </Route>


    <Route element={<RequireAuth allowedRoles={['test']}/>}>
      <Route path="/user/database"></Route>
      <Route path="/ocr"></Route>
    </Route>

    <Route element={<RequireAuth/>}>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Route>
  </Routes>
)

export default AppRoutes
