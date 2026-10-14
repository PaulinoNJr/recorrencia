"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Repeat2 } from "lucide-react";
import { useStore } from "./store";
import styles from "./experience-home.module.css";

export function ExperienceHome() {
  const router = useRouter();
  const { ready, startNewExperience } = useStore();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      await startNewExperience();
      router.push("/loja");
    } catch {
      setError("Não foi possível limpar os dados anteriores. Tente novamente ou permita o armazenamento neste navegador.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <img className={styles.logo} src="/logo.webp" alt="Covabra Supermercados" width="198" height="70" />
        <span className={styles.eyebrow}>Experiência de compras recorrentes</span>
        <h1>Suas compras.<br /><span>No seu ritmo.</span></h1>
        <p className={styles.intro}>Explore a experiência de recorrência do Covabra e compartilhe sua opinião com a gente.</p>
        <div className={styles.actions}>
          <button className={styles.primary} onClick={start} disabled={!ready || starting}>
            <Repeat2 size={24} aria-hidden="true" />
            <span>{starting ? "Preparando sua experiência…" : "Iniciar uma nova experiência com a recorrência"}</span>
            <ArrowRight size={22} aria-hidden="true" />
          </button>
          <p className={styles.note}>Cada nova experiência começa do zero, sem compras ou assinaturas de testes anteriores.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
        <p className={styles.footer}>Protótipo para avaliação · Nenhuma cobrança real é realizada.</p>
      </div>
    </main>
  );
}
