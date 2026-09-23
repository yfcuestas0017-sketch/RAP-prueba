import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#F5F6F8',
}

const mainStyle = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
}

const contentStyle = {
  flex: 1,
  padding: '24px',
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
}

const Layout = () => (
  <div style={layoutStyle}>
    <Sidebar />
    <div style={mainStyle}>
      <Header />
      <main style={contentStyle}>
        <Outlet />
      </main>
      <Footer />
    </div>
  </div>
)

export default Layout