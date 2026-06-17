import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Solo mostrar si no hay constancia de aceptación previa
    const accepted = localStorage.getItem("cookies_accepted");
    if (!accepted) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookies_accepted", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground max-w-4xl">
        <p>
          Utilizamos cookies técnicas propias necesarias para o correcto funcionamento da plataforma e para manter a túa sesión activa. Non utilizamos cookies de terceiros para seguimento nin publicidade.
          Ao continuar navegando, consideramos que aceptas o seu uso segundo a nosa <a href="https://galiciasuroeste.gal/avisos-legais#cookies" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-foreground">Política de Cookies</a>.
        </p>
      </div>
      <div className="flex-shrink-0">
        <Button onClick={handleAccept} style={{ backgroundColor: '#00869d', color: 'white' }}>
          Entendido
        </Button>
      </div>
    </div>
  );
}
