import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import Layout from '../components/Layout'
import DashboardPage from '../pages/DashboardPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectDetailPage from '../pages/ProjectDetailPage'
import CampaignDetailPage from '../pages/CampaignDetailPage'
import TeamsPage from '../pages/TeamsPage'
import TasksPage from '../pages/TasksPage'
import AnomaliesPage from '../pages/AnomaliesPage'
import PrivateRoute from '../components/PrivateRoute'

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="my-tasks" element={<TasksPage />} />
        <Route path="my-anomalies" element={<AnomaliesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
