import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function CampaignDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateTestCaseModal, setShowCreateTestCaseModal] = useState(false)
  const [showCreateAnomalyModal, setShowCreateAnomalyModal] = useState(false)

  // Données simulées pour la campagne
  const campaign = {
    id: 1,
    name: 'Campagne Panier',
    objective: 'Tests du module panier et paiement',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    status: 'active',
    progress: 75,
    featuresTested: 12,
    totalFeatures: 16,
    organizationMode: 'modules',
    projectId: 1,
    projectName: 'Application E-commerce'
  }

  // Données simulées pour les cas de test
  const testCases = [
    {
      id: 1,
      title: 'Ajouter un produit au panier',
      description: 'Vérifier qu\'un produit peut être ajouté au panier',
      priority: 'high',
      status: 'passed',
      assignedTo: 'Jean Dupont',
      executionDate: '2025-02-05'
    },
    {
      id: 2,
      title: 'Modifier la quantité d\'un produit',
      description: 'Vérifier la modification de quantité dans le panier',
      priority: 'medium',
      status: 'passed',
      assignedTo: 'Marie Martin',
      executionDate: '2025-02-06'
    },
    {
      id: 3,
      title: 'Supprimer un produit du panier',
      description: 'Vérifier la suppression d\'un produit',
      priority: 'medium',
      status: 'failed',
      assignedTo: 'Jean Dupont',
      executionDate: '2025-02-07'
    },
    {
      id: 4,
      title: 'Calcul du total du panier',
      description: 'Vérifier le calcul automatique du total',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Marie Martin',
      executionDate: null
    },
    {
      id: 5,
      title: 'Application du code promo',
      description: 'Vérifier l\'application des codes promotionnels',
      priority: 'low',
      status: 'pending',
      assignedTo: 'Pierre Durand',
      executionDate: null
    }
  ]

  // Données simulées pour les anomalies
  const anomalies = [
    {
      id: 1,
      title: 'Erreur lors de la suppression du produit',
      description: 'Le produit reste dans le panier après suppression',
      severity: 'critical',
      status: 'open',
      reportedBy: 'Jean Dupont',
      reportedDate: '2025-02-07',
      assignedTo: 'Dev Team'
    },
    {
      id: 2,
      title: 'Total incorrect après promo',
      description: 'Le total ne se met pas à jour après application du code promo',
      severity: 'major',
      status: 'open',
      reportedBy: 'Marie Martin',
      reportedDate: '2025-02-08',
      assignedTo: 'Dev Team'
    },
    {
      id: 3,
      title: 'Affichage incorrect des quantités',
      description: 'Les quantités s\'affichent en double sur mobile',
      severity: 'minor',
      status: 'resolved',
      reportedBy: 'Pierre Durand',
      reportedDate: '2025-02-03',
      assignedTo: 'Dev Team'
    }
  ]

  // Données simulées pour l'équipe
  const team = [
    {
      id: 1,
      name: 'Jean Dupont',
      role: 'Testeur',
      email: 'jean@test.com',
      assignedTests: 3,
      completedTests: 2
    },
    {
      id: 2,
      name: 'Marie Martin',
      role: 'Testeur',
      email: 'marie@test.com',
      assignedTests: 2,
      completedTests: 1
    },
    {
      id: 3,
      name: 'Pierre Durand',
      role: 'Chef testeur',
      email: 'pierre@test.com',
      assignedTests: 1,
      completedTests: 0
    }
  ]

  const getStatusColor = (status) => {
    const colors = {
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      open: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      passed: 'Réussi',
      failed: 'Échoué',
      pending: 'En attente',
      open: 'Ouvert',
      resolved: 'Résolu',
      closed: 'Fermé'
    }
    return labels[status] || status
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600',
      critical: 'text-red-800 font-bold',
      major: 'text-red-600',
      minor: 'text-yellow-600'
    }
    return colors[priority] || 'text-gray-600'
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
      critical: 'Critique',
      major: 'Majeure',
      minor: 'Mineure'
    }
    return labels[priority] || priority
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'testcases', label: 'Cas de test' },
    { id: 'anomalies', label: 'Anomalies' },
    { id: 'team', label: 'Équipe' }
  ]

  return (
    <div className="space-y-6">
      {/* En-tête de la campagne */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <Link to="/projects" className="hover:text-blue-600">Projets</Link>
          <span>/</span>
          <Link to={`/projects/${campaign.projectId}`} className="hover:text-blue-600">{campaign.projectName}</Link>
          <span>/</span>
          <span className="text-gray-900">{campaign.name}</span>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="mt-2 text-gray-600">{campaign.objective}</p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>📅 {campaign.startDate} - {campaign.endDate}</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">En cours</span>
              <span>📋 {campaign.organizationMode === 'functionalities' ? 'Par fonctionnalités' : 'Par modules'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques de la campagne */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Progression</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{campaign.progress}%</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${campaign.progress}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Tests réussis</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {testCases.filter(t => t.status === 'passed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Tests échoués</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {testCases.filter(t => t.status === 'failed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Anomalies ouvertes</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {anomalies.filter(a => a.status === 'open').length}
          </p>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Objectif</p>
                    <p className="mt-1 text-gray-900">{campaign.objective}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mode d'organisation</p>
                    <p className="mt-1 text-gray-900">
                      {campaign.organizationMode === 'functionalities' ? 'Par fonctionnalités' : 'Par modules'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date de début</p>
                    <p className="mt-1 text-gray-900">{campaign.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date de fin</p>
                    <p className="mt-1 text-gray-900">{campaign.endDate}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé des tests</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800">Réussis</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {testCases.filter(t => t.status === 'passed').length}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800">Échoués</p>
                    <p className="text-2xl font-bold text-red-900 mt-1">
                      {testCases.filter(t => t.status === 'failed').length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-800">En attente</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">
                      {testCases.filter(t => t.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testcases' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Cas de test ({testCases.length})</h3>
                <button
                  onClick={() => setShowCreateTestCaseModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  + Nouveau cas de test
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {testCases.map((testCase) => (
                  <div key={testCase.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{testCase.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(testCase.status)}`}>
                            {getStatusLabel(testCase.status)}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(testCase.priority)}`}>
                            {getPriorityLabel(testCase.priority)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{testCase.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>👤 {testCase.assignedTo}</span>
                          {testCase.executionDate && <span>📅 {testCase.executionDate}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'anomalies' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Anomalies ({anomalies.length})</h3>
                <button
                  onClick={() => setShowCreateAnomalyModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  + Nouvelle anomalie
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {anomalies.map((anomaly) => (
                  <div key={anomaly.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{anomaly.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(anomaly.status)}`}>
                            {getStatusLabel(anomaly.status)}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(anomaly.severity)}`}>
                            {getPriorityLabel(anomaly.severity)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{anomaly.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>👤 Rapporté par: {anomaly.reportedBy}</span>
                          <span>📅 {anomaly.reportedDate}</span>
                          <span>🎯 Assigné à: {anomaly.assignedTo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Équipe ({team.length} membres)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{member.completedTests}/{member.assignedTests} tests</p>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(member.completedTests / member.assignedTests) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création de cas de test */}
      {showCreateTestCaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau cas de test</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigner à</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {team.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateTestCaseModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowCreateTestCaseModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création d'anomalie */}
      {showCreateAnomalyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nouvelle anomalie</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sévérité</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="critical">Critique</option>
                    <option value="major">Majeure</option>
                    <option value="minor">Mineure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigner à</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="dev">Dev Team</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateAnomalyModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowCreateAnomalyModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CampaignDetailPage
