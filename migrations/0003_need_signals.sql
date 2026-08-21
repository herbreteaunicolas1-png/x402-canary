CREATE TABLE IF NOT EXISTS agent_need_signals (
  signal_id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  channel TEXT NOT NULL,
  need_category TEXT NOT NULL,
  recommended_route_id TEXT,
  max_price_usd REAL NOT NULL,
  freshness_seconds INTEGER NOT NULL,
  local_evidence_sufficient INTEGER NOT NULL,
  task_hash TEXT NOT NULL,
  task_length INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_need_signals_occurred_at ON agent_need_signals(occurred_at);
CREATE INDEX IF NOT EXISTS idx_agent_need_signals_category ON agent_need_signals(need_category);
CREATE INDEX IF NOT EXISTS idx_agent_need_signals_route ON agent_need_signals(recommended_route_id);
CREATE INDEX IF NOT EXISTS idx_agent_need_signals_channel ON agent_need_signals(channel);
