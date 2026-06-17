import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F9F8]">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
