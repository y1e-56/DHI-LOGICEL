import { useState } from 'react'

function TasksPage() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Test de connexion utilisateur', project: 'Application E-commerce', campaign: 'Campagne Alpha', status: 'En cours', priority: 'Haute', dueDate: '2025-05-25' },
    { id: 2, title: 'Test du panier d\'achat', project: 'Application E-commerce', campaign: 'Campagne Alpha', status: 'À faire', priority: 'Moyenne', dueDate: '2025-05-26' },
    { id: 3, title: 'Test de création de compte', project: 'Système de Gestion RH', campaign: 'Campagne Beta', status: 'Terminé', priority: 'Basse', dueDate: '2025-05-20' },
    { id: 4, title: 'Test de modification de profil', project: 'Système de Gestion RH', campaign: 'Campagne Beta', status: 'En cours', priority: 'Haute', dueDate: '2025-05-27' },
    { id: 5, title: 'Test de paiement', project: 'Application E-commerce', campaign: 'Campagne Alpha', status: 'À faire', priority: 'Haute', dueDate: '2025-05-28' },
  ])

  const [filter, setFilter] = useState('all')

  const getStatusColor = (status) => {
    const colors = {
      'En cours': 'bg-yellow-100 text-yellow-800',
      'À faire': 'bg-gray-100 text-gray-800',
      'Terminé': 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Haute': 'bg-red-100 text-red-800',
      'Moyenne': 'bg-yellow-100 text-yellow-800',
      'Basse': 'bg-green-100 text-green-800',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ))
  }

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(task => task.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Tâches</h1>
        <p className="mt-2 text-gray-600">Gérez vos tâches de test assignées</p>
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
          onClick={() => setFilter('À faire')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'À faire' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          À faire
        </button>
        <button
          onClick={() => setFilter('En cours')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'En cours' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          En cours
        </button>
        <button
          onClick={() => setFilter('Terminé')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'Terminé' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Terminées
        </button>
      </div>

      {/* Liste des tâches */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tâches assignées ({filteredTasks.length})</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Projet: {task.project} | Campagne: {task.campaign}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Date limite: {task.dueDate}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className={`px-3 py-1 text-sm rounded-full border-0 cursor-pointer ${getStatusColor(task.status)}`}
                    >
                      <option value="À faire">À faire</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminé">Terminé</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TasksPage
