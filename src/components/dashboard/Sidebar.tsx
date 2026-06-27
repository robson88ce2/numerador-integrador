import { ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  Archive,
  Database,
  Settings,
  Users,
  LogOut,
  Crown,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useSession } from "next-auth/react";

type Delegacia = {
  id: number;
  nome: string;
  codigo: string;
  username: string;
  ativa: boolean;
};

interface SidebarItem {
  label: string;
  value: string;
  icon: ReactNode;
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSignOut: () => void;
  delegacias: Delegacia[];
}

const menuItems: SidebarItem[] = [
  {
    label: "Dashboard",
    value: "Gerar Documento",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Histórico",
    value: "Histórico",
    icon: <FileText size={18} />,
  },
  {
    label: "Backup",
    value: "Backup",
    icon: <Archive size={18} />,
  },
  {
    label: "Delegacias",
    value: "Delegacias",
    icon: <Users size={18} />,
  },
  {
    label: "Histórico Global",
    value: "Histórico Global",
    icon: <Database size={18} />,
  },
  {
    label: "Backup Global",
    value: "Backup Global",
    icon: <Archive size={18} />,
  },
  {
    label: "Status",
    value: "Status",
    icon: <Settings size={18} />,
  },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  onSignOut,
  delegacias,
}: SidebarProps) {
  const { data: session } = useSession();

  const role = session?.user?.role as string | undefined;
  const delegacia = session?.user?.delegacia;

  const delegaciasAtivas = delegacias.filter((d) => d.ativa);

  return (
    <aside className="sidebar-shell">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img
            src="/brasao.png"
            alt="Brasão"
            style={{
              width: 64,
              height: 64,
              objectFit: "contain",
            }}
          />
        </div>

        <div>
          {role === "delegacia" && delegacia ? (
            <>
              <span className="sidebar-title">
                {delegacia.nome}
              </span>

              <p className="sidebar-subtitle">
                {delegacia.codigo}
              </p>
            </>
          ) : (
            <>
              <span className="sidebar-title">
                Superusuário
              </span>

              <p className="sidebar-subtitle">
                ADMINISTRAÇÃO GERAL
              </p>

              <div className="super-pill">
                <Crown size={14} />
                <span>SUPER ADMIN</span>
              </div>
            </>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems
          .filter((item) =>
            role === "delegacia"
              ? item.value !== "Histórico Global" &&
                item.value !== "Backup Global" &&
                item.value !== "Delegacias"
              : true
          )
          .map((item) => (
            <button
              key={item.value}
              className={`sidebar-link ${
                activeTab === item.value ? "active" : ""
              }`}
              onClick={() => onSelectTab(item.value)}
            >
              <span
                className="sidebar-dot"
                style={{
                  background:
                    activeTab === item.value
                      ? "#ef4444"
                      : "transparent",
                }}
              />

              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span className="sidebar-label">
                {item.label}
              </span>
            </button>
          ))}
      </nav>

      {role === "superuser" && (
        <div className="delegacia-list">

          <div className="delegacia-header">
            <strong>Delegacias</strong>
            <span>{delegaciasAtivas.length}</span>
          </div>

          {delegaciasAtivas.length === 0 ? (
            <p className="sidebar-empty">
              Nenhuma delegacia cadastrada.
            </p>
          ) : (
            delegaciasAtivas.map((d) => (
              <div
                className="delegacia-item"
                key={d.id}
              >
                <div className="delegacia-left">
                  <strong>{d.nome}</strong>

                  <span className="delegacia-meta">
                    {d.codigo}

                    <span className="badge badge-green">
                      ● Ativa
                    </span>
                  </span>
                </div>

                <div className="delegacia-actions">
                  ▾
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="sidebar-footer">
        <Button
          variant="ghost"
          size="md"
          onClick={onSignOut}
          className="sidebar-logout"
        >
          <LogOut size={16} />
          Sair
        </Button>
      </div>
    </aside>
  );
}