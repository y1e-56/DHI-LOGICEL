-- Commentaires sur les anomalies (texte + message vocal + transcription)
CREATE TABLE IF NOT EXISTS anomaly_comments (
  id SERIAL PRIMARY KEY,
  anomaly_id INTEGER NOT NULL REFERENCES anomalies(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message TEXT,
  audio_data TEXT,
  audio_type TEXT,
  transcription TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_comments_anomaly_id ON anomaly_comments (anomaly_id);
