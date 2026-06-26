import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { ensureSchema } from '../../lib/schema';
import { fetchDocs, saveDocumento } from '../../lib/auth';

const handler: NextApiHandler = async (req, res) => {
  await ensureSchema();
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  try {
    if (req.method === 'GET') {
      if (session.user?.role === 'superuser') {
        const docs = await fetchDocs();
        return res.status(200).json(docs);
      }

      const delegacia = session.user?.delegacia;
      if (!delegacia) {
        return res.status(403).json({ error: 'Delegacia não encontrada.' });
      }
      const docs = await fetchDocs(delegacia.id);
      return res.status(200).json(docs);
    }

    if (req.method === 'POST') {
      if (session.user?.role !== 'delegacia') {
        return res.status(403).json({ error: 'Apenas delegacias podem gerar documentos.' });
      }
      const delegacia = session.user?.delegacia;
      if (!delegacia) {
        return res.status(403).json({ error: 'Delegacia não encontrada.' });
      }
      const { tipo, destino, data_emissao } = req.body;
      const numero = await saveDocumento(delegacia.id, delegacia.codigo, tipo, destino || '', data_emissao);
      return res.status(201).json({ numero });
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Erro interno.' });
  }
};

export default handler;
