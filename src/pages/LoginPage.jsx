import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Simulation de connexion - à remplacer par appel API réel
    if (email && password) {
      // Simuler différents rôles selon l'email
      let role = 'testeur'
      if (email.includes('admin')) role = 'admin'
      else if (email.includes('chef')) role = 'chef_testeur'
      else if (email.includes('dev')) role = 'developpeur'

      const userData = {
        id: 1,
        email,
        name: email.split('@')[0],
        role
      }
      login(userData)
      navigate('/')
    } else {
      setError('Veuillez remplir tous les champs')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">DHI</h1>
          <p className="text-gray-600 mt-2">Suivi des Tests et Qualité Logiciel</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Se connecter
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Conseils de test (simulation) :</p>
          <p className="text-xs mt-1">admin@... → Admin | chef@... → Chef testeur | dev@... → Développeur | autre → Testeur</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
