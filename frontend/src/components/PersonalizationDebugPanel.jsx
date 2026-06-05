import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { P13N_DEBUG } from '../config/personalizationDebug';
import '../styles/personalization-debug.css';

const truncate = (text, max = 60) =>
  typeof text === 'string' && text.length > max ? `${text.slice(0, max)}…` : text;

const formatTime = (ts) => new Date(ts).toLocaleTimeString();

const PersonalizationDebugPanel = () => {
  const { user } = useAuth();
  const {
    scenario,
    intentScore,
    notifications,
    debugLog,
    sessionId,
    clearDebugLog,
    refreshPersonalization
  } = usePersonalization();

  const [open, setOpen] = useState(false);

  if (!P13N_DEBUG) return null;

  if (!user) {
    return (
      <div className="p13n-debug">
        <div className="p13n-debug__header">
          <span>P13n Debug</span>
          <span className="p13n-debug__badge">log in for p13n debug</span>
        </div>
      </div>
    );
  }

  const engagementTier = scenario?.engagementTier ?? intentScore?.engagementTier ?? '—';
  const engagementScore = scenario?.engagementScore ?? intentScore?.engagementScore ?? '—';
  const trajectory = scenario?.trajectory ?? intentScore?.trajectory ?? '—';
  const intentTier = scenario?.intentTier ?? intentScore?.tier ?? '—';

  const copySnapshot = () => {
    navigator.clipboard.writeText(
      JSON.stringify({ scenario, intentScore, notifications, debugLog, sessionId }, null, 2)
    );
  };

  return (
    <div className="p13n-debug">
      <button
        type="button"
        className="p13n-debug__header"
        onClick={() => setOpen(o => !o)}
      >
        <span>P13n Debug</span>
        <span className="p13n-debug__badge">{scenario?.scenario || '—'}</span>
      </button>

      {open && (
        <div className="p13n-debug__body">
          <section className="p13n-debug__section">
            <h4 className="p13n-debug__section-title">Scenario</h4>
            <span className="p13n-debug__chip"><strong>scenario</strong> {scenario?.scenario || '—'}</span>
            <span className="p13n-debug__chip"><strong>intent</strong> {intentTier}</span>
            <span className="p13n-debug__chip"><strong>engagement</strong> {engagementTier}</span>
            <span className="p13n-debug__chip"><strong>trajectory</strong> {trajectory}</span>
          </section>

          <section className="p13n-debug__section">
            <h4 className="p13n-debug__section-title">Scores</h4>
            <div className="p13n-debug__row">
              <span className="p13n-debug__muted">intent</span>
              <span>{intentScore?.score ?? '—'} ({intentScore?.tier ?? '—'})</span>
            </div>
            <div className="p13n-debug__row">
              <span className="p13n-debug__muted">engagement</span>
              <span>{engagementScore} ({engagementTier})</span>
            </div>
          </section>

          {intentScore?.primaryPlanningDestination && (
            <section className="p13n-debug__section">
              <h4 className="p13n-debug__section-title">Destination</h4>
              <div className="p13n-debug__row">
                <span className="p13n-debug__muted">planning</span>
                <span>{intentScore.primaryPlanningDestination}</span>
              </div>
            </section>
          )}

          <section className="p13n-debug__section">
            <h4 className="p13n-debug__section-title">Notifications ({notifications?.length || 0})</h4>
            {notifications?.length ? notifications.map((n, i) => (
              <div key={n.id || i} className="p13n-debug__row">
                <span className="p13n-debug__muted">{n.type}</span>
                <span title={n.message}>{truncate(n.title || n.message)}</span>
              </div>
            )) : <div className="p13n-debug__muted">none</div>}
          </section>

          <section className="p13n-debug__section">
            <h4 className="p13n-debug__section-title">Recent tracks ({debugLog?.length || 0})</h4>
            {debugLog?.length ? (
              <table className="p13n-debug__table">
                <thead>
                  <tr><th>time</th><th>event</th><th>destination</th></tr>
                </thead>
                <tbody>
                  {debugLog.map((e, i) => (
                    <tr key={i}>
                      <td>{formatTime(e.at)}</td>
                      <td>{e.eventType}</td>
                      <td>{e.metadata?.destination || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="p13n-debug__muted">no events yet</div>}
          </section>

          <section className="p13n-debug__section">
            <h4 className="p13n-debug__section-title">Session</h4>
            <div className="p13n-debug__row">
              <span className="p13n-debug__mono">{truncate(sessionId, 22)}</span>
              <button
                type="button"
                className="p13n-debug__btn"
                onClick={() => navigator.clipboard.writeText(sessionId)}
              >
                Copy
              </button>
            </div>
          </section>

          <div className="p13n-debug__actions">
            <button type="button" className="p13n-debug__btn" onClick={refreshPersonalization}>Refresh</button>
            <button type="button" className="p13n-debug__btn" onClick={clearDebugLog}>Clear log</button>
            <button type="button" className="p13n-debug__btn" onClick={copySnapshot}>Copy snapshot</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizationDebugPanel;
