import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrateur',
      chef_testeur: 'Chef Testeur',
      testeur: 'Testeur',
      developpeur: 'Développeur'
    }
    return labels[role] || role
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                DHI
              </Link>
              <span className="ml-4 text-gray-600 text-sm">Suivi des Tests</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                📊 Tableau de bord
              </Link>
              <Link
                to="/projects"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                📁 Projets
              </Link>
              {(user?.role === 'admin' || user?.role === 'chef_testeur') && (
                <>
                  <Link
                    to="/campaigns"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    🎯 Campagnes
                  </Link>
                  <Link
                    to="/teams"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    👥 Équipes
                  </Link>
                </>
              )}
              {user?.role === 'testeur' && (
                <Link
                  to="/my-tasks"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  ✅ Mes Tâches
                </Link>
              )}
              {user?.role === 'developpeur' && (
                <Link
                  to="/my-anomalies"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  🐛 Mes Anomalies
                </Link>
              )}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
