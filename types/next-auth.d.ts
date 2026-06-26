import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      name: string;
      role: 'superuser' | 'delegacia';
      delegacia?: {
        id: number;
        nome: string;
        codigo: string;
        username: string;
      } | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'superuser' | 'delegacia';
    delegacia?: {
      id: number;
      nome: string;
      codigo: string;
      username: string;
    } | null;
  }
}
