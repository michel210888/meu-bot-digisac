
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Boleto } from '../types';

interface DashboardProps {
  boletos: Boleto[];
}

const Dashboard: React.FC<DashboardProps> = ({ boletos }) => {
  // Função para calcular dias de atraso baseada no formato DD/MM/YYYY
  const calculateDaysOverdue = (dueDateStr: string) => {
    try {
      const parts = dueDateStr.split('/');
      if (parts.length !== 3) return 0;
      const dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  };

  const overdueStats = {
    onTime: 0,
    late1_7: 0,
    late8_15: 0,
    late15Plus: 0
  };

  boletos.forEach(b => {
    if (b.status === 'sent') return; 
    const days = calculateDaysOverdue(b.dueDate);
    if (days === 0) overdueStats.onTime++;
    else if (days <= 7) overdueStats.late1_7++;
    else if (days <= 15) overdueStats.late8_15++;
    else overdueStats.late15Plus++;
  });

  const pieData = [
    { name: 'No Prazo', value: overdueStats.onTime, color: '#10b981' },
    { name: '1-7 Dias', value: overdueStats.late1_7, color: '#f59e0b' },
    { name: '8-15 Dias', value: overdueStats.late8_15, color: '#f97316' },
    { name: '15+ Dias', value: overdueStats.late15Plus, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const stats = {
    total: boletos.length,
    sent: boletos.filter(b => b.status === 'sent').length,
    failed: boletos.filter(b => b.status === 'failed').length,
    pending: boletos.filter(b => b.status === 'pending' || b.status === 'processing').length,
    totalValue: boletos.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
  };

  const chartData = [
    { name: 'Enviados', value: stats.sent, color: '#10b981' },
    { name: 'Pendentes', value: stats.pending, color: '#f59e0b' },
    { name: 'Falhas', value: stats.failed, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Boletos', value: stats.total, color: 'text-white' },
          { label: 'Valor Acumulado', value: `R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-indigo-400' },
          { label: 'Sucesso no Envio', value: stats.sent, color: 'text-emerald-400' },
          { label: 'Aguardando', value: stats.pending, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Status dos Disparos</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Faixas de Atraso (Pendentes)</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {pieData.length === 0 && <div className="text-center py-10 text-slate-600 font-bold text-xs uppercase">Tudo em dia!</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
