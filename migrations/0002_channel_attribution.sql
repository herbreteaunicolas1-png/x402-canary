CREATE TABLE IF NOT EXISTS settlement_attribution (
  request_id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES settlements(request_id)
);
CREATE INDEX IF NOT EXISTS idx_settlement_attribution_channel ON settlement_attribution(channel);
CREATE INDEX IF NOT EXISTS idx_settlement_attribution_occurred_at ON settlement_attribution(occurred_at);
