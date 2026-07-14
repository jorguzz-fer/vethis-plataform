import { Navigate, Route, Routes } from 'react-router-dom';
import { Button } from '@vethis/ui';
import { useAuth } from './auth';
import { SidebarLayout } from './components/sidebar-layout';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';
import { CoursesPage } from './pages/courses-page';
import { CourseEditorPage } from './pages/course-editor-page';
import { UsersPage } from './pages/users-page';
import { StudentsPage } from './pages/students-page';
import { CrmPage } from './pages/crm-page';
import { ChannelsPage } from './pages/channels-page';
import { FunnelMapPage } from './pages/funnel-map-page';

export function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted">Carregando…</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Backoffice é restrito a staff/admin (RBAC também é aplicado no servidor).
  if (user.role === 'aluno') {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted">Esta área é restrita à equipe Vethis.</p>
        <Button variant="outline" onClick={() => void logout()}>
          Sair
        </Button>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cursos" element={<CoursesPage />} />
        <Route path="/cursos/novo" element={<CourseEditorPage />} />
        <Route path="/cursos/:id" element={<CourseEditorPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/alunos" element={<StudentsPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/canais" element={<ChannelsPage />} />
        <Route path="/fluxo" element={<FunnelMapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SidebarLayout>
  );
}
