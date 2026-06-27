"use client";

import { BarChart3, Dumbbell, UtensilsCrossed, Camera, Award, Users } from "lucide-react";

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-blue-500">{icon}</div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default function FamilyStatsPage({ stats, chartData }: { stats: any; chartData: any }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Dumbbell className="w-6 h-6" />} label="Total Workouts" value={stats?.totalWorkouts ?? 0} />
        <StatCard icon={<UtensilsCrossed className="w-6 h-6" />} label="Last Month Dining" value={`$${(stats?.lastMonthDiningTotal ?? 0).toFixed(0)}`} />
        <StatCard icon={<UtensilsCrossed className="w-6 h-6" />} label="All-Time Dining" value={`$${(stats?.totalDining ?? 0).toFixed(0)}`} />
        <StatCard icon={<Camera className="w-6 h-6" />} label="Photos Taken" value={stats?.photosTaken ?? 0} />
        <StatCard icon={<Award className="w-6 h-6" />} label="Achievements" value={stats?.achievementsEarned ?? 0} />
        <StatCard icon={<Users className="w-6 h-6" />} label="Family Members" value={stats?.familyMembers ?? 0} />
      </div>

      {chartData && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSection title="Monthly Dining Spending" data={chartData.monthlyDining} color="text-blue-500" />
          <ChartSection title="Monthly Workouts" data={chartData.monthlyWorkouts} color="text-green-500" />
          <ChartSection title="Monthly Todos" data={chartData.monthlyTodos} color="text-purple-500" />
          <ChartSection title="Monthly Photo Uploads" data={chartData.monthlyPhotoUploads} color="text-orange-500" />
        </div>
      )}
    </div>
  );
}

function ChartSection({ title, data, color }: { title: string; data: { month: string; value: number }[]; color: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        <BarChart3 className={`w-4 h-4 ${color}`} />
        {title}
      </h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-gray-500">{Math.round(d.value)}</span>
            <div className="w-full rounded-t" style={{ height: `${(d.value / maxVal) * 100}%`, backgroundColor: color.includes("blue") ? "#3B82F6" : color.includes("green") ? "#22C55E" : color.includes("purple") ? "#A855F7" : "#F97316" }} />
            <span className="text-[9px] text-gray-400">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
