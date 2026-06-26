import { Search, Bell, UserCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface HeaderProps {
  userName: string;
  delegaciaName?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function Header({ userName, delegaciaName, searchTerm, onSearchChange }: HeaderProps) {
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <div>
          <span className="page-overline">Painel</span>
          <h1 className="page-title">Bem-vindo, {userName}</h1>
          <p className="page-subtitle">{delegaciaName ? `Delegacia ${delegaciaName}` : 'Acompanhe a numeração oficial e documentos emitidos.'}</p>
        </div>
      </div>

      <div className="dashboard-header-right">
        <label className="search-field">
          <Search size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar documentos, protocolos..."
            aria-label="Buscar documentos"
          />
        </label>
        <button type="button" className="icon-button" aria-label="Notificações">
          <Bell size={18} />
        </button>
        <div className="avatar-pill">
          <UserCircle size={20} />
          <div>
            <span>Olá, {userName}</span>
            <strong>{delegaciaName ?? 'Superusuário'}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}
