import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { BarChart3, TrendingUp, TrendingDown, Minus, Bug, TestTube, FolderKanban, Shield, Activity } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { dashboardService, GraphiqueDonnee } from '../services/dashboardService';

function MiniBarChart({ data, height = 110 }: { data: GraphiqueDonnee[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.valeur), 1);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="flex items-end gap-2 pt-2 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{d.valeur}</span>
          <div
            className="w-full rounded-sm transition-all ease-out"
            style={{
              height: grown ? `${(d.valeur / max) * (height - 36)}px` : 0,
              backgroundColor: d.couleur || '#3b82f6',
              transitionDuration: '200ms',
            }}
          />
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function KPICard({ kpi }: { kpi: ReturnType<typeof dashboardService.calculerKPIs>[number] }) {
  const icons: Record<string, React.ElementType> = { folder: FolderKanban, bug: Bug, test: TestTube, alert: Shield, check: Activity, clipboard: BarChart3 };
  const Icon = icons[kpi.icon || ''] || Activity;

  return (
    <Card className="border-slate-200/80 shadow-none bg-white transition-colors duration-150 hover:border-slate-300">
      <CardContent className="py-2.5 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">{kpi.label}</p>
            <div className="flex items-baseline gap-1.5">
              <p className={`text-base font-bold tabular-nums tracking-tight ${kpi.color || 'text-slate-900'}`}>{kpi.valeur}</p>
              {kpi.tendance === 'up' && <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0 self-center" />}
              {kpi.tendance === 'down' && <TrendingDown className="w-3 h-3 text-rose-600 shrink-0 self-center" />}
              {kpi.tendance === 'stable' && <Minus className="w-3 h-3 text-slate-400 shrink-0 self-center" />}
            </div>
          </div>
          <div className="p-1.5 rounded bg-slate-100 text-slate-600 shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutChart({ data, size = 100 }: { data: GraphiqueDonnee[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.valeur, 0) || 1;
  let cumul = 0;
  const segments = data.map((d) => {
    const pct = (d.valeur / total) * 100;
    const start = cumul;
    cumul += pct;
    return { ...d, start, pct };
  });
  const r = size / 2 - 10;

  return (
    <div className="flex items-center justify-between gap-6 py-1 w-full max-w-sm mx-auto">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
        {segments.map((seg, i) => {
          const dashArray = `${(seg.pct / 100) * 2 * Math.PI * r} ${2 * Math.PI * r}`;
          const dashOffset = -(seg.start / 100) * 2 * Math.PI * r;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.couleur}
              strokeWidth={10}
              strokeLinecap="butt"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-slate-900">{total}</text>
        <text x={size / 2} y={size / 2 + 10} textAnchor="middle" dominantBaseline="middle" className="text-[8px] font-semibold fill-slate-400 uppercase tracking-wider">TOTAL</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.couleur }} />
              <span className="text-slate-600 truncate text-[11px]">{d.label}</span>
            </div>
            <span className="font-semibold text-slate-900 tabular-nums text-[11px]">{d.valeur}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { anomalies, campagnes, projets, testCases } = useData();
  const [scope, setScope] = useState<'global' | 'projet'>('global');

  const kpis = useMemo(() => dashboardService.calculerKPIs(anomalies, campagnes, projets, testCases), [anomalies, campagnes, projets, testCases]);
  const statsAnomalies = useMemo(() => dashboardService.graphiqueStatutsAnomalies(anomalies), [anomalies]);
  const statsPriorites = useMemo(() => dashboardService.graphiquePriorites(anomalies), [anomalies]);

  return (
    <div className="w-full space-y-4 px-4 py-2 animate-in fade-in duration-150">
      {/* 1. En-tête (Pleine largeur) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-900 text-white">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Tableau de bord</h1>
            <p className="text-xs text-slate-500 mt-0.5">Vue d'ensemble de la qualité logicielle</p>
          </div>
        </div>
        <div className="flex gap-0.5 p-0.5 bg-slate-100 rounded-md border border-slate-200">
          {(['global', 'projet'] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant="ghost"
              className={`h-7 px-3 text-xs font-medium rounded-sm ${
                scope === s ? 'bg-white text-slate-900 shadow-xs hover:bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-transparent'
              }`}
              onClick={() => setScope(s)}
            >
              {s === 'global' ? 'Global' : 'Par projet'}
            </Button>
          ))}
        </div>
      </div>

      {/* 2. KPIs (Grille 6 colonnes sur toute la largeur) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
        {kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
      </div>

      {/* 3. Graphiques (2 colonnes 50 / 50 côte à côte) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        <Card className="border-slate-200/80 shadow-none">
          <CardHeader className="py-2.5 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">Statut des anomalies</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {statsAnomalies.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucune anomalie enregistrée</p>
            ) : (
              <DonutChart data={statsAnomalies} />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-none">
          <CardHeader className="py-2.5 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">Répartition par priorité</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {statsPriorites.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucune anomalie enregistrée</p>
            ) : (
              <MiniBarChart data={statsPriorites} height={110} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Projets récents (Tableau en bas sur toute la largeur) */}
      <Card className="border-slate-200/80 shadow-none w-full">
        <CardHeader className="py-2.5 px-4 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">Projets récents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projets.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Aucun projet actif</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-4">Projet</th>
                    <th className="py-2 px-4">Statut</th>
                    <th className="py-2 px-4">Campagnes</th>
                    <th className="py-2 px-4 text-right">Anomalies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projets.slice(0, 5).map((p) => {
                    const pCampagnes = campagnes.filter((c) => c.projetId === p.id);
                    const pAnomalies = anomalies.filter((a) => pCampagnes.some((c) => c.id === a.campagneId));
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => navigate(`/projets/${p.id}`)}
                      >
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{p.nom}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="border-slate-200 text-slate-600 font-normal text-[10px] py-0 h-4">
                            {p.statut}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 tabular-nums">{pCampagnes.length}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
                              pAnomalies.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {pAnomalies.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}