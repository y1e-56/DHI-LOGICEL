import { useState } from 'react'

function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState([
    { id: 1, title: 'Erreur lors du paiement', project: 'Application E-commerce', description: 'Le paiement échoue lorsque l\'utilisateur utilise une carte Visa', severity: 'Critique', status: 'Ouvert', reportedBy: 'Marie Dupont', assignedTo: 'Jean Martin', date: '2025-05-20' },
    { id: 2, title: 'Problème d\'affichage sur mobile', project: 'Application Mobile', description: 'Le menu ne s\'affiche pas correctement sur iOS', severity: 'Majeure', status: 'En cours', reportedBy: 'Sophie Bernard', assignedTo: 'Jean Martin', date: '2025-05-21' },
    { id: 3, title: 'Erreur de connexion LDAP', project: 'Système de Gestion RH', description: 'La connexion via LDAP échoue pour certains utilisateurs', severity: 'Majeure', status: 'Ouvert', reportedBy: 'Marie Dupont', assignedTo: 'Pierre Durand', date: '2025-05-22' },
    { id: 4, title: 'Typo dans le formulaire d\'inscription', project: 'Application E-commerce', description: 'Le label "Email" est mal orthographié', severity: 'Mineure', status: 'Résolu', reportedBy: 'Sophie Bernard', assignedTo: 'Jean Martin', date: '2025-05-18' },
    { id: 5, title: 'Performance lente sur la page dashboard', project: 'Système de Gestion RH', description: 'La page dashboard met plus de 5 secondes à charger', severity: 'Majeure', status: 'En cours', reportedBy: 'Marie Dupont', assignedTo: 'Pierre Durand', date: '2025-05-23' },
  ])

  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedAnomaly, setSelectedAnomaly] = useState(null)

  const getSeverityColor = (severity) => {
    const colors = {
      'Critique': 'bg-red-100 text-red-800',
      'Majeure': 'bg-orange-100 text-orange-800',
      'Mineure': 'bg-yellow-100 text-yellow-800',
    }
    return colors[severity] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status) => {
    const colors = {
      'Ouvert': 'bg-blue-100 text-blue-800',
      'En cours': 'bg-yellow-100 text-yellow-800',
      'Résolu': 'bg-green-100 text-green-800',
      'Fermé': 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleStatusChange = (anomalyId, newStatus) => {
    setAnomalies(anomalies.map(anomaly => 
      anomaly.id === anomalyId ? { ...anomaly, status: newStatus } : anomaly
    ))
  }

  const handleViewDetails = (anomaly) => {
    setSelectedAnomaly(anomaly)
    setShowModal(true)
  }

  const filteredAnomalies = filter === 'all' ? anomalies : anomalies.filter(anomaly => anomaly.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Anomalies</h1>
        <p className="mt-2 text-gray-600">Gérez les anomalies qui vous sont assignées</p>
      </div>

      {/* Filtres */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('Ouvert')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'Ouvert' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Ouvertes
        </button>
        <button
          onClick={() => setFilter('En cours')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'En cours' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          En cours
        </button>
        <button
          onClick={() => setFilter('Résolu')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'Résolu' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Résolues
        </button>
      </div>

      {/* Liste des anomalies */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Anomalies assignées ({filteredAnomalies.length})</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{anomaly.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Projet: {anomaly.project} | Rapporté par: {anomaly.reportedBy}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Date: {anomaly.date} | Assigné à: {anomaly.assignedTo}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-3 py-1 text-sm rounded-full ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity}
                    </span>
                    <select
                      value={anomaly.status}
                      onChange={(e) => handleStatusChange(anomaly.id, e.target.value)}
                      className={`px-3 py-1 text-sm rounded-full border-0 cursor-pointer ${getStatusColor(anomaly.status)}`}
                    >
                      <option value="Ouvert">Ouvert</option>
                      <option value="En cours">En cours</option>
                      <option value="Résolu">Résolu</option>
                      <option value="Fermé">Fermé</option>
                    </select>
                    <button
                      onClick={() => handleViewDetails(anomaly)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      {showModal && selectedAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedAnomaly.title}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-gray-600 mt-1">{selectedAnomaly.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Projet</p>
                  <p className="text-gray-600 mt-1">{selectedAnomaly.project}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Sévérité</p>
                  <span className={`px-3 py-1 text-sm rounded-full ${getSeverityColor(selectedAnomaly.severity)}`}>
                    {selectedAnomaly.severity}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Statut</p>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedAnomaly.status)}`}>
                    {selectedAnomaly.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Date de rapport</p>
                  <p className="text-gray-600 mt-1">{selectedAnomaly.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Rapporté par</p>
                  <p className="text-gray-600 mt-1">{selectedAnomaly.reportedBy}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Assigné à</p>
                  <p className="text-gray-600 mt-1">{selectedAnomaly.assignedTo}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnomaliesPage
