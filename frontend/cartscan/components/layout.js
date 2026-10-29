"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import PwaRegister from "./PwaRegister";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  MapPin,
  ChevronDown,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Building2,
} from "lucide-react";

const navItems = [
  { icon: UserPlus, label: "Nouvelle Entrée", path: "/" },
  { icon: Users, label: "Visiteurs", path: "/list" },
];

/* =========================================================
   BLOC UTILISATEUR
   Placé en dehors de Layout pour éviter de recréer
   le composant à chaque rendu de Layout.
========================================================= */

function UserBlock({
  initiales,
  nomComplet,
  roleLabel,
  sidebarOpen,
  handleLogout,
}) {
  return (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0 text-xs font-bold">
          {initiales}
        </div>

        {/* Informations utilisateur */}
        {sidebarOpen && (
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white/90 leading-none truncate">
              {nomComplet}
            </p>

            <p className="text-[10px] text-white/50 mt-0.5">
              {roleLabel}
            </p>
          </div>
        )}

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors text-xs font-medium shrink-0"
        >
          <LogOut style={{ width: 12, height: 12 }} />

          {sidebarOpen && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   LAYOUT PRINCIPAL
========================================================= */

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

   
  /* =======================================================
     Récupération de l'utilisateur connecté
  ======================================================= */

  useEffect(() => {
  const loadUser = () => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      setUser(null);
    }
  };

  loadUser();

  window.addEventListener("userUpdated", loadUser);

  return () => {
    window.removeEventListener("userUpdated", loadUser);
  };
}, []);

  /* =======================================================
     Fermer le menu mobile lors du changement de page
  ======================================================= */

  useEffect(() => {
    Promise.resolve().then(() => setMobileOpen(false));
  }, [pathname]);


    if (["/login", "/register", "/verify-email", "/resend-verification"].includes(pathname)) {
    return children;
  }
  /* =======================================================
     Déconnexion
  ======================================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    document.cookie = "token=; path=/; max-age=0";

    router.push("/login");
  };

  /* =======================================================
     Informations utilisateur
  ======================================================= */

    const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const entrepriseItems =
    user?.role === "super_admin"
      ? [
          {
            icon: Building2,
            label: "Entreprises",
            path: "/admin/entreprises",
          },
        ]
      : [];

  const now = new Date();

  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const initiales = user
    ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`
    : "?";

  const nomComplet = user
    ? `${user.prenom || ""} ${user.nom || ""}`.trim()
    : "Chargement...";

     const roleLabel =
    user?.role === "super_admin"
      ? "Super administrateur"
      : isAdmin
      ? "Administrateur"
      : "";

  /* =======================================================
     Navigation selon le rôle
  ======================================================= */

  const navItemsFiltered = [
    ...(isAdmin
      ? [
          {
            icon: LayoutDashboard,
            label: "Tableau de bord",
            path: "/dashboard",
          },
        ]
      : []),

    ...navItems,

    ...(isAdmin
      ? [
          {
            icon: ShieldCheck,
            label: "Gestion comptes",
            path: "/admin/users",
          },
        ]
      : []),
      ...entrepriseItems,
  ];

  /* =======================================================
     Rendu
  ======================================================= */

  return (
    <div className="flex h-screen bg-[#f0f3f8] overflow-hidden">

      {/* ===================================================
          SIDEBAR DESKTOP
      =================================================== */}

      <aside
        className="hidden md:flex flex-col h-full bg-[#0f1e3d] text-white shrink-0 transition-all duration-300"
        style={{
          width: sidebarOpen ? "220px" : "64px",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10">
         <div className="relative w-8 h-8 shrink-0 rounded-lg overflow-hidden">
            <Image
              src="/icons/icon-192.png"
              alt="Logo CNIScan"
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>

          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold tracking-wide text-white/90 leading-none">
                CNIScan
              </p>

              <p className="text-[10px] text-white/50 mt-0.5">
                Numérisation documents
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItemsFiltered.map((item) => {
            const isActive =
              item.path === "/"
                ? pathname === "/"
                : pathname.startsWith(item.path);

            return (
              <Link key={item.label} href={item.path}>
                <div
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#1d4ed8] text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon
                    style={{
                      width: 18,
                      height: 18,
                    }}
                    className="shrink-0"
                  />

                  {sidebarOpen && (
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Utilisateur */}
        <UserBlock
          initiales={initiales}
          nomComplet={nomComplet}
          roleLabel={roleLabel}
          sidebarOpen={sidebarOpen}
          handleLogout={handleLogout}
        />
      </aside>

      {/* ===================================================
          DRAWER MOBILE
      =================================================== */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />

          <aside
            className="absolute left-0 top-0 h-full w-64 bg-[#0f1e3d] text-white flex flex-col z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header mobile */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
               <div className="relative w-8 h-8 shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src="/icons/icon-192.png"
                    alt="Logo CNIScan"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold tracking-wide text-white/90 leading-none">
                    CNIScan
                  </p>

                  <p className="text-[10px] text-white/50 mt-0.5">
                    Numérisation documents
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60"
              >
                <X
                  style={{
                    width: 18,
                    height: 18,
                  }}
                />
              </button>
            </div>

            {/* Navigation mobile */}
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
              {navItemsFiltered.map((item) => {
                const isActive =
                  item.path === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.label}
                    href={item.path}
                    onClick={() => setMobileOpen(false)}
                  >
                    <div
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[#1d4ed8] text-white"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <item.icon
                        style={{
                          width: 18,
                          height: 18,
                        }}
                        className="shrink-0"
                      />

                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Utilisateur mobile */}
            <div className="px-3 py-4 border-t border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0 text-xs font-bold">
                {initiales}
              </div>

              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-white/90 leading-none truncate">
                  {nomComplet}
                </p>

                <p className="text-[10px] text-white/50 mt-0.5">
                  {roleLabel}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-red-400"
              >
                <LogOut
                  style={{
                    width: 14,
                    height: 14,
                  }}
                />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ===================================================
          CONTENU PRINCIPAL
      =================================================== */}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 shadow-sm">

          {/* Menu mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Menu
              style={{
                width: 18,
                height: 18,
              }}
            />
          </button>

          {/* Menu desktop */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Menu
              style={{
                width: 18,
                height: 18,
              }}
            />
          </button>

          <div className="flex-1" />

          {/* Localisation */}
          {user?.entreprise_nom && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span className="max-w-[200px] truncate">{user.entreprise_nom}</span>
            </div>
          )}

          {/* Installer l'application (PWA) */}
          <PwaRegister />

          {/* Date */}
          <span className="text-xs sm:text-sm text-gray-500 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5">
            {dateStr}
          </span>

          {/* Avatar / déconnexion */}
         <div className="relative">
  {/* Avatar */}
  <button
    onClick={() => setProfileOpen(!profileOpen)}
    title={nomComplet}
    className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
  >
    {initiales}
  </button>

  {/* Menu profil */}
  {profileOpen && (
    <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
      
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {nomComplet}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {roleLabel}
        </p>
      </div>

      <button
        onClick={() => {
          setProfileOpen(false);
          handleLogout();
        }}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut style={{ width: 16, height: 16 }} />
        <span>Déconnexion</span>
      </button>

    </div>
  )}
</div>
        </header>

        {/* Contenu des pages */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}