import { useRef, useState } from "react";
import "./sqlense.css";

const SAMPLES = [
  {
    label: "Simple filter",
    sql: "SELECT id, name, email\nFROM users\nWHERE status = 'active'\nLIMIT 100;",
  },
  {
    label: "Join + aggregate",
    sql: "SELECT c.name, COUNT(o.id) AS orders, SUM(o.total) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.created_at > '2025-01-01'\nGROUP BY c.name\nORDER BY revenue DESC;",
  },
  {
    label: "Subquery",
    sql: "SELECT *\nFROM products\nWHERE price > (\n  SELECT AVG(price) FROM products\n)\nORDER BY price DESC;",
  },
];

function classify(ms) {
  if (ms < 100) return { key: "fast", label: "Fast" };
  if (ms < 1000) return { key: "moderate", label: "Moderate" };
  return { key: "slow", label: "Slow" };
}

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const Icon = {
  logo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
  play: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
  ),
  flask: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3" />
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </svg>
  ),
  chart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  ),
  book: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  alert: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  ),
};

function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roundTrip, setRoundTrip] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("playground");
  const gutterRef = useRef(null);

  const predictLatency = async () => {
    if (!query.trim()) {
      setError("Please enter a SQL query.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setRoundTrip(null);

    const started = performance.now();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query,
          }),
        }
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || `Request failed: ${response.status}`);
      }

      const data = JSON.parse(text);

      setResult(data);
      const elapsed = Math.round(performance.now() - started);
      setRoundTrip(elapsed);
      setHistory((h) => [
        {
          id: Date.now(),
          query,
          latency: data.predicted_latency_ms,
          status: "success",
          at: new Date(),
          roundTrip: elapsed,
        },
        ...h,
      ]);
    } catch (err) {
      setError(err.message);
      setHistory((h) => [
        {
          id: Date.now(),
          query,
          latency: null,
          status: "error",
          at: new Date(),
          roundTrip: Math.round(performance.now() - started),
        },
        ...h,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!loading) predictLatency();
    }
  };

  const lineCount = Math.max(query.split("\n").length, 8);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);
  const level = result ? classify(Number(result.predicted_latency_ms)) : null;
  const latencyNum = result ? Number(result.predicted_latency_ms) : 0;
  const barPct = result
    ? Math.min(100, Math.max(3, (Math.log10(latencyNum + 1) / 4) * 100))
    : 0;
  const successful = history.filter((h) => h.status === "success");
  const avg = successful.length
    ? successful.reduce((s, h) => s + Number(h.latency), 0) / successful.length
    : null;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">{Icon.logo}</span>
          <span className="brand-name">SQLense</span>
        </div>

        <div className="workspace">
          <span className="ws-label">Project</span>
          <button className="ws-select" type="button">
            <span className="dot" /> query-latency
          </button>
        </div>

        <nav className="nav">
          <button
            type="button"
            className={`nav-item ${tab === "playground" ? "active" : ""}`}
            onClick={() => setTab("playground")}
          >
            {Icon.flask} Playground
          </button>
          <button
            type="button"
            className={`nav-item ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
          >
            {Icon.history} Runs
            {history.length > 0 && <span className="count">{history.length}</span>}
          </button>
          <button
            type="button"
            className={`nav-item ${tab === "stats" ? "active" : ""}`}
            onClick={() => setTab("stats")}
          >
            {Icon.chart} Monitoring
          </button>
        </nav>

        <div className="sidebar-foot">
          <div className="nav-item muted">{Icon.book} ML-based SQL performance prediction</div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="crumbs">
            <span>Projects</span>
            <span className="sep">/</span>
            <span>query-latency</span>
            <span className="sep">/</span>
            <strong>
              {tab === "playground" ? "Playground" : tab === "history" ? "Runs" : "Monitoring"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="pill">
              <span className="dot live" /> Model online
            </span>
          </div>
        </header>

        <main className="page">
          {tab === "playground" && (
            <>
              <div className="page-head">
                <div>
                  <h1>Analyze SQL Query</h1>
                  <p>Paste a query to predict its execution latency before it ever hits your database.</p>
                </div>
              </div>

              <div className="grid">
                <section className="panel">
                  <div className="panel-head">
                    <div className="panel-title">Input</div>
                    <div className="chips">
                      {SAMPLES.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          className="chip"
                          onClick={() => {
                            setQuery(s.sql);
                            setError("");
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="editor">
                    <div className="gutter" ref={gutterRef} aria-hidden="true">
                      {lines.map((n) => (
                        <div key={n}>{n}</div>
                      ))}
                    </div>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onKeyDown}
                      onScroll={(e) => {
                        if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
                      }}
                      placeholder="Enter your SQL query here..."
                      spellCheck="false"
                      rows={8}
                    />
                  </div>

                  <div className="panel-foot">
                    <span className="hint">
                      <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run
                    </span>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => {
                          setQuery("");
                          setResult(null);
                          setError("");
                        }}
                        disabled={loading || (!query && !result && !error)}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="btn primary"
                        onClick={predictLatency}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner" /> Predicting...
                          </>
                        ) : (
                          <>{Icon.play} Predict Latency</>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="error">
                      {Icon.alert}
                      <div>
                        <strong>Run failed</strong>
                        <pre>{error}</pre>
                      </div>
                    </div>
                  )}
                </section>

                <section className="panel output">
                  <div className="panel-head">
                    <div className="panel-title">Output</div>
                    {result && (
                      <span className={`badge ${level.key}`}>
                        <span className="dot" /> {level.label}
                      </span>
                    )}
                  </div>

                  {!result && !loading && (
                    <div className="empty">
                      <div className="empty-icon">{Icon.clock}</div>
                      <h3>No prediction yet</h3>
                      <p>Run a query to see its predicted latency here.</p>
                    </div>
                  )}

                  {loading && (
                    <div className="empty">
                      <div className="spinner big" />
                      <h3>Running prediction</h3>
                      <p>Sending query to the model...</p>
                    </div>
                  )}

                  {result && (
                    <div className="result-body">
                      <div className="metric-main">
                        <span className="metric-label">Predicted execution latency</span>
                        <div className="latency">
                          {result.predicted_latency_ms}
                          <span> ms</span>
                        </div>
                      </div>

                      <div className="meter">
                        <div className={`meter-fill ${level.key}`} style={{ width: `${barPct}%` }} />
                      </div>
                      <div className="meter-scale">
                        <span>1ms</span>
                        <span>100ms</span>
                        <span>1s</span>
                        <span>10s</span>
                      </div>

                      <dl className="meta">
                        <div>
                          <dt>Status</dt>
                          <dd>
                            <span className="badge success">
                              <span className="dot" /> Success
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt>Round trip</dt>
                          <dd>{roundTrip} ms</dd>
                        </div>
                        <div>
                          <dt>Query length</dt>
                          <dd>{query.length} chars</dd>
                        </div>
                        <div>
                          <dt>Lines</dt>
                          <dd>{query.split("\n").length}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {tab === "history" && (
            <>
              <div className="page-head">
                <div>
                  <h1>Runs</h1>
                  <p>Predictions from this session. Click a row to load it back into the playground.</p>
                </div>
              </div>
              <section className="panel table-panel">
                {history.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">{Icon.history}</div>
                    <h3>No runs yet</h3>
                    <p>Predictions you run will show up here.</p>
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Query</th>
                        <th className="num">Predicted</th>
                        <th className="num">Round trip</th>
                        <th className="num">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => {
                        const lv = h.latency != null ? classify(Number(h.latency)) : null;
                        return (
                          <tr
                            key={h.id}
                            onClick={() => {
                              setQuery(h.query);
                              setTab("playground");
                            }}
                          >
                            <td>
                              <span className={`badge ${h.status === "success" ? lv.key : "error"}`}>
                                <span className="dot" /> {h.status === "success" ? lv.label : "Error"}
                              </span>
                            </td>
                            <td className="mono clip">{h.query.replace(/\s+/g, " ")}</td>
                            <td className="num mono">{h.latency != null ? `${h.latency} ms` : "-"}</td>
                            <td className="num mono">{h.roundTrip} ms</td>
                            <td className="num">{formatTime(h.at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}

          {tab === "stats" && (
            <>
              <div className="page-head">
                <div>
                  <h1>Monitoring</h1>
                  <p>Summary of predictions made in this session.</p>
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat">
                  <span className="metric-label">Total runs</span>
                  <strong>{history.length}</strong>
                </div>
                <div className="stat">
                  <span className="metric-label">Success rate</span>
                  <strong>
                    {history.length ? `${Math.round((successful.length / history.length) * 100)}%` : "-"}
                  </strong>
                </div>
                <div className="stat">
                  <span className="metric-label">Avg predicted latency</span>
                  <strong>{avg != null ? `${avg.toFixed(1)} ms` : "-"}</strong>
                </div>
                <div className="stat">
                  <span className="metric-label">Max predicted latency</span>
                  <strong>
                    {successful.length
                      ? `${Math.max(...successful.map((h) => Number(h.latency)))} ms`
                      : "-"}
                  </strong>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;