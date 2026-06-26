import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextApiHandler } from 'next';
import { verifyPw, findDelegaciaByUsername } from '../../../lib/auth';
import { ensureSchema } from '../../../lib/schema';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        await ensureSchema();

        const { username, password } = credentials;
        const superuserUsername = process.env.SUPERUSER_USERNAME;
        const superuserPassword = process.env.SUPERUSER_PASSWORD;

        if (username === superuserUsername && password === superuserPassword) {
          return {
            id: 'superuser',
            name: 'Superusuário',
            role: 'superuser',
          };
        }

        const delegacia = await findDelegaciaByUsername(username);
        if (delegacia && delegacia.ativa && delegacia.senha_hash && verifyPw(password, delegacia.senha_hash)) {
          return {
            id: String(delegacia.id),
            name: delegacia.nome,
            role: 'delegacia',
            delegacia: {
              id: delegacia.id,
              nome: delegacia.nome,
              codigo: delegacia.codigo,
              username: delegacia.username,
            },
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = (user as any).role;
        token.delegacia = (user as any).delegacia || null;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user = {
        ...(session.user ?? {}),
        role: token.role as string,
        delegacia: token.delegacia ?? null,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler: NextApiHandler = async (req, res) => {
  await ensureSchema();
  return NextAuth(req, res, authOptions);
};

export default handler;
