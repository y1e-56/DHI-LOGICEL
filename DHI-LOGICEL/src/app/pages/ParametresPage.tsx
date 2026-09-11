import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Bell, BellRing, History } from 'lucide-react';
import { NotificationsConfigPage } from './NotificationsConfigPage';
import { AlertesPage } from './AlertesPage';
import { AuditTrailPage } from './AuditTrailPage';

type SectionId = 'notifications' | 'alertes' | 'audit';

export function ParametresPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const sections = useMemo(() => {
    const list: { id: SectionId; label: string; icon: React.ElementType; enabled: boolean }[] = [
      {
        id: 'notifications',
        label: t('parametres.section_notifications'),
        icon: Bell,
        enabled: role === 'admin' || role === 'chef_testeur' || role === 'testeur' || role === 'developpeur',
      },
      {
        id: 'alertes',
        label: t('parametres.section_alertes'),
        icon: BellRing,
        enabled: role === 'admin' || role === 'chef_testeur' || role === 'testeur',
      },
      {
        id: 'audit',
        label: t('parametres.section_audit'),
        icon: History,
        enabled: role === 'admin' || role === 'chef_testeur',
      },
    ];
    return list.filter(s => s.enabled);
  }, [role, t]);

  const [active, setActive] = useState<SectionId>('notifications');
  const activeId = sections.find(s => s.id === active)?.id ?? sections[0]?.id;

  if (!sections.length) {
    return (
      <div className="text-center py-20">
        <Settings className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('parametres.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100">
          <Settings className="w-6 h-6 text-slate-700" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{t('parametres.title')}</h2>
          <p className="text-sm text-gray-500">{t('parametres.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map(section => {
          const Icon = section.icon;
          const estActif = section.id === activeId;
          return (
            <button
              key={section.id}
              onClick={() => setActive(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                estActif
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${estActif ? 'text-white' : 'text-slate-400'}`} />
              {section.label}
            </button>
          );
        })}
      </div>

      {activeId === 'notifications' && <NotificationsConfigPage />}
      {activeId === 'alertes' && <AlertesPage />}
      {activeId === 'audit' && <AuditTrailPage />}
    </div>
  );
}