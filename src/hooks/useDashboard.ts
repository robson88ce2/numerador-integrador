import { useEffect, useMemo, useState } from 'react';
import { Delegacia, Documento, IndexInfo, FormState, EditFormState } from '../types/app';

export function useDashboard(role?: 'superuser' | 'delegacia', delegacia?: { id: number; nome: string; codigo: string; username: string } | null) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [delegacias, setDelegacias] = useState<Delegacia[]>([]);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [filterAno, setFilterAno] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState<FormState>({ nome: '', codigo: '', username: '', senha: '', senha2: '' });
  const [editTarget, setEditTarget] = useState<Delegacia | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ nome: '', codigo: '', username: '' });
  const [selectedDelegaciaId, setSelectedDelegaciaId] = useState<number | null>(null);
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [tipoIndice, setTipoIndice] = useState('Oficio');
  const [numeroInicial, setNumeroInicial] = useState(1);
  const [selectedDelegaciaForConfig, setSelectedDelegaciaForConfig] = useState('');
  const [destino, setDestino] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('Oficio');
  const [generatedNumber, setGeneratedNumber] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!role) return;
    setActiveTab(role === 'superuser' ? 'Delegacias' : 'Gerar Documento');
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
    }
  }, [role]);

  useEffect(() => {
    if (!selectedDelegaciaId) return;
    const index = indices.find((item) => item.tipo === tipoIndice);
    setNumeroInicial(index?.numero_inicial ?? 1);
  }, [tipoIndice, indices, selectedDelegaciaId]);

  const anos = useMemo(() => {
    return Array.from(new Set(docs.map((doc) => String(doc.ano))))
      .sort((a, b) => Number(b) - Number(a));
  }, [docs]);

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

  const loadDelegaciaIndices = async (delegaciaId: number, nome: string) => {
    const res = await fetch(`/api/indices?delegaciaId=${delegaciaId}`);
    if (res.ok) {
      setIndices(await res.json());
      setSelectedDelegaciaId(delegaciaId);
      setSelectedDelegaciaForConfig(nome);
      setStatusMessage('');
      return;
    }
    const error = await res.json();
    setStatusMessage(error?.error || 'Erro ao carregar configuração de numeração.');
  };

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
      setGeneratedNumber(json.numero);
      setFeedback('Número gerado com sucesso!');
      setDestino('');
      const docsRes = await fetch('/api/documentos');
      if (docsRes.ok) {
        setDocs(await docsRes.json());
      }
      return;
    }

    const error = await res.json();
    setFeedback(error?.error || 'Erro ao gerar documento.');
  };

  const handleCopyNumber = async () => {
    if (!generatedNumber) return;
    await navigator.clipboard.writeText(generatedNumber);
    setCopySuccess('Número copiado!');
    window.setTimeout(() => setCopySuccess(''), 2500);
  };

  return {
    activeTab,
    setActiveTab,
    delegacias,
    docs,
    filterTipo,
    setFilterTipo,
    filterAno,
    setFilterAno,
    searchTerm,
    setSearchTerm,
    anos,
    formState,
    setFormState,
    editTarget,
    setEditTarget,
    editForm,
    setEditForm,
    selectedDelegaciaId,
    selectedDelegaciaForConfig,
    tipoIndice,
    setTipoIndice,
    numeroInicial,
    setNumeroInicial,
    indices,
    selectedTipo,
    setSelectedTipo,
    destino,
    setDestino,
    generatedNumber,
    copySuccess,
    feedback,
    statusMessage,
    loadDelegaciaIndices,
    handleCreateDelegacia,
    handleUpdateDelegacia,
    handleDeleteDelegacia,
    handleSaveNumeroInicial,
    handleGenerateDocument,
    handleCopyNumber,
    setStatusMessage,
    setFeedback,
  };
}
