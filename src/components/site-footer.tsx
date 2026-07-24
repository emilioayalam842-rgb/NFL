import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="bg-navy-dark text-chalk/70 mt-16">
      <div className="hash-divider" />
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <Image
            src="/logo-light-v2.png"
            alt="Zona Roja"
            width={166}
            height={24}
            className="h-6 w-auto mb-3"
            style={{ width: "auto", height: "1.5rem" }}
          />
          <p>Estadísticas y picks de NFL basados en datos. No somos una casa de apuestas.</p>
        </div>
        <div>
          <p className="font-display text-chalk tracking-wide mb-2">Juego responsable</p>
          <p>
            Las recomendaciones son análisis estadístico, no garantía de resultado. Apostar
            conlleva riesgo real de perder dinero. Si sientes que no controlas cuánto o con qué
            frecuencia apuestas, busca ayuda: en México, Jugadores Anónimos (jugadoresanonimosmexico.org.mx)
            y la línea 800 911 2000 del Centro de Atención Ciudadana ofrecen apoyo gratuito y confidencial.
          </p>
        </div>
        <div>
          <p className="font-display text-chalk tracking-wide mb-2">Legal</p>
          <p>Servicio de análisis e información deportiva para mayores de 18 años.</p>
        </div>
      </div>
      <div className="text-center text-xs pb-6">© {new Date().getFullYear()} Zona Roja.</div>
    </footer>
  );
}
