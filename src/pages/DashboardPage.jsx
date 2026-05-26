function DashboardPage() {
  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-2 text-gray-600">Vue d'ensemble de vos projets et campagnes</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">📁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projets actifs</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Campagnes en cours</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tests conformes</p>
                <p className="text-2xl font-bold text-gray-900">142</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-2xl">🐛</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Anomalies ouvertes</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projets récents */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Projets récents</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div>
                  <h3 className="font-medium text-gray-900">Application E-commerce</h3>
                  <p className="text-sm text-gray-600">Début: 15/01/2025 | Fin: 30/06/2025</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">En cours</span>
                  <span className="text-sm text-gray-500">2 campagnes</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div>
                  <h3 className="font-medium text-gray-900">Système de Gestion RH</h3>
                  <p className="text-sm text-gray-600">Début: 01/02/2025 | Fin: 15/07/2025</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">En cours</span>
                  <span className="text-sm text-gray-500">1 campagne</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div>
                  <h3 className="font-medium text-gray-900">Application Mobile</h3>
                  <p className="text-sm text-gray-600">Début: 10/03/2025 | Fin: 31/08/2025</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">Planifié</span>
                  <span className="text-sm text-gray-500">0 campagne</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

export default DashboardPage
