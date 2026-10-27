import { Insight, Tone } from "../../lib/insights";

// Status is never colour-alone: every tone also carries an icon and a label.
const ICON: Record<Tone, string> = { good: "✓", warn: "!", info: "i" };
const LABEL: Record<Tone, string> = { good: "Good", warn: "Watch out", info: "Note" };

export function Callout({ tone = "info", title, children }: { tone?: Tone; title?: string; children: React.ReactNode }) {
  return (
    <div className={`callout tone-${tone}`} role="note">
      <span className="callout-icon" aria-label={LABEL[tone]}>{ICON[tone]}</span>
      <div>{title && <strong>{title}. </strong>}{children}</div>
    </div>
  );
}

export function InsightList({ title, insights }: { title: string; insights: Insight[] }) {
  return (
    <section className="card insights">
      <h2>{title}</h2>
      <div className="insight-stack">
        {insights.map((i) => <Callout key={i.title} tone={i.tone} title={i.title}>{i.text}</Callout>)}
      </div>
    </section>
  );
}
