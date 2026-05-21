"use client";
import { FileText, CreditCard, IdCard, AlertCircle, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import Link from "next/link";

export default function DashboardPage() {
  const statsCards = [
    { title: "Total Documents", value: "247", icon: FileText, color: "bg-blue-900" },
    { title: "Passeports", value: "132", icon: CreditCard, color: "bg-green-600" },
    { title: "Cartes d'identité", value: "98", icon: IdCard, color: "bg-blue-600" },
    { title: "Documents expirés", value: "17", icon: AlertCircle, color: "bg-red-600" },
  ];

  const monthlyData = [
    { mois: "Jan", documents: 45 },
    { mois: "Fév", documents: 52 },
    { mois: "Mar", documents: 38 },
    { mois: "Avr", documents: 61 },
    { mois: "Mai", documents: 48 },
    { mois: "Jun", documents: 55 },
  ];

  const typeData = [
    { name: "Passeport", value: 0 },
    { name: "Carte d'identité", value: 0 },
    { name: "Permis de conduire", value: 0 },
  ];

  const evolutionData = [
    { semaine: "S1", enregistrements: 12 },
    { semaine: "S2", enregistrements: 19 },
    { semaine: "S3", enregistrements: 15 },
    { semaine: "S4", enregistrements: 22 },
    { semaine: "S5", enregistrements: 18 },
    { semaine: "S6", enregistrements: 28 },
    { semaine: "S7", enregistrements: 25 },
    { semaine: "S8", enregistrements: 32 },
  ];

  const COLORS = ["#1e3a8a", "#16a34a", "#2563eb"];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
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

      <div className="grid grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6">
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

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-6">Documents par mois</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="documents" fill="#1e3a8a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

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

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-6">Évolution des enregistrements</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semaine" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="enregistrements" stroke="#16a34a" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}