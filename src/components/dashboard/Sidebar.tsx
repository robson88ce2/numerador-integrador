import { ReactNode } from 'react';
import { LayoutDashboard, FileText, Archive, Database, Settings, Users, LogOut, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSession } from 'next-auth/react';

interface SidebarItem {
  label: string;
  value: string;
  icon: ReactNode;
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSignOut: () => void;
}

const menuItems: SidebarItem[] = [
  { label: 'Dashboard', value: 'Gerar Documento', icon: <LayoutDashboard size={18} /> },
  { label: 'Histórico', value: 'Histórico', icon: <FileText size={18} /> },
  { label: 'Backup', value: 'Backup', icon: <Archive size={18} /> },
  { label: 'Delegacias', value: 'Delegacias', icon: <Users size={18} /> },
  { label: 'Histórico Global', value: 'Histórico Global', icon: <Database size={18} /> },
  { label: 'Backup Global', value: 'Backup Global', icon: <Archive size={18} /> },
  { label: 'Status', value: 'Status', icon: <Settings size={18} /> },
];

export function Sidebar({ activeTab, onSelectTab, onSignOut }: SidebarProps) {
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;
  const delegacia = session?.user?.delegacia;
  return (
    <aside className="sidebar-shell">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img src="/brasao.png" alt="brasao" style={{ width: 64, height: 64, objectFit: 'contain' }} />
        </div>
        <div>
          {role === 'delegacia' && delegacia ? (
            <>
              <span className="sidebar-title">{delegacia.nome}</span>
              <p className="sidebar-subtitle">{delegacia.codigo}</p>
            </>
          ) : (
            <>
              <span className="sidebar-title">Superusuário</span>
              <p className="sidebar-subtitle">ADMINISTRAÇÃO GERAL</p>
              <div className="super-pill"><Crown size={14} /> <span>SUPER ADMIN</span></div>
            </>
          )}
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Menu principal">
        {menuItems
          .filter((m) => (role === 'delegacia' ? m.value !== 'Histórico Global' && m.value !== 'Backup Global' : true))
          .map((item) => (
            <button
              key={item.value}
              type="button"
              className={`sidebar-link ${activeTab === item.value ? 'active' : ''}`.trim()}
              onClick={() => onSelectTab(item.value)}
            >
              <span className="sidebar-dot" aria-hidden style={{ background: activeTab === item.value ? '#ef4444' : 'transparent' }} />
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
      </nav>

      {role !== 'delegacia' && (
        <div className="delegacia-list">
          <div className="delegacia-item">
            <div className="delegacia-left">
              <strong>1ª Delegacia de Amontada</strong>
              <span className="delegacia-meta">566 <span className="badge badge-green">● Ativa</span></span>
            </div>
            <div className="delegacia-actions">▾</div>
          </div>
          <div className="delegacia-item">
            <div className="delegacia-left">
              <strong>1ª Delegacia de Policia Civil de Itapipoca</strong>
              <span className="delegacia-meta">466 <span className="badge badge-green">● Ativa</span></span>
            </div>
            <div className="delegacia-actions">▾</div>
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <Button variant="ghost" size="md" onClick={onSignOut} className="sidebar-logout">
          <LogOut size={16} />
          Sair
        </Button>
      </div>
    </aside>
  );
}
