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
import MedicalPendenciasPage from './pages/MedicalPendenciasPage';
import MedicalExamesPage from './pages/MedicalExamesPage';
import MedicalHistoricoPage from './pages/MedicalHistoricoPage';
import NurseCensusPage from './pages/NurseCensusPage';
import NurseUnitPage from './pages/NurseUnitPage';
import NurseAprazamentoPage from './pages/NurseAprazamentoPage';
import NurseExamesPage from './pages/NurseExamesPage';
import TechnicianDashboard from './pages/TechnicianDashboard';
import TechnicianExamesPage from './pages/TechnicianExamesPage';

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
          <Route path="/medico/pendencias" element={<ProtectedRoute allowedRoles={['Medico']}><MedicalPendenciasPage /></ProtectedRoute>} />
          <Route path="/medico/exames" element={<ProtectedRoute allowedRoles={['Medico']}><MedicalExamesPage /></ProtectedRoute>} />
          <Route path="/medico/historico" element={<ProtectedRoute allowedRoles={['Medico']}><MedicalHistoricoPage /></ProtectedRoute>} />
          
          {/* Módulo Enfermeiro */}
          <Route path="/enfermeiro" element={<ProtectedRoute allowedRoles={['Enfermeiro']}><NurseCensusPage /></ProtectedRoute>} />
          <Route path="/enfermeiro/unidade" element={<ProtectedRoute allowedRoles={['Enfermeiro']}><NurseUnitPage /></ProtectedRoute>} />
          <Route path="/enfermeiro/aprazamento/:id" element={<ProtectedRoute allowedRoles={['Enfermeiro']}><NurseAprazamentoPage /></ProtectedRoute>} />
          <Route path="/enfermeiro/exames" element={<ProtectedRoute allowedRoles={['Enfermeiro']}><NurseExamesPage /></ProtectedRoute>} />
          
          {/* Módulo Técnico */}
          <Route path="/tecnico" element={<ProtectedRoute allowedRoles={['Tecnico']}><TechnicianDashboard /></ProtectedRoute>} />
          <Route path="/tecnico/exames" element={<ProtectedRoute allowedRoles={['Tecnico']}><TechnicianExamesPage /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
