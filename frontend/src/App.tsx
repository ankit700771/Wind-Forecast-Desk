import { useState } from "react";
import { Skeleton, ErrorState } from "./components/ui/States";
import { SettingsProvider, useApi, useSettings } from "./context/AppContext";
import { useAsync } from "./hooks/useAsync";
import { useTheme } from "./hooks/useTheme";
import { VIEWS } from "./views/registry";

function Dashboard() {
  const { cutoff, setCutoff } = useSettings();
  const { theme, toggle } = useTheme();
  // ?view=accuracy deep-links to a page.
  const [active, setActive] = useState(() => {
    const v = new URLSearchParams(window.location.search).get("view");
    return VIEWS.some((x) => x.id === v) ? v! : VIEWS[0].id;
  });
  const View = VIEWS.find((v) => v.id === active)!.component;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>≋</span>
          <div>
            <h1>Wind Forecast Desk</h1>
            <p>GB wind generation · day-ahead buying · Elexon BMRS, January 2026</p>
          </div>
        </div>
        <div className="topbar-actions">
          <label className="field inline" title="Latest time on the day before delivery at which a purchase is decided">
            <span>Buying cutoff (UTC)</span>
            <input type="time" value={cutoff} onChange={(e) => e.target.value && setCutoff(e.target.value)} />
          </label>
          <button className="icon-btn" onClick={toggle} aria-label="Toggle dark mode" title="Toggle light / dark">
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Dashboard pages">
        {VIEWS.map((v) => (
          <button key={v.id} className={v.id === active ? "on" : ""} onClick={() => setActive(v.id)}>
            <b>{v.label}</b><small>{v.hint}</small>
          </button>
        ))}
      </nav>

      <main><View /></main>
    </div>
  );
}

export default function App() {
  const api = useApi();
  const meta = useAsync(() => api.getMeta(), [api]);
  if (meta.error) return <div className="app"><ErrorState message={`Could not reach the API: ${meta.error}`} /></div>;
  if (!meta.data) return <div className="app"><Skeleton height={160} /></div>;
  return <SettingsProvider meta={meta.data}><Dashboard /></SettingsProvider>;
}
