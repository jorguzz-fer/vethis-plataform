import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { AppShell } from './components/app-shell';
import { LoginPage } from './pages/login-page';
import { HomePage } from './pages/home-page';
import { MyCoursesPage } from './pages/my-courses-page';
import { CoursePlayerPage } from './pages/course-player-page';
import { CertificatePage } from './pages/certificate-page';
import { SecretariaPage } from './pages/secretaria-page';
import { ProfilePage } from './pages/profile-page';

export function App() {
  const { user, loading } = useAuth();

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

  return (
    <AppShell>
      <Routes>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/meus-cursos" element={<MyCoursesPage />} />
        <Route path="/curso/:slug" element={<CoursePlayerPage />} />
        <Route path="/curso/:slug/certificado" element={<CertificatePage />} />
        <Route path="/secretaria" element={<SecretariaPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </AppShell>
  );
}
