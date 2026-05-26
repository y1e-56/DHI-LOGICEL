import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
