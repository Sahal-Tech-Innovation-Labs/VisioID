"use client";
import { useState, useEffect } from "react";
import { FileText, CreditCard, IdCard, AlertCircle, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0, expires: 0, cni: 0, passeports: 0, actifs: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  
useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role !== "admin") {
    router.push("/");
  }
}, []);

  useEffect(() => {
    fetchStats();
    fetchMonthlyData();
  }, [period]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/stats`, {
        method: "GET",
      });
      const result = await response.json();
      if (result.success) setStats(result.data);
    } catch (err) {
      console.error("Erreur stats:", err);
    }
  };

  const fetchMonthlyData = async () => {
    try {
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/stats/evolution?period=${period}`);      const result = await response.json();
      if (result.success) setMonthlyData(result.data);
    } catch (err) {
      console.error("Erreur evolution:", err);
    } finally {
      setLoading(false);
    }
  };

 const statsCards = [
  { title: "Total Documents", value: stats.total, icon: FileText, color: "bg-blue-900", filter: "tous" },
  { title: "Passeports", value: stats.passeports, icon: CreditCard, color: "bg-green-600", filter: "passeport" },
  { title: "Cartes d'identité", value: stats.cni, icon: IdCard, color: "bg-blue-600", filter: "cni" },
  { title: "Documents expirés", value: stats.expires, icon: AlertCircle, color: "bg-red-600", filter: "expires" },
];

  const typeData = [
    { name: "Passeport", value: stats.passeports },
    { name: "CNI", value: stats.cni },
  ];

  const COLORS = ["#1e3a8a", "#16a34a", "#2563eb"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Chargement...</p>
      </div>
    );
  }

  return (
   <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-blue-900">Tableau de bord</h1>
        <Link
          href="/list"
          className="flex items-center gap-2 px-4 py-2 text-blue-900 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la liste
        </Link>
      </div>

      {/* KPIs */}
  {/* KPIs */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
  {statsCards.map((stat, index) => (
    <div
      key={index}
      onClick={() => stat.filter && router.push(`/list?filter=${stat.filter}`)}
      className={`bg-white rounded-xl shadow-lg p-6 ${
        stat.filter ? "cursor-pointer hover:shadow-xl transition-all" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
          <stat.icon className="w-6 h-6 text-white" />
        </div>
      </div>

      <h3 className="text-gray-600 text-sm mb-2">{stat.title}</h3>
      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
    </div>
  ))}
</div>

      {/* Sélecteur période */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Période :</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none"
        >
          <option value="day">Par heure (aujourd'hui)</option>
          <option value="month">Par jour (ce mois)</option>
          <option value="year">Par mois (cette année)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Graphique évolution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-6">Évolution des enregistrements</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#1e3a8a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par type */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-6">Répartition par type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}