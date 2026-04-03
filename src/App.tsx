import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import ReceptionBedsPage from './pages/ReceptionBedsPage';
import ReceptionPatientsPage from './pages/ReceptionPatientsPage';
import MedicalCensoPage from './pages/MedicalCensoPage';
import MedicalPepPage from './pages/MedicalPepPage';
import NurseCensusPage from './pages/NurseCensusPage';
import NurseAprazamentoPage from './pages/NurseAprazamentoPage';
import TechnicianDashboard from './pages/TechnicianDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Módulo TI */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['TI']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['TI']}><AdminLogsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['TI']}><AdminSettingsPage /></ProtectedRoute>} />
          
          {/* Módulo Recepção */}
          <Route path="/recepcao" element={<ProtectedRoute allowedRoles={['Recepcao']}><ReceptionBedsPage /></ProtectedRoute>} />
          <Route path="/recepcao/pacientes" element={<ProtectedRoute allowedRoles={['Recepcao']}><ReceptionPatientsPage /></ProtectedRoute>} />
          
          {/* Módulo Médico */}
          <Route path="/medico" element={<ProtectedRoute allowedRoles={['Medico']}><MedicalCensoPage /></ProtectedRoute>} />
          <Route path="/medico/paciente/:id" element={<ProtectedRoute allowedRoles={['Medico']}><MedicalPepPage /></ProtectedRoute>} />
          
          {/* Módulo Enfermeiro */}
          <Route path="/enfermeiro" element={<ProtectedRoute allowedRoles={['Enfermeiro']}><NurseCensusPage /></ProtectedRoute>} />
          <Route path="/enfermeiro/aprazamento/:id" element={<ProtectedRoute allowedRoles={['Enfermeiro']}><NurseAprazamentoPage /></ProtectedRoute>} />
          
          {/* Módulo Técnico */}
          <Route path="/tecnico" element={<ProtectedRoute allowedRoles={['Tecnico']}><TechnicianDashboard /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
