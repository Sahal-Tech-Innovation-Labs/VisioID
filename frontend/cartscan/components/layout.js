"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, UserPlus, Users,
  MapPin, ChevronDown, Menu, X, LogOut, ShieldCheck
} from "lucide-react";

const navItems = [
  { icon: UserPlus, label: "Nouvelle Entrée", path: "/" },
  { icon: Users,    label: "Visiteurs",       path: "/list" },
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const isAdmin = user?.role === "admin";

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric"
  });

  const initiales = user ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}` : "?";
  const nomComplet = user ? `${user.prenom} ${user.nom}` : "Chargement...";
  const roleLabel = isAdmin ? "Administrateur" : "Agent de sécurité";

  // Navigation items filtrés selon le rôle (les vigiles voient tout sauf gestion comptes)
  const navItemsFiltered = [
    ...(isAdmin ? [{ icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard" }] : []),
    ...navItems,
    ...(isAdmin ? [{ icon: ShieldCheck, label: "Gestion comptes", path: "/admin/users" }] : []),
  ];

  const UserBlock = () => (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0 text-xs font-bold">
          {initiales}
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white/90 leading-none truncate">{nomComplet}</p>
            <p className="text-[10px] text-white/50 mt-0.5">{roleLabel}</p>
          </div>
        )}
        {sidebarOpen && (
          <button onClick={handleLogout} title="Déconnexion"
            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors shrink-0">
            <LogOut style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f0f3f8] overflow-hidden">

      {/* Sidebar desktop */}
      <aside
        className="hidden md:flex flex-col h-full bg-[#0f1e3d] text-white shrink-0 transition-all duration-300"
        style={{ width: sidebarOpen ? "220px" : "64px" }}
      >
        <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10">
          <div className="relative w-10 h-8 shrink-0">
            <Image src="/images/sahal.jpeg" alt="Logo Sahal Tech" fill className="object-contain" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold tracking-widest text-white/90 uppercase leading-none">CNI SCAN</p>
              <p className="text-[10px] text-white/50 mt-0.5">Numérisation documents</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItemsFiltered.map((item) => {
            const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
            return (
              <Link key={item.label} href={item.path}>
                <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? "bg-[#1d4ed8] text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}>
                  <item.icon style={{ width: 18, height: 18 }} className="shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
        <UserBlock />
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#0f1e3d] text-white flex flex-col z-50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-8 shrink-0">
                  <Image src="/images/sahal.jpeg" alt="Logo Sahal Tech" fill className="object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest text-white/90 uppercase leading-none">CNI SCAN</p>
                  <p className="text-[10px] text-white/50 mt-0.5">Numérisation documents</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
              {navItemsFiltered.map((item) => {
                const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
                return (
                  <Link key={item.label} href={item.path} onClick={() => setMobileOpen(false)}>
                    <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive ? "bg-[#1d4ed8] text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}>
                      <item.icon style={{ width: 18, height: 18 }} className="shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-4 border-t border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0 text-xs font-bold">{initiales}</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-white/90 leading-none truncate">{nomComplet}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{roleLabel}</p>
              </div>
              <button onClick={handleLogout} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-red-400">
                <LogOut style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <Menu style={{ width: 18, height: 18 }} />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <Menu style={{ width: 18, height: 18 }} />
          </button>

          <div className="flex-1" />

          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline">Sahal Tech Innovation Labs</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          <span className="text-xs sm:text-sm text-gray-500 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5">
            {dateStr}
          </span>

          <div
            onClick={handleLogout}
            title="Déconnexion"
            className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-red-600 transition-colors"
          >
            {initiales}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}