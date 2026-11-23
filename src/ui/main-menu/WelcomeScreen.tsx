import { useT } from "@/i18n";

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const t = useT();
  return (
    <main className="overlay welcome-screen" aria-labelledby="welcome-title">
      <h1 id="welcome-title" className="welcome-title">{t("menu.title")}</h1>
      <button type="button" className="welcome-start" onClick={onStart}>
        START <span aria-hidden="true">›</span>
      </button>
    </main>
  );
}
