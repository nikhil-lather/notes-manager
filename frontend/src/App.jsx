import { useState, useRef } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SAMPLE_NOTES = `Team sync - April 18, 2026

Attendees: Priya, Rahul, Meena, Dev

- Q2 product roadmap reviewed. Decided to prioritize mobile app over desktop for next quarter.
- Rahul will lead the mobile sprint starting Monday. Deadline: April 30.
- Meena to finalize UI designs by April 22 and share with the team.
- Budget discussion: marketing budget approved at 50k. Dev to send invoice breakdown by April 20.
- Discussed dropping the analytics dashboard feature - not enough user demand, will revisit in Q3.
- Next all-hands scheduled for April 25 at 3pm.
- Priya to send updated roadmap doc to stakeholders by EOD Friday.`;

function App() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState({
    summary: false,
    actions: false,
    email: false,
  });
  const [results, setResults] = useState({
    summary: null,
    actions: null,
    email: null,
  });
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const setKey = () => {
    if (apiKey.trim().length > 10) {
      setApiKeySet(true);
      setError("");
    } else {
      setError("Please enter a valid Gemini API key.");
    }
  };

  const callAPI = async (endpoint, body) => {
    const res = await fetch(`${API_BASE}/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, apiKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  };

  const runAll = async () => {
    if (!notes.trim()) {
      setError("Please paste your meeting notes first.");
      return;
    }
    setError("");
    setResults({ summary: null, actions: null, email: null });

    setLoading((l) => ({ ...l, summary: true }));
    setActiveTab("summary");
    try {
      const summaryData = await callAPI("summarize", { notes });
      setResults((r) => ({ ...r, summary: summaryData }));

      setLoading((l) => ({ ...l, summary: false, actions: true }));
      setActiveTab("actions");
      const actionsData = await callAPI("actions", { notes });
      setResults((r) => ({ ...r, actions: actionsData }));

      setLoading((l) => ({ ...l, actions: false, email: true }));
      setActiveTab("email");
      const emailData = await callAPI("email", {
        notes,
        summary: summaryData,
        actionItems: actionsData,
      });
      setResults((r) => ({ ...r, email: emailData }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading({ summary: false, actions: false, email: false });
    }
  };

  const copyEmail = () => {
    if (!results.email) return;
    const { subject, greeting, body, closing } = results.email;
    const text = `Subject: ${subject}\n\n${greeting}\n\n${body}\n\n${closing}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = Object.values(loading).some(Boolean);
  const hasResults = results.summary || results.actions || results.email;

  const priorityColor = (p) => {
    if (p === "High") return "priority-high";
    if (p === "Medium") return "priority-medium";
    return "priority-low";
  };

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="header">
        <div className="logo">
          <span className="logo-mark">NM</span>
          <div>
            <div className="logo-name">Notes Manager</div>
            <div className="logo-tagline">
              Turn messy notes into clear action
            </div>
          </div>
        </div>

        {!apiKeySet ? (
          <div className="key-bar">
            <input
              className="key-input"
              type="password"
              placeholder="Paste your Gemini API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setKey()}
            />
            <button className="btn-primary" onClick={setKey}>
              Activate
            </button>
          </div>
        ) : (
          <div className="key-active">
            <span className="dot-green" /> API Key Active
            <button
              className="btn-ghost"
              onClick={() => {
                setApiKeySet(false);
                setApiKey("");
              }}
            >
              Change
            </button>
          </div>
        )}
      </header>

      <main className="main">
        <div className="panel panel-left">
          <div className="panel-header">
            <span className="panel-title">Your Notes</span>
            <button
              className="btn-ghost small"
              onClick={() => setNotes(SAMPLE_NOTES)}
            >
              Load Sample
            </button>
          </div>

          <textarea
            className="notes-area"
            placeholder="Paste your raw meeting or lecture notes here...&#10;&#10;No formatting needed — messy is fine."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="panel-footer">
            <span className="char-count">
              {notes.length > 0
                ? `${notes.split(/\s+/).filter(Boolean).length} words`
                : "0 words"}
            </span>
            {notes && (
              <button
                className="btn-ghost small"
                onClick={() => {
                  setNotes("");
                  setResults({ summary: null, actions: null, email: null });
                }}
              >
                Clear
              </button>
            )}
          </div>

          {error && <div className="error-box">{error}</div>}

          <button
            className={`btn-analyze ${isLoading ? "loading" : ""}`}
            onClick={runAll}
            disabled={isLoading || !apiKeySet}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Analyzing...
              </>
            ) : (
              <>⚡ Analyze Notes</>
            )}
          </button>

          {!apiKeySet && (
            <p className="hint">
              ↑ Enter your Gemini API key above to get started
            </p>
          )}
        </div>

        <div className="panel panel-right">
          {!hasResults && !isLoading ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">Ready to analyze</div>
              <div className="empty-sub">
                Paste your notes on the left and hit{" "}
                <strong>Analyze Notes</strong>.
              </div>
              <div className="feature-pills">
                <span className="pill">📋 Summary</span>
                <span className="pill">✅ Action Items</span>
                <span className="pill">📧 Email Draft</span>
              </div>
            </div>
          ) : (
            <>
              <div className="tabs">
                {["summary", "actions", "email"].map((tab) => (
                  <button
                    key={tab}
                    className={`tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {loading[tab] && <span className="tab-spinner" />}
                    {tab === "summary" && "📋 Summary"}
                    {tab === "actions" && "✅ Actions"}
                    {tab === "email" && "📧 Email"}
                  </button>
                ))}
              </div>

              <div className="tab-content">
                {activeTab === "summary" &&
                  (loading.summary ? (
                    <Skeleton />
                  ) : results.summary ? (
                    <div className="result-block">
                      <h2 className="result-title">{results.summary.title}</h2>
                      {results.summary.date_context !== "Not specified" && (
                        <div className="meta-chip">
                          🗓 {results.summary.date_context}
                        </div>
                      )}
                      <div className="section">
                        <div className="section-label">Executive Summary</div>
                        <p className="summary-text">
                          {results.summary.summary}
                        </p>
                      </div>
                      {results.summary.key_decisions?.length > 0 && (
                        <div className="section">
                          <div className="section-label">Key Decisions</div>
                          <ul className="decision-list">
                            {results.summary.key_decisions.map((d, i) => (
                              <li key={i}>
                                <span className="bullet">◆</span>
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {results.summary.topics_covered?.length > 0 && (
                        <div className="section">
                          <div className="section-label">Topics Covered</div>
                          <div className="topic-chips">
                            {results.summary.topics_covered.map((t, i) => (
                              <span key={i} className="topic-chip">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null)}

                {activeTab === "actions" &&
                  (loading.actions ? (
                    <Skeleton />
                  ) : results.actions ? (
                    <div className="result-block">
                      <div className="actions-header">
                        <h2 className="result-title">Action Items</h2>
                        <span className="count-badge">
                          {results.actions.action_items?.length || 0} tasks
                        </span>
                      </div>
                      {results.actions.action_items?.length === 0 ? (
                        <div className="no-actions">No action items found.</div>
                      ) : (
                        <div className="action-list">
                          {results.actions.action_items?.map((item, i) => (
                            <div key={i} className="action-card">
                              <div className="action-top">
                                <span
                                  className={`priority-badge ${priorityColor(item.priority)}`}
                                >
                                  {item.priority}
                                </span>
                              </div>
                              <div className="action-task">{item.task}</div>
                              <div className="action-meta">
                                <span className="meta-item">
                                  👤 {item.owner}
                                </span>
                                <span className="meta-item">
                                  📅 {item.deadline}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null)}

                {activeTab === "email" &&
                  (loading.email ? (
                    <Skeleton />
                  ) : results.email ? (
                    <div className="result-block">
                      <div className="actions-header">
                        <h2 className="result-title">Follow-up Email</h2>
                        <button className="btn-copy" onClick={copyEmail}>
                          {copied ? "✓ Copied!" : "Copy Email"}
                        </button>
                      </div>
                      <div className="email-preview">
                        <div className="email-subject">
                          <span className="email-label">Subject</span>
                          <span className="email-value">
                            {results.email.subject}
                          </span>
                        </div>
                        <div className="email-divider" />
                        <div className="email-body">
                          <p>{results.email.greeting}</p>
                          <p style={{ whiteSpace: "pre-line" }}>
                            {results.email.body}
                          </p>
                          <p style={{ whiteSpace: "pre-line" }}>
                            {results.email.closing}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null)}
              </div>
            </>
          )}
        </div>
      </main>

      <section className="about-section">
        <div className="about-inner">
          <div className="about-block">
            <div className="about-label">The Problem</div>
            <p>
              Professionals and students sit through hours of meetings and
              lectures but leave with raw, unstructured notes. Converting those
              notes into summaries, task lists, and follow-up emails takes 20–40
              minutes every time.
            </p>
          </div>
          <div className="about-block">
            <div className="about-label">Why It Matters</div>
            <p>
              Teams miss deadlines because action items were buried in notes
              nobody re-read. Notes Manager solves this in under 10 seconds
              using AI — letting people focus on doing, not documenting.
            </p>
          </div>
          <div className="about-block">
            <div className="about-label">What We Chose NOT to Build</div>
            <ul className="decision-log">
              <li>
                <strong>Voice recording</strong> — Text input solves 80% of the
                problem faster.
              </li>
              <li>
                <strong>User auth & history</strong> — Stateless tool ships
                faster and builds trust instantly.
              </li>
              <li>
                <strong>Multi-language</strong> — English-first is the right MVP
                call.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="footer">
        Built with React + Node.js + Gemini AI · Notes Manager © 2026
      </footer>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="skeleton-wrap">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line" />
    </div>
  );
}

export default App;
