"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, Repeat2 } from "lucide-react";
import { useStore } from "./store";
import styles from "./experience-home.module.css";

// Add the Google Forms URL here when the questionnaire is available.
const FORM_URL = "";

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
          {FORM_URL ? (
            <a className={styles.secondary} href={FORM_URL} target="_blank" rel="noreferrer">
              <ClipboardList size={23} aria-hidden="true" />Responder formulário<ArrowRight size={22} aria-hidden="true" />
            </a>
          ) : (
            <button className={styles.secondary} disabled aria-describedby="form-status">
              <ClipboardList size={23} aria-hidden="true" />Responder formulário<ArrowRight size={22} aria-hidden="true" />
            </button>
          )}
          {!FORM_URL && <p className={styles.note} id="form-status">O formulário estará disponível em breve.</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
        <p className={styles.footer}>Protótipo para avaliação · Nenhuma cobrança real é realizada.</p>
      </div>
    </main>
  );
}
