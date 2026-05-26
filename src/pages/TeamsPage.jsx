import { useState } from 'react'

function TeamsPage() {
  const [teams, setTeams] = useState([
    { id: 1, name: 'Équipe Alpha', lead: 'Marie Dupont', members: 5, project: 'Application E-commerce' },
    { id: 2, name: 'Équipe Beta', lead: 'Jean Martin', members: 4, project: 'Système de Gestion RH' },
    { id: 3, name: 'Équipe Gamma', lead: 'Sophie Bernard', members: 6, project: 'Application Mobile' },
  ])

  const [showModal, setShowModal] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', lead: '', members: '', project: '' })

  const handleAddTeam = (e) => {
    e.preventDefault()
    setTeams([...teams, { ...newTeam, id: teams.length + 1, members: parseInt(newTeam.members) }])
    setNewTeam({ name: '', lead: '', members: '', project: '' })
    setShowModal(false)
  }

  const handleDeleteTeam = (id) => {
    setTeams(teams.filter(team => team.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Équipes</h1>
          <p className="mt-2 text-gray-600">Gérez vos équipes de test</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nouvelle Équipe
        </button>
      </div>

      {/* Liste des équipes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Équipes existantes</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-600">Chef d'équipe: {team.lead} | Membres: {team.members}</p>
                  <p className="text-sm text-gray-500">Projet assigné: {team.project}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors">
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'équipe */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nouvelle Équipe</h3>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'équipe</label>
                <input
                  type="text"
                  required
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chef d'équipe</label>
                <input
                  type="text"
                  required
                  value={newTeam.lead}
                  onChange={(e) => setNewTeam({ ...newTeam, lead: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de membres</label>
                <input
                  type="number"
                  required
                  value={newTeam.members}
                  onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projet assigné</label>
                <input
                  type="text"
                  required
                  value={newTeam.project}
                  onChange={(e) => setNewTeam({ ...newTeam, project: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

export default TeamsPage
