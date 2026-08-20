CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  occurred_at TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  route_id TEXT NOT NULL,
  engine_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  price_usd REAL NOT NULL,
  network TEXT NOT NULL,
  payer TEXT,
  transaction_hash TEXT,
  settled_amount_atomic TEXT,
  gross_eur REAL,
  usd_eur_rate REAL,
  eur_rate_source TEXT,
  status TEXT NOT NULL DEFAULT 'settled',
  offramp_status TEXT NOT NULL DEFAULT 'pending',
  offramped_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_settlements_occurred_at ON settlements(occurred_at);
CREATE INDEX IF NOT EXISTS idx_settlements_route_id ON settlements(route_id);
CREATE INDEX IF NOT EXISTS idx_settlements_engine_id ON settlements(engine_id);
CREATE INDEX IF NOT EXISTS idx_settlements_family_id ON settlements(family_id);
CREATE INDEX IF NOT EXISTS idx_settlements_offramp_status ON settlements(offramp_status);
