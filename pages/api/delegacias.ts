import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { ensureSchema } from '../../lib/schema';
import {
  createDelegacia,
  listDelegacias,
  updateDelegacia,
  toggleDelegacia,
  changeDelegaciaPassword,
  deleteDelegacia,
} from '../../lib/auth';

const handler: NextApiHandler = async (req, res) => {
  await ensureSchema();
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user?.role !== 'superuser') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  const { method } = req;

  try {
    if (method === 'GET') {
      const delegacias = await listDelegacias();
      return res.status(200).json(delegacias);
    }

    if (method === 'POST') {
      const { action, nome, codigo, username, password } = req.body;
      if (action !== 'create') {
        return res.status(400).json({ error: 'Ação inválida.' });
      }
      await createDelegacia(nome, codigo, username, password);
      const delegacias = await listDelegacias();
      return res.status(201).json(delegacias);
    }

    if (method === 'PUT') {
      const { id, nome, codigo, username } = req.body;
      await updateDelegacia(Number(id), nome, codigo, username);
      const delegacias = await listDelegacias();
      return res.status(200).json(delegacias);
    }

    if (method === 'DELETE') {
      const { id } = req.body;
      await deleteDelegacia(Number(id));
      const delegacias = await listDelegacias();
      return res.status(200).json(delegacias);
    }

    if (method === 'PATCH') {
      const { action, id, ativa, password } = req.body;
      if (action === 'toggle') {
        await toggleDelegacia(Number(id), Boolean(ativa));
        return res.status(200).json({ success: true });
      }
      if (action === 'password') {
        await changeDelegaciaPassword(Number(id), password);
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: 'Ação inválida.' });
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (error: any) {
    const message = error?.message || 'Erro interno.';
    return res.status(500).json({ error: message });
  }
};

export default handler;
