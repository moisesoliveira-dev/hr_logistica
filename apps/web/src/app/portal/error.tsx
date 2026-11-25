"use client";

export default function PortalError({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" className="grid-lines flex min-h-svh flex-col items-center justify-center gap-6 bg-night px-6 text-center text-white">
      <h1 className="display text-4xl sm:text-6xl">Serviço indisponível</h1>
      <p className="max-w-md text-white/75">Não conseguimos falar com o servidor agora. Sua sessão não foi perdida.</p>
      <button type="button" onClick={reset} className="cursor-pointer rounded-sm bg-leaf px-8 py-4 font-extrabold text-night">Tentar novamente</button>
    </main>
  );
}
