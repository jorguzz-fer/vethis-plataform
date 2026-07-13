import { useEffect, useState, type FormEvent } from 'react';
import { Button, Field } from '@vethis/ui';
import { api, type Profile } from '../api';

const ROLE_LABEL: Record<Profile['role'], string> = {
  aluno: 'Aluno',
  staff: 'Equipe',
  admin: 'Administrador',
};

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api
      .GET('/v1/me/profile')
      .then(({ data }) => {
        setProfile(data ?? null);
        setName(data?.name ?? '');
      })
      .catch(() => setProfile(null));
  }, []);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameMsg(null);
    try {
      const { data, error } = await api.PATCH('/v1/me/profile', { body: { name } });
      if (error || !data) throw new Error();
      setProfile(data);
      setNameMsg('Nome atualizado.');
    } catch {
      setNameMsg('Não foi possível salvar o nome.');
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      const { error } = await api.POST('/v1/me/password', {
        body: { currentPassword: current, newPassword: next },
      });
      if (error) throw new Error();
      setCurrent('');
      setNext('');
      setPwdMsg({ ok: true, text: 'Senha alterada com sucesso.' });
    } catch {
      setPwdMsg({ ok: false, text: 'Não foi possível alterar. Verifique a senha atual.' });
    } finally {
      setSavingPwd(false);
    }
  }

  if (profile === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-green-800">Meu perfil</h1>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-green-700 font-serif text-xl font-semibold text-gold-400">
          {(profile.name ?? profile.email).trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{profile.name ?? 'Sem nome'}</p>
          <p className="truncate text-sm text-muted">{profile.email}</p>
        </div>
        <span className="ml-auto rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          {ROLE_LABEL[profile.role]}
        </span>
      </div>

      <form
        onSubmit={saveName}
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-5"
      >
        <h2 className="font-serif text-base font-semibold text-green-800">Dados</h2>
        <Field
          label="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          required
        />
        <Field label="E-mail" value={profile.email} disabled readOnly />
        {nameMsg ? <p className="text-sm text-muted">{nameMsg}</p> : null}
        <Button type="submit" disabled={savingName} className="mt-1 self-start">
          {savingName ? 'Salvando…' : 'Salvar nome'}
        </Button>
      </form>

      <form
        onSubmit={savePassword}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5"
      >
        <h2 className="font-serif text-base font-semibold text-green-800">Trocar senha</h2>
        <Field
          label="Senha atual"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
        <Field
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          minLength={8}
          required
        />
        {pwdMsg ? (
          <p className={`text-sm ${pwdMsg.ok ? 'text-green-700' : 'text-error'}`}>{pwdMsg.text}</p>
        ) : null}
        <Button type="submit" disabled={savingPwd} className="mt-1 self-start">
          {savingPwd ? 'Alterando…' : 'Alterar senha'}
        </Button>
      </form>
    </div>
  );
}
