import { useState } from 'react'
import { Link } from 'react-router-dom'

function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  })

  const projects = [
    {
      id: 1,
      name: 'Application E-commerce',
      description: 'Plateforme de vente en ligne avec panier et paiement',
      startDate: '2025-01-15',
      endDate: '2025-06-30',
      status: 'active',
      campaignsCount: 2
    },
    {
      id: 2,
      name: 'Système de Gestion RH',
      description: 'Application de gestion des ressources humaines',
      startDate: '2025-02-01',
      endDate: '2025-07-15',
      status: 'active',
      campaignsCount: 1
    },
    {
      id: 3,
      name: 'Application Mobile',
      description: 'Application mobile iOS et Android',
      startDate: '2025-03-10',
      endDate: '2025-08-31',
      status: 'planned',
      campaignsCount: 0
    }
  ]

  const handleCreateProject = (e) => {
    e.preventDefault()
    // TODO: Appeler l'API pour créer le projet
    console.log('Nouveau projet:', newProject)
    setShowCreateModal(false)
    setNewProject({ name: '', description: '', startDate: '', endDate: '' })
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projets</h1>
            <p className="mt-2 text-gray-600">Gérez vos projets de test</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            + Nouveau projet
          </button>
        </div>

        {/* Liste des projets */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tous les projets</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {project.status === 'active' ? 'Actif' : 'Planifié'}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-600">{project.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {project.startDate} - {project.endDate}</span>
                      <span>🎯 {project.campaignsCount} campagne{project.campaignsCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Créer un nouveau projet</h2>
              </div>
              <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
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
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin prévue *
                    </label>
                    <input
                      type="date"
                      required
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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

export default ProjectsPage
