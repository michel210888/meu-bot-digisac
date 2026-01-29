
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Boleto } from '../types';

interface DashboardProps {
  boletos: Boleto[];
}

const Dashboard: React.FC<DashboardProps> = ({ boletos }) => {
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

  const recentBoletos = [...boletos].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Boletos', value: stats.total, color: 'text-white', bg: 'bg-slate-900' },
          { label: 'Valor Acumulado', value: `R$ ${(stats.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-indigo-400', bg: 'bg-slate-900' },
          { label: 'Sucesso no Envio', value: stats.sent, color: 'text-emerald-400', bg: 'bg-slate-900' },
          { label: 'Aguardando', value: stats.pending, color: 'text-amber-400', bg: 'bg-slate-900' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-8 rounded-2xl border border-slate-800 shadow-xl shadow-black/20 hover:border-slate-700 transition-all group`}>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Performance de Disparos</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Taxa de Conversão</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {chartData.map(c => (
              <div key={c.name} className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: c.color }} />
                <span className="text-[9px] text-slate-500 font-black uppercase">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 bg-slate-800/20">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Últimas Movimentações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                <th className="px-8 py-5">Identificação do Cliente</th>
                <th className="px-8 py-5">Vencimento</th>
                <th className="px-8 py-5 text-right">Valor</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentBoletos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-600 italic font-medium">
                    Nenhum registro encontrado no sistema.
                  </td>
                </tr>
              ) : (
                recentBoletos.map((boleto) => (
                  <tr key={boleto.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-200 group-hover:text-white">{boleto.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{boleto.phone}</div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-400 font-medium">{boleto.dueDate}</td>
                    <td className="px-8 py-6 text-sm font-black text-indigo-400 text-right">
                      R$ {(Number(boleto.amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        boleto.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        boleto.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {boleto.status === 'sent' ? 'Enviado' : boleto.status === 'failed' ? 'Falha' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
