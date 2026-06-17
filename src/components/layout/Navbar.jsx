import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Leaf, Calendar, Settings, Menu, X, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import { getAttendeeSession, clearAttendeeSession } from "@/lib/attendeeAuth";

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const attendee = getAttendeeSession();

  const handleLogout = () => {
    clearAttendeeSession();
    window.location.href = "/";
  };

  const navLinks = [];
  
  if (!attendee || attendee.asistira !== false) {
    navLinks.push({ to: "/mi-agenda", label: "A miña Axenda" });
  }
  
  navLinks.push({ to: "/networking", label: "Networking" });

  if (attendee) {
    navLinks.push({ to: "/mi-perfil", label: "O meu Perfil" });
  } else {
    navLinks.unshift({ to: "/login", label: "Acceder / Rexistro" });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <img 
              src="/logo.png" 
              alt="Galicia Suroeste Logo" 
              className="h-10 w-auto" 
              style={{ filter: "invert(34%) sepia(93%) saturate(2521%) hue-rotate(167deg) brightness(95%) contrast(102%)" }}
            />
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant={isActive(to) ? "default" : "ghost"}
                  size="sm"
                  className="text-sm"
                  style={isActive(to) ? { backgroundColor: '#00869d', color: 'white' } : {}}
                >
                  {label}
                </Button>
              </Link>
            ))}
            
            {attendee && (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground gap-1 ml-2">
                <LogOut className="w-4 h-4" /> Pechar sesión
              </Button>
            )}

            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="flex sm:hidden items-center gap-1">
            <Link to="/admin" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(o => !o)} aria-label="Menú">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden overflow-hidden border-t border-border bg-white"
          >
            <div className="flex flex-col px-4 py-3 gap-1">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant={isActive(to) ? "default" : "ghost"}
                    className="w-full justify-start text-sm"
                    style={isActive(to) ? { backgroundColor: '#00869d', color: 'white' } : {}}
                  >
                    {label}
                  </Button>
                </Link>
              ))}
              
              {attendee && (
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-sm text-muted-foreground gap-2 mt-2">
                  <LogOut className="w-4 h-4" /> Pechar sesión
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
