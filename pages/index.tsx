import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Shield, FileText, Lock, ShieldCheck, Verified } from 'lucide-react';
import { motion } from 'framer-motion';

import { AuthLayout } from '../src/components/layout/AuthLayout';
import { Input } from '../src/components/ui/Input';
import { PasswordInput } from '../src/components/ui/PasswordInput';
import { Button } from '../src/components/ui/Button';
import { Toast } from '../src/components/ui/Toast';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <main className="page-shell">
        <div className="session-loading">Verificando sessão...</div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
        remember,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        setError('Usuário ou senha inválidos.');
        setPassword('');
      } else {
        router.replace('/dashboard');
      }
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="login-center">
        <div className="login-hero">
          <div className="login-logo-wrap">
            <img src="/brasao.png" alt="brasao" className="login-logo" />
          </div>
          <h1 className="login-heading">Sistema de Documentos</h1>
          <p className="login-sub">POLÍCIA CIVIL DO CEARÁ</p>
          <p className="login-copy">
            Acesso restrito aos servidores da Polícia Civil do Estado do Ceará.
          </p>

          <div className="login-benefits">
            <div className="benefit-item">
              <span className="benefit-icon"><ShieldCheck size={18} /></span>
              <div>
                <strong>Acesso Seguro</strong>
                <p>Proteção de dados e documentos.</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon"><FileText size={18} /></span>
              <div>
                <strong>Documentos Oficiais</strong>
                <p>Gerencie e acesse com praticidade.</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon"><Lock size={18} /></span>
              <div>
                <strong>Restrito</strong>
                <p>Sistema exclusivo para autorizados.</p>
              </div>
            </div>
          </div>
        </div>

        <motion.form
          className="login-card-centered"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.36 }}
        >
          <div className="card-inner login-panel">
            <div className="login-panel-header">
              <div className="panel-icon"><Shield size={20} /></div>
              <div>
                <h2>Bem-vindo(a)</h2>
                <p>Faça login para continuar</p>
              </div>
            </div>

            <Input label="Usuário" placeholder="seu.usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            <PasswordInput label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" />

            <label className="remember-large">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Lembrar de mim neste dispositivo</span>
            </label>

            {error ? <div className="alert error">{error}</div> : null}

            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar →'}
            </Button>

            <div className="login-divider">ou</div>

            <button type="button" className="button button-secondary login-cert-button">
              <Verified size={18} />
              Certificado Digital
            </button>
          </div>
        </motion.form>

        <small className="login-note">🔒 Acesso exclusivo a servidores autorizados</small>

        <Toast message={error} type="error" />
      </div>
    </AuthLayout>
  );
}
