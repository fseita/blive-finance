import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/common/protected-route'
import { AdminLayout } from './pages/admin-layout'
import { DashboardPage } from './pages/dashboard-page'
import { LoginPage } from './pages/login-page'
import { ManualRevenuePage } from './pages/manual-revenue-page'
import { PendingPaymentsPage } from './pages/pending-payments-page'
import { PublicSubmissionPage } from './pages/public-submission-page'
import { SettingsPage } from './pages/settings-page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/submeter-pagamento" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/submeter-pagamento" element={<PublicSubmissionPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="pagamentos" replace />} />
        <Route path="pagamentos" element={<PendingPaymentsPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="receitas" element={<ManualRevenuePage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
