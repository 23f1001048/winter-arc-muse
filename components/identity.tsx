import type { ReactNode } from "react";

export function Wordmark() {
  return <span className="wordmark"><span className="arc-mark" aria-hidden="true" />Winter Arc</span>;
}

/** Three silhouettes and a sun, drawn locally so the journal cover works offline. */
export function WinterLandscape() {
  return (
    <div className="winter-landscape" aria-hidden="true">
      <span className="winter-sun" />
      <span className="ridge ridge-far" />
      <span className="ridge ridge-mid" />
      <span className="ridge ridge-near" />
    </div>
  );
}

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="auth-stage">
      <div className="auth-spread">
        <div className="journal-cover">
          <Wordmark />
          <div className="cover-title">Your 30-day<br /><em>training journal.</em></div>
          <WinterLandscape />
        </div>
        <div className="auth-form">{children}</div>
      </div>
    </main>
  );
}
