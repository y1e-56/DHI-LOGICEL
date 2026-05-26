import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function ProjectDetailPage() {
  const { id } = useParams()
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    objective: '',
    startDate: '',
    endDate: '',
    organizationMode: 'functionalities'
  })

  // Données simulées
  const project = {
    id: 1,
    name: 'Application E-commerce',
    description: 'Plateforme de vente en ligne avec panier et paiement',
    startDate: '2025-01-15',
    endDate: '2025-06-30',
    status: 'active'
  }

  const campaigns = [
    {
      id: 1,
      name: 'Campagne Panier',
      objective: 'Tests du module panier et paiement',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      status: 'active',
      organizationMode: 'modules',
      progress: 75,
      featuresTested: 12,
      totalFeatures: 16,
      anomaliesOpen: 3
    },
    {
      id: 2,
      name: 'Campagne Compte Client',
      objective: 'Tests des fonctionnalités compte utilisateur',
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      status: 'active',
      organizationMode: 'functionalities',
      progress: 40,
      featuresTested: 8,
      totalFeatures: 20,
      anomaliesOpen: 5
    }
  ]

  const handleCreateCampaign = (e) => {
    e.preventDefault()
    console.log('Nouvelle campagne:', newCampaign)
    setShowCreateCampaignModal(false)
    setNewCampaign({ name: '', objective: '', startDate: '', endDate: '', organizationMode: 'functionalities' })
  }

  return (
    <div className="space-y-6">
        {/* En-tête du projet */}
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <Link to="/projects" className="hover:text-blue-600">Projets</Link>
            <span>/</span>
            <span className="text-gray-900">{project.name}</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-2 text-gray-600">{project.description}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>📅 {project.startDate} - {project.endDate}</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Actif</span>
              </div>
            </div>
            <button
              onClick={() => setShowCreateCampaignModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              + Nouvelle campagne
            </button>
          </div>
        </div>

        {/* Statistiques du projet */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Campagnes actives</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{campaigns.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Fonctionnalités testées</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {campaigns.reduce((acc, c) => acc + c.featuresTested, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Anomalies ouvertes</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {campaigns.reduce((acc, c) => acc + c.anomaliesOpen, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Avancement global</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {Math.round(campaigns.reduce((acc, c) => acc + c.progress, 0) / campaigns.length)}%
            </p>
          </div>
        </div>

        {/* Liste des campagnes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Campagnes de test</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                to={`/campaigns/${campaign.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">En cours</span>
                    </div>
                    <p className="mt-1 text-gray-600">{campaign.objective}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {campaign.startDate} - {campaign.endDate}</span>
                      <span>📋 {campaign.organizationMode === 'functionalities' ? 'Par fonctionnalités' : 'Par modules'}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progression</span>
                        <span className="font-medium text-gray-900">{campaign.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${campaign.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm text-gray-600">
                      <p>{campaign.featuresTested}/{campaign.totalFeatures} tests</p>
                      <p className="text-red-600 font-medium">{campaign.anomaliesOpen} anomalies</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Modal de création de campagne */}
        {showCreateCampaignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Créer une nouvelle campagne</h2>
              </div>
              <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la campagne *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectif
                  </label>
                  <textarea
                    value={newCampaign.objective}
                    onChange={(e) => setNewCampaign({...newCampaign, objective: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      required
                      value={newCampaign.startDate}
                      onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin *
                    </label>
                    <input
                      type="date"
                      required
                      value={newCampaign.endDate}
                      onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode d'organisation *
                  </label>
                  <select
                    required
                    value={newCampaign.organizationMode}
                    onChange={(e) => setNewCampaign({...newCampaign, organizationMode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="functionalities">Par fonctionnalités</option>
                    <option value="modules">Par modules</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateCampaignModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  )
}

export default ProjectDetailPage
