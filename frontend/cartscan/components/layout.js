"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, UserPlus, Users, BarChart3,
  Settings, MapPin, ChevronDown, Menu
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard" },
  { icon: UserPlus,        label: "Nouvelle Entrée", path: "/" },
  { icon: Users,           label: "Visiteurs",       path: "/list" },
 // { icon: BarChart3,       label: "Rapports",        path: "/dashboard" },
  //{ icon: Settings,        label: "Paramètres",      path: "/" },
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric"
  });

  return (
    <div className="flex h-screen bg-[#f0f3f8] overflow-hidden">

      
      <aside
        className="flex flex-col h-full bg-[#0f1e3d] text-white shrink-0 transition-all duration-300"
        style={{ width: sidebarOpen ? "220px" : "64px" }}
      >
        
        <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10">
          <div className="relative w-25 h-15 shrink-0">
            <Image
              src="/images/sahal.jpeg"
              alt="Logo Sahal Tech"
              fill
              className="object-contain"
            />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold tracking-widest text-white/90 uppercase leading-none">
                CNI SCAN
              </p>
              <p className="text-[10px] text-white/50 mt-0.5">Numérisation documents</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === "/"
              ? pathname === "/"
              : pathname.startsWith(item.path);
            return (
              <Link key={item.label} href={item.path}>
                <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#1d4ed8] text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}>
                  <item.icon style={{ width: 18, height: 18 }} className="shrink-0" />
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

        <div className="px-3 py-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0 text-xs font-bold">
            AD
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white/90 leading-none">Admin CNI</p>
              <p className="text-[10px] text-white/50 mt-0.5">Agent de sécurité</p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">

        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu style={{ width: 18, height: 18 }} />
          </button>

          <div className="flex-1" />

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            Shal Tech Innovation Labs
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          <span className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5">
            {dateStr}
          </span>

          <div className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            AD
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}