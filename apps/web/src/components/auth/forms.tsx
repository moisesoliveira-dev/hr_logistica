"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePassword, login, requestPasswordReset, resetPassword } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/shared";
import { Notice, PasswordField, SubmitButton, TextField } from "./fields";

const empty: FormState = {};
const link = "font-bold text-brand-deep underline decoration-leaf decoration-2 underline-offset-4 hover:text-brand";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action] = useActionState(login, empty);
  return (
    <form action={action} className="space-y-4">
      <Notice error={state.error} success={state.stamp ? undefined : notice} stamp={state.stamp} />
      <input type="hidden" name="next" value={next} />
      {/* a chave recria os campos a cada resposta, mantendo o e-mail digitado */}
      <div key={state.stamp ?? 0} className="space-y-4">
        <TextField label="E-mail corporativo" name="email" type="email" autoComplete="username" required defaultValue={state.values?.email} autoFocus={!state.values?.email} />
        <PasswordField label="Senha" name="password" autoComplete="current-password" required autoFocus={Boolean(state.values?.email)} />
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
          <label className="flex cursor-pointer items-center gap-2 font-semibold">
            <input type="checkbox" name="remember" defaultChecked={state.values?.remember === "on"} className="size-4 accent-brand" />
            Manter conectado por 30 dias
          </label>
          <Link href="/esqueci-senha" className={link}>Esqueci minha senha</Link>
        </div>
      </div>
      <SubmitButton>Entrar</SubmitButton>
      <p className="text-center text-sm text-ink/60">Ainda não tem acesso? Peça ao administrador do sistema.</p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, empty);
  return (
    <form action={action} className="space-y-4">
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      {!state.success && (
        <>
          <TextField key={state.stamp ?? 0} label="E-mail corporativo" name="email" type="email" autoComplete="username" required autoFocus defaultValue={state.values?.email} />
          <SubmitButton>Enviar link</SubmitButton>
        </>
      )}
      <p className="text-center text-sm"><Link href="/login" className={link}>Voltar para o login</Link></p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, empty);
  return (
    <form action={action} className="space-y-4">
      <Notice error={state.error} stamp={state.stamp} />
      <input type="hidden" name="token" value={token} />
      <div key={state.stamp ?? 0} className="space-y-4">
        <PasswordField label="Nova senha" name="password" autoComplete="new-password" required meter error={state.fields?.password} />
        <PasswordField label="Repita a nova senha" name="confirm" autoComplete="new-password" required error={state.fields?.confirm} />
      </div>
      <SubmitButton>Salvar nova senha</SubmitButton>
      <p className="text-center text-sm"><Link href="/esqueci-senha" className={link}>Pedir um novo link</Link></p>
    </form>
  );
}

export function ChangePasswordForm({ firstAccess, email }: { firstAccess: boolean; email: string }) {
  const [state, action] = useActionState(changePassword, empty);
  return (
    <form action={action} className="space-y-4">
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      {/* ajuda o gerenciador de senhas a saber de qual conta se trata */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <div key={state.stamp ?? 0} className="space-y-4">
        {!firstAccess && <PasswordField label="Senha atual" name="current" autoComplete="current-password" required error={state.fields?.current} />}
        <PasswordField label="Nova senha" name="password" autoComplete="new-password" required meter error={state.fields?.password} />
        <PasswordField label="Repita a nova senha" name="confirm" autoComplete="new-password" required error={state.fields?.confirm} />
      </div>
      <SubmitButton>{firstAccess ? "Criar minha senha" : "Alterar senha"}</SubmitButton>
    </form>
  );
}
