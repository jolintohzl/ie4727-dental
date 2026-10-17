/* Who is logged in, shared with every page.

   const { patient, setPatient, logout } = useAuth()
   patient is null when nobody is logged in, undefined while still checking. */
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [patient, setPatient] = useState(undefined)

  // Ask the server once when the site loads
  useEffect(() => {
    api('session')
      .then((data) => setPatient(data.patient))
      .catch(() => setPatient(null))
  }, [])

  async function logout() {
    await api('logout', { body: {} })
    setPatient(null)
  }

  return (
    <AuthContext.Provider value={{ patient, setPatient, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
