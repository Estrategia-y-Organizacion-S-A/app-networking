import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import MiAgenda from './pages/MiAgenda';
import MiPerfil from './pages/MiPerfil';
import Networking from './pages/Networking';
import Admin from './pages/Admin';
import CookieBanner from './components/layout/CookieBanner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mi-agenda" element={<MiAgenda />} />
        <Route path="/mi-perfil" element={<MiPerfil />} />
        <Route path="/networking" element={<Networking />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <CookieBanner />
    </Router>
  );
}

export default App;
