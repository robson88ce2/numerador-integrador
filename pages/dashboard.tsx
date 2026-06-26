import { useEffect, useMemo, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { Sidebar } from '../src/components/dashboard/Sidebar';
import { Header } from '../src/components/dashboard/Header';

const superuserTabs = ['Delegacias', 'Histórico Global', 'Backup Global', 'Status'];
const delegaciaTabs = ['Gerar Documento', 'Histórico', 'Backup', 'Status'];
const TIPOS_DOCUMENTO = [
  'Oficio', 'Protocolo', 'Despacho', 'Ordem de Missão',
  'Relatório Policial',
  'Verificação de Procedência de Informação - VPI',
  'Carta Precatória Expedida', 'Carta Precatória Recebida',
  'Intimação',
];

type Delegacia = {
  id: number;
  nome: string;
  codigo: string;
  username: string;
  ativa: boolean;
};

type Documento = {
  delegacia: string;
  tipo: string;
  numero: string;
  destino: string;
  data_emissao: string;
  ano: number;
};

type IndexInfo = {
  tipo: string;
  ultimo_numero: number;
  numero_inicial: number;
};

type FormState = {
  nome: string;
  codigo: string;
  username: string;
  senha: string;
  senha2: string;
};

type EditFormState = {
  nome: string;
  codigo: string;
  username: string;
};

function csvEncode(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }
  const encoded = String(value).replace(/"/g, '""');
  return `"${encoded}"`;
}

function buildCsv(rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvEncode).join(',')];
  for (const row of rows) {
    lines.push(headers.map((key) => csvEncode(row[key])).join(','));
  }
  return lines.join('\n');
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<string>('');
  const [delegacias, setDelegacias] = useState<Delegacia[]>([]);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [filterAno, setFilterAno] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState<FormState>({
    nome: '',
    codigo: '',
    username: '',
    senha: '',
    senha2: '',
  });
  const [editTarget, setEditTarget] = useState<Delegacia | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ nome: '', codigo: '', username: '' });
  const [selectedDelegaciaId, setSelectedDelegaciaId] = useState<number | null>(null);
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [tipoIndice, setTipoIndice] = useState(TIPOS_DOCUMENTO[0]);
  const [selectedTipo, setSelectedTipo] = useState(TIPOS_DOCUMENTO[0]);
  const [numeroInicial, setNumeroInicial] = useState(1);
  const [selectedNumeroText, setSelectedNumeroText] = useState('');
  const [selectedDelegaciaForConfig, setSelectedDelegaciaForConfig] = useState<string>('');
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const [selectedDeleteName, setSelectedDeleteName] = useState('');
  const [selectedEditName, setSelectedEditName] = useState('');
  const [destino, setDestino] = useState('');
  const [destinos, setDestinos] = useState<Record<string, string>>({});
  const [generatedNumber, setGeneratedNumber] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const role = session?.user?.role as string | undefined;
  const name = session?.user?.name ?? '';

  useEffect(() => {
    if (!selectedDelegaciaId) {
      return;
    }
    const index = indices.find((item) => item.tipo === tipoIndice);
    setNumeroInicial(index?.numero_inicial ?? 1);
  }, [tipoIndice, indices, selectedDelegaciaId]);

  useEffect(() => {
    if (role) {
      setActiveTab(role === 'superuser' ? 'Delegacias' : 'Gerar Documento');
    }
  }, [role]);

  useEffect(() => {
    async function loadDelegacias() {
      const res = await fetch('/api/delegacias');
      if (res.ok) {
        setDelegacias(await res.json());
      }
    }

    async function loadDocs() {
      const res = await fetch('/api/documentos');
      if (res.ok) {
        setDocs(await res.json());
      }
    }

    if (role === 'superuser') {
      loadDelegacias();
      loadDocs();
    }

    if (role === 'delegacia') {
      loadDocs();
      // load indices for this delegacia so we can show counters
      const did = session?.user?.delegacia?.id;
      if (did) {
        loadDelegaciaIndices(Number(did), session?.user?.delegacia?.nome ?? '');
      }
    }
  }, [role]);

  const filteredDocs = useMemo(() => {
    let filtered = docs;
    if (filterTipo !== 'Todos') {
      filtered = filtered.filter((doc) => doc.tipo === filterTipo);
    }
    if (filterAno !== 'Todos') {
      filtered = filtered.filter((doc) => String(doc.ano) === filterAno);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) => doc.destino.toLowerCase().includes(term) || doc.numero.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [docs, filterTipo, filterAno, searchTerm]);

  const totalDocuments = useMemo(() => docs.length, [docs]);
  const protocolCount = useMemo(
    () => docs.filter((doc) => doc.tipo.toLowerCase().includes('protocolo')).length,
    [docs]
  );
  const backupCount = useMemo(
    () => docs.filter((doc) => doc.tipo.toLowerCase().includes('backup')).length,
    [docs]
  );

  const anos = useMemo(() => {
    const values = Array.from(new Set(docs.map((doc) => String(doc.ano))));
    return values.sort((a, b) => Number(b) - Number(a));
  }, [docs]);

  if (status === 'loading') {
    return <div className="session-loading">Carregando...</div>;
  }

  if (!session) {
    return <div className="session-loading">Acesso negado. Faça login para continuar.</div>;
  }
  const handleCreateDelegacia = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');
    if (formState.senha !== formState.senha2) {
      setFeedback('As senhas não conferem.');
      return;
    }

    const body = {
      action: 'create',
      nome: formState.nome,
      codigo: formState.codigo,
      username: formState.username,
      password: formState.senha,
    };

    const res = await fetch('/api/delegacias', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      setDelegacias(data);
      setFormState({ nome: '', codigo: '', username: '', senha: '', senha2: '' });
      setFeedback('Delegacia criada com sucesso.');
      return;
    }

    const error = await res.json();
    setFeedback(error?.error || 'Erro ao criar delegacia.');
  };

  const startEditDelegacia = (delegacia: Delegacia) => {
    setEditTarget(delegacia);
    setEditForm({ nome: delegacia.nome, codigo: delegacia.codigo, username: delegacia.username });
    setStatusMessage('');
  };

  const cancelEditDelegacia = () => {
    setEditTarget(null);
    setEditForm({ nome: '', codigo: '', username: '' });
    setStatusMessage('');
  };

  const handleUpdateDelegacia = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    setStatusMessage('');

    const res = await fetch('/api/delegacias', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: editTarget.id,
        nome: editForm.nome,
        codigo: editForm.codigo,
        username: editForm.username,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setDelegacias(updated);
      setEditTarget(null);
      setStatusMessage('Delegacia atualizada com sucesso.');
      return;
    }

    const error = await res.json();
    setStatusMessage(error?.error || 'Erro ao atualizar delegacia.');
  };

  const handleDeleteDelegacia = async (id: number, nome: string) => {
    const confirmed = window.confirm(`Excluir a delegacia ${nome}? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    const res = await fetch('/api/delegacias', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      const updated = await res.json();
      setDelegacias(updated);
      setStatusMessage(`Delegacia ${nome} excluída.`);
      if (selectedDelegaciaId === id) {
        setSelectedDelegaciaId(null);
        setIndices([]);
      }
      return;
    }

    const error = await res.json();
    setStatusMessage(error?.error || 'Erro ao excluir delegacia.');
  };

  const loadDelegaciaIndices = async (delegaciaId: number, nome: string) => {
    // Try the indices API (superuser). If forbidden or failing, fall back to recomputing from documentos
    try {
      const res = await fetch(`/api/indices?delegaciaId=${delegaciaId}`);
      if (res.ok) {
        setIndices(await res.json());
        setSelectedDelegaciaId(delegaciaId);
        setSelectedDelegaciaForConfig(nome);
        setStatusMessage('');
        return;
      }
    } catch (e) {
      // ignore and try fallback
    }

    // Fallback: fetch documentos for this delegacia (GET /api/documentos returns only this delegacia when role=delegacia)
    try {
      const docsRes = await fetch('/api/documentos');
      if (!docsRes.ok) {
        const err = await docsRes.json();
        setStatusMessage(err?.error || 'Erro ao carregar documentos para computar índices.');
        return;
      }
      const docsList = await docsRes.json();
      const year = new Date().getFullYear();
      const tipoMap: Record<string, { ultimo_numero: number; numero_inicial: number }> = {};
      for (const d of docsList) {
        if (d.ano !== year) continue;
        const m = String(d.numero).match(/-(\d+)\/\d{4}$/);
        if (!m) continue;
        const num = Number(m[1]);
        const tipo = d.tipo;
        if (!tipoMap[tipo]) tipoMap[tipo] = { ultimo_numero: 0, numero_inicial: 1 };
        if (num > tipoMap[tipo].ultimo_numero) tipoMap[tipo].ultimo_numero = num;
      }
      const recomputed = TIPOS_DOCUMENTO.map((t) => ({ tipo: t, ultimo_numero: tipoMap[t]?.ultimo_numero ?? 0, numero_inicial: tipoMap[t]?.numero_inicial ?? 1 }));
      setIndices(recomputed);
      setSelectedDelegaciaId(delegaciaId);
      setSelectedDelegaciaForConfig(nome);
      setStatusMessage('');
      return;
    } catch (error) {
      setStatusMessage('Erro ao carregar configuração de numeração.');
      return;
    }
  };

  const handleSaveNumeroInicial = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDelegaciaId) return;
    setStatusMessage('');

    const res = await fetch('/api/indices', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        delegaciaId: selectedDelegaciaId,
        tipo: tipoIndice,
        numeroInicial,
      }),
    });

    if (res.ok) {
      await loadDelegaciaIndices(selectedDelegaciaId, selectedDelegaciaForConfig);
      setStatusMessage('Número inicial atualizado com sucesso.');
      return;
    }

    const error = await res.json();
    setStatusMessage(error?.error || 'Erro ao salvar número inicial.');
  };

  const handleGenerateDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');
    const res = await fetch('/api/documentos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tipo: selectedTipo, destino, data_emissao: new Date().toLocaleDateString('pt-BR') }),
    });

    if (res.ok) {
      const json = await res.json();
      setCopySuccess('');
      setGeneratedNumber(json.numero);
      setFeedback('Número gerado com sucesso!');
      setDestino('');
      const docsRes = await fetch('/api/documentos');
      if (docsRes.ok) {
        const newDocs = await docsRes.json();
        setDocs(newDocs);
        const year = new Date().getFullYear();
        const tipoMap: Record<string, { ultimo_numero: number; numero_inicial: number }> = {};
        for (const idxItem of indices) {
          tipoMap[idxItem.tipo] = { ultimo_numero: idxItem.ultimo_numero ?? 0, numero_inicial: idxItem.numero_inicial ?? 1 };
        }
        for (const d of newDocs) {
          if (d.ano !== year) continue;
          const m = String(d.numero).match(/-(\d+)\/\d{4}$/);
          if (!m) continue;
          const num = Number(m[1]);
          const tipo = d.tipo;
          if (!tipoMap[tipo]) tipoMap[tipo] = { ultimo_numero: 0, numero_inicial: 1 };
          if (num > tipoMap[tipo].ultimo_numero) tipoMap[tipo].ultimo_numero = num;
        }
        const recomputed = Object.keys(tipoMap).map((t) => ({ tipo: t, ultimo_numero: tipoMap[t].ultimo_numero, numero_inicial: tipoMap[t].numero_inicial }));
        setIndices(recomputed);
      }
      return;
    }

    const error = await res.json();
    setFeedback(error?.error || 'Erro ao gerar documento.');
  };

  const downloadCsv = (rows: Documento[], filename: string) => {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeTabs = role === 'superuser' ? superuserTabs : delegaciaTabs;

  const displayTypes = indices.length > 0
    ? indices
    : TIPOS_DOCUMENTO.map((t) => ({ tipo: t, ultimo_numero: 0, numero_inicial: 1 }));

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab || activeTabs[0]} onSelectTab={(t) => setActiveTab(t)} onSignOut={() => signOut({ callbackUrl: '/' })} />
      <main className="dashboard-main">
        <Header userName={name} delegaciaName={role === 'delegacia' ? session?.user?.delegacia?.nome : undefined} searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        <div className="page-shell">
          {role === 'delegacia' && session?.user?.delegacia ? (
            <div className="delegacia-banner">
              <span className="banner-icon">🏛️</span>
              <strong>{session.user.delegacia.nome}</strong>
              <span className="code-chip">Código: {session.user.delegacia.codigo}</span>
            </div>
          ) : null}

          <div className="tab-list">
            {activeTabs.map((tab) => (
              <button
                type="button"
                key={tab}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Gerar Documento' && (
            <div className="summary-grid">
              <div className="summary-card">
                <span>Documentos Gerados</span>
                <strong>{totalDocuments}</strong>
                <span className="summary-note">este mês</span>
              </div>
              <div className="summary-card">
                <span>Protocolos Gerados</span>
                <strong>{protocolCount}</strong>
                <span className="summary-note">este mês</span>
              </div>
              <div className="summary-card">
                <span>Backups Realizados</span>
                <strong>{backupCount}</strong>
                <span className="summary-note">este mês</span>
              </div>
              <div className="summary-card summary-card-status">
                <span>Sistema</span>
                <strong>Ativo</strong>
                <span className="summary-note">100% operacional</span>
              </div>
            </div>
          )}

          {role === 'superuser' ? (
            <>
          {activeTab === 'Delegacias' && (
            <div className="grid-two">
              <section className="card">
                <h2>Cadastrar nova delegacia</h2>
                <form onSubmit={handleCreateDelegacia} className="stack-form">
                  <label>
                    Nome
                    <input
                      value={formState.nome}
                      onChange={(event) => setFormState((prev) => ({ ...prev, nome: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Código
                    <input
                      value={formState.codigo}
                      onChange={(event) => setFormState((prev) => ({ ...prev, codigo: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Usuário
                    <input
                      value={formState.username}
                      onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Senha inicial
                    <input
                      type="password"
                      value={formState.senha}
                      onChange={(event) => setFormState((prev) => ({ ...prev, senha: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Confirmar senha
                    <input
                      type="password"
                      value={formState.senha2}
                      onChange={(event) => setFormState((prev) => ({ ...prev, senha2: event.target.value }))}
                      required
                    />
                  </label>
                  {feedback ? <div className="alert">{feedback}</div> : null}
                  <button type="submit" className="button primary">Criar Delegacia</button>
                </form>
              </section>

              <section className="card">
                <h2>Delegacias cadastradas</h2>
                {delegacias.length === 0 ? (
                  <p>Nenhuma delegacia cadastrada ainda.</p>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Código</th>
                          <th>Usuário</th>
                          <th>Ativa</th>
                          <th>Ações</th>
                        </tr>
                  </thead>
                  <tbody>
                    {delegacias.map((item) => (
                      <tr key={item.id}>
                        <td>{item.nome}</td>
                        <td>{item.codigo}</td>
                        <td>{item.username}</td>
                        <td>{item.ativa ? 'Sim' : 'Não'}</td>
                        <td>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => startEditDelegacia(item)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => handleDeleteDelegacia(item.id, item.nome)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => loadDelegaciaIndices(item.id, item.nome)}
                          >
                            Configurar nº inicial
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {editTarget ? (
            <section className="card">
              <h2>Editar Delegacia</h2>
              <form onSubmit={handleUpdateDelegacia} className="stack-form">
                <label>
                  Nome
                  <input
                    value={editForm.nome}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, nome: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Código
                  <input
                    value={editForm.codigo}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, codigo: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Usuário
                  <input
                    value={editForm.username}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))}
                    required
                  />
                </label>
                <div>
                  <button type="submit" className="button primary" style={{ marginRight: '0.75rem' }}>
                    Salvar alterações
                  </button>
                  <button type="button" className="button secondary" onClick={cancelEditDelegacia}>
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          ) : null}
          {selectedDelegaciaId ? (
            <section className="card">
              <h2>Configuração de número inicial</h2>
              <p>Delegacia: <strong>{selectedDelegaciaForConfig}</strong></p>
              <form onSubmit={handleSaveNumeroInicial} className="stack-form">
                <label>
                  Tipo de documento
                  <select value={tipoIndice} onChange={(event) => setTipoIndice(event.target.value)}>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Número inicial desejado
                  <input
                    type="number"
                    min={1}
                    value={numeroInicial}
                    onChange={(event) => setNumeroInicial(Number(event.target.value))}
                    required
                  />
                </label>
                <small>
                  {indices.length > 0 && (
                    <>Último número emitido: <strong>{indices.find((item) => item.tipo === tipoIndice)?.ultimo_numero ?? 0}</strong></>
                  )}
                </small>
                <div>
                  <button type="submit" className="button primary" style={{ marginRight: '0.75rem' }}>
                    Salvar número inicial
                  </button>
                  <button type="button" className="button secondary" onClick={() => setSelectedDelegaciaId(null)}>
                    Fechar
                  </button>
                </div>
              </form>
            </section>
          ) : null}
            </div>
          )}

          {activeTab === 'Histórico Global' && (
            <section className="card">
              <h2>Histórico Global</h2>
              <div className="filters-row">
                <select value={filterTipo} onChange={(event) => setFilterTipo(event.target.value)}>
                  <option>Todos</option>
                  {[...new Set(docs.map((item) => item.tipo))].sort().map((tipo) => (
                    <option key={tipo}>{tipo}</option>
                  ))}
                </select>
                <select value={filterAno} onChange={(event) => setFilterAno(event.target.value)}>
                  <option>Todos</option>
                  {anos.map((ano) => (
                    <option key={ano}>{ano}</option>
                  ))}
                </select>
                <input
                  placeholder="Buscar destino ou número"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Delegacia</th>
                      <th>Tipo</th>
                      <th>Número</th>
                      <th>Destino</th>
                      <th>Data</th>
                      <th>Ano</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => (
                      <tr key={`${doc.numero}-${doc.data_emissao}`}>
                        <td>{doc.delegacia}</td>
                        <td>{doc.tipo}</td>
                        <td>{doc.numero}</td>
                        <td>{doc.destino}</td>
                        <td>{doc.data_emissao}</td>
                        <td>{doc.ano}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="meta">Total: {filteredDocs.length} documento(s)</p>
            </section>
          )}

          {activeTab === 'Backup Global' && (
            <section className="card">
              <h2>Backup Completo</h2>
              <p>Faça download do histórico completo de documentos em CSV.</p>
              <button className="button primary" onClick={() => downloadCsv(docs, 'backup_global.csv')}>
                Baixar backup_global.csv
              </button>
              <p className="meta">Total de registros: {docs.length}</p>
            </section>
          )}

          {activeTab === 'Status' && (
            <section className="card">
              <h2>Status do Sistema</h2>
              <div className="status-card">✅ Sistema online e funcionando normalmente.</div>
            </section>
          )}
        </>
      ) : (
        <>
          {activeTab === 'Gerar Documento' && (
            <section className="card">
              <h2>Gerar Documento</h2>

              <div className="types-grid">
                {displayTypes.map((idx) => (
                    <div className="type-card" key={idx.tipo}>
                      <div className="type-left">
                        <strong>{idx.tipo}</strong>
                        <div className="type-meta">Último: {idx.ultimo_numero ?? 0}</div>
                      </div>
                      <div className="type-actions">
                        <input
                          className="destino-input"
                          placeholder="Destino (opcional)"
                          value={destinos[idx.tipo] ?? ''}
                          onChange={(e) => setDestinos({ ...destinos, [idx.tipo]: e.target.value })}
                        />
                        <button
                          className="button primary"
                          disabled={loadingType === idx.tipo}
                          onClick={async () => {
                            if (loadingType) return;
                            setLoadingType(idx.tipo);
                            const destinoVal = destinos[idx.tipo] ?? '';
                            try {
                              const res = await fetch('/api/documentos', {
                                method: 'POST',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({ tipo: idx.tipo, destino: destinoVal, data_emissao: new Date().toLocaleDateString('pt-BR') }),
                              });
                              if (res.ok) {
                                const json = await res.json();
                                setGeneratedNumber(json.numero);
                                const docsRes = await fetch('/api/documentos');
                                if (docsRes.ok) {
                                  const newDocs = await docsRes.json();
                                  setDocs(newDocs);
                                  // recompute indices from docs for current year so 'Último' updates
                                  const year = new Date().getFullYear();
                                  const tipoMap: Record<string, { ultimo_numero: number; numero_inicial: number }> = {};
                                  for (const idxItem of indices) {
                                    tipoMap[idxItem.tipo] = { ultimo_numero: idxItem.ultimo_numero ?? 0, numero_inicial: idxItem.numero_inicial ?? 1 };
                                  }
                                  for (const d of newDocs) {
                                    if (d.ano !== year) continue;
                                    const m = String(d.numero).match(/-(\d+)\/\d{4}$/);
                                    if (!m) continue;
                                    const num = Number(m[1]);
                                    const tipo = d.tipo;
                                    if (!tipoMap[tipo]) tipoMap[tipo] = { ultimo_numero: 0, numero_inicial: 1 };
                                    if (num > tipoMap[tipo].ultimo_numero) tipoMap[tipo].ultimo_numero = num;
                                  }
                                  const recomputed = Object.keys(tipoMap).map((t) => ({ tipo: t, ultimo_numero: tipoMap[t].ultimo_numero, numero_inicial: tipoMap[t].numero_inicial }));
                                  setIndices(recomputed);
                                }
                              } else {
                                const err = await res.json();
                                setFeedback(err?.error || 'Erro ao gerar número.');
                              }
                            } catch (e) {
                              setFeedback('Erro ao gerar número.');
                            } finally {
                              setLoadingType(null);
                            }
                          }}
                        >
                          {loadingType === idx.tipo ? 'Gerando...' : 'Novo Número'}
                        </button>
                      </div>
                    </div>
                ))}
              </div>

              {generatedNumber ? (
                <p className="meta">
                  Último número gerado: <strong>{generatedNumber}</strong>
                  <button
                    type="button"
                    className="button small"
                    style={{ marginLeft: '0.75rem' }}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(generatedNumber);
                        setCopySuccess('Copiado para a área de transferência');
                        setTimeout(() => setCopySuccess(''), 3000);
                      } catch (e) {
                        setFeedback('Não foi possível copiar o número.');
                      }
                    }}
                  >
                    Copiar
                  </button>
                </p>
              ) : null}
              {copySuccess ? <p className="meta success-text">{copySuccess}</p> : null}
              {feedback ? <p className="meta">{feedback}</p> : null}
            </section>
          )}

          {activeTab === 'Histórico' && (
            <section className="card">
              <h2>Histórico de Documentos</h2>
              <div className="filters-row">
                <select value={filterTipo} onChange={(event) => setFilterTipo(event.target.value)}>
                  <option>Todos</option>
                  {[...new Set(docs.map((item) => item.tipo))].sort().map((tipo) => (
                    <option key={tipo}>{tipo}</option>
                  ))}
                </select>
                <select value={filterAno} onChange={(event) => setFilterAno(event.target.value)}>
                  <option>Todos</option>
                  {anos.map((ano) => (
                    <option key={ano}>{ano}</option>
                  ))}
                </select>
                <input
                  placeholder="Buscar destino"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Número</th>
                      <th>Destino</th>
                      <th>Data</th>
                      <th>Ano</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => (
                      <tr key={`${doc.numero}-${doc.data_emissao}`}>
                        <td>{doc.tipo}</td>
                        <td>{doc.numero}</td>
                        <td>{doc.destino}</td>
                        <td>{doc.data_emissao}</td>
                        <td>{doc.ano}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="meta">Total: {filteredDocs.length} documento(s)</p>
            </section>
          )}

          {activeTab === 'Backup' && (
            <section className="card">
              <h2>Backup de Dados</h2>
              <p>Baixe o histórico de documentos da sua delegacia.</p>
              <button className="button primary" onClick={() => downloadCsv(docs, 'backup_delegacia.csv')}>
                Baixar CSV
              </button>
              <p className="meta">Total de registros: {docs.length}</p>
            </section>
          )}

          {activeTab === 'Status' && (
            <section className="card">
              <h2>Status</h2>
              <div className="status-card">✅ Sistema online e funcionando normalmente.</div>
            </section>
          )}
        </>
      )}
      </div>
    </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
