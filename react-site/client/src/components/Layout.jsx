/* Header + current page + footer. Also handles scrolling when the page changes. */
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const { pathname, hash } = useLocation()

  // A new page starts at the top; a link like /doctors#general jumps to that section.
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1))
    if (target) {
      target.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
