export function NewsletterCta() {
  return (
    <section className="rounded-2xl bg-brand-700 px-6 py-10 text-white">
      <h2 className="text-2xl font-bold">Newsletter The Muscle Temple</h2>
      <p className="mt-2 max-w-2xl text-sm text-blue-100">
        Recevez un résumé hebdomadaire des meilleurs contenus entraînement, nutrition et récupération.
      </p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          placeholder="Votre email"
          className="w-full rounded-lg border border-blue-300 bg-white/95 px-4 py-3 text-slate-900"
        />
        <button className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">S&apos;inscrire</button>
      </form>
    </section>
  );
}
