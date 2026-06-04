import React, { useEffect, useState } from 'react';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';
import '../styles/integrations.css';

export default function IntegrationsPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/integrations/status')
      .then(({ data }) => setStatus(data.integrations))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-pad container"><p>Loading integrations…</p></div>;

  const entries = status ? Object.entries(status) : [];

  return (
    <div className="page-pad integrations-page">
      <div className="container">
        <h1>Third-party integrations</h1>
        <p className="text-muted">Add API keys to <code>backend/.env</code> and restart the server. Unconfigured services use demo fallbacks.</p>
        <div className="integration-grid">
          {entries.map(([key, info]) => (
            <div key={key} className="glass-card integration-card">
              <div className="integration-header">
                {info.configured ? <CheckCircle className="icon-ok" size={22} /> : <XCircle className="icon-off" size={22} />}
                <h3>{key}</h3>
              </div>
              <p>{info.configured ? 'Connected' : 'Not configured'}</p>
              {info.publishableKey && <p className="text-muted">Publishable key set</p>}
              {info.keyId && <p className="text-muted">Key ID: {info.keyId.slice(0, 8)}…</p>}
              {info.docs && (
                <a href={info.docs} target="_blank" rel="noreferrer" className="integration-link">
                  Get API keys <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
