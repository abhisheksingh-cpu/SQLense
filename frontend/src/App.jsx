import { useState } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const predictLatency = async () => {
  if (!query.trim()) {
    setError("Please enter a SQL query.");
    return;
  }

  setLoading(true);
  setError("");
  setResult(null);

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

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="app">
      <header>
        <h1>SQLense</h1>
        <p>ML-Based SQL Query Performance Prediction</p>
      </header>

      <main>
        <section className="card">
          <h2>Analyze SQL Query</h2>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
          />

          <button onClick={predictLatency} disabled={loading}>
            {loading ? "Predicting..." : "Predict Latency"}
          </button>

          {error && <div className="error">{error}</div>}
        </section>

        {result && (
          <section className="result">
            <h2>Prediction Result</h2>

            <div className="latency">
              {result.predicted_latency_ms}
              <span> ms</span>
            </div>

            <p>Predicted execution latency</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;