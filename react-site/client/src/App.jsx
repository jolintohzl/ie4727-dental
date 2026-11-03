/* Every page of the React site, and the address it lives at. */
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import Doctors from './pages/Doctors'
import Services from './pages/Services'
import FeesPage from './pages/FeesPage'
import LocateUs from './pages/LocateUs'
import Appointment from './pages/Appointment'
import Dashboard from './pages/Dashboard'
import ApplyResult from './pages/ApplyResult'
import Login from './pages/Login'
import Search from './pages/Search'
import DoctorLogin from './pages/DoctorLogin'
import DoctorDashboard from './pages/DoctorDashboard'
import DbAdmin from './pages/DbAdmin'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/services" element={<Services />} />
        <Route path="/fees-calculator" element={<FeesPage />} />
        <Route path="/locate-us" element={<LocateUs />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply" element={<ApplyResult />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
      </Route>

      {/* The doctor pages bring their own small header (components/DoctorHeader) */}
      <Route path="/doctor/login" element={<DoctorLogin />} />
      <Route path="/doctor" element={<DoctorDashboard />} />

      {/* phpMyAdmin-style view of the MongoDB database (server/routes/dbadmin.js) */}
      <Route path="/db-admin" element={<DbAdmin />} />
    </Routes>
  )
}
