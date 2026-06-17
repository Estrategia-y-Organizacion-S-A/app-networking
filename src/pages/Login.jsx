import PageLayout from "@/components/layout/PageLayout";
import AttendeeLogin from "@/pages/AttendeeLogin";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  return (
    <PageLayout>
      <div className="max-w-md mx-auto px-4 py-20">
        <AttendeeLogin onLogin={() => navigate("/mi-agenda")} redirectLabel="la plataforma" />
      </div>
    </PageLayout>
  );
}
