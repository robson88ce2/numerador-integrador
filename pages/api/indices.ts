import type { NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { ensureSchema } from "../../lib/schema";
import {
  getIndicesDeDelegacia,
  setNumeroInicial,
} from "../../lib/auth";

const handler: NextApiHandler = async (req, res) => {
  await ensureSchema();

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(403).json({
      error: "Acesso negado.",
    });
  }

  try {
    if (req.method === "GET") {
      const delegaciaId = Number(req.query.delegaciaId);

      if (!delegaciaId) {
        return res.status(400).json({
          error: "Delegacia inválida.",
        });
      }

      const indices = await getIndicesDeDelegacia(delegaciaId);

      return res.status(200).json(indices);
    }

    if (req.method === "PATCH") {
      if (session.user?.role !== "superuser") {
        return res.status(403).json({
          error: "Somente o superusuário pode alterar a numeração.",
        });
      }

      const {
        delegaciaId,
        tipo,
        numeroInicial,
      } = req.body;

      await setNumeroInicial(
        Number(delegaciaId),
        tipo,
        Number(numeroInicial)
      );

      return res.status(200).json({
        success: true,
      });
    }

    return res.status(405).json({
      error: "Método não permitido.",
    });

  } catch (error: any) {
  console.error("ERRO INDICES:", error);

  return res.status(500).json({
    error: error.message,
    stack: error.stack,
  });
}

};

export default handler;