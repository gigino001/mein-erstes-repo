import { Navigate, Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Spinner, Toasts } from "./components/ui";
import { AuthPage } from "./pages/Auth";
import { HomePage } from "./pages/Home";
import { InspoPage } from "./pages/Inspo";
import { Onboarding } from "./pages/Onboarding";
import { OutfitsPage } from "./pages/Outfits";
import { ProfilePage } from "./pages/Profile";
import { WardrobePage } from "./pages/Wardrobe";
import { useApp } from "./state/AppContext";

export function App() {
  const { phase, profile } = useApp();
  let body;
  if (phase === "loading") body = <Spinner />;
  else if (phase === "auth") body = <AuthPage />;
  else if (!profile?.onboarded) body = <Onboarding />;
  else body = (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pb-32 lg:ml-60 lg:max-w-none lg:px-12 lg:pb-16">
        <div className="mx-auto max-w-3xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/schrank" element={<WardrobePage />} />
            <Route path="/inspiration" element={<InspoPage />} />
            <Route path="/outfits" element={<OutfitsPage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </>
  );
  return <>{body}<Toasts /></>;
}
