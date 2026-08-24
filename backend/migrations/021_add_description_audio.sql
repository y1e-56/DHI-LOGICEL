-- Descriptions vocales (audio + transcription) sur toutes les entités
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS description_audio_data TEXT;
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS description_audio_type TEXT;
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS description_transcription TEXT;
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS description_duration_seconds INTEGER;

ALTER TABLE features ADD COLUMN IF NOT EXISTS description_audio_data TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS description_audio_type TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS description_transcription TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS description_duration_seconds INTEGER;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS objective_audio_data TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS objective_audio_type TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS objective_transcription TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS objective_duration_seconds INTEGER;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS description_audio_data TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description_audio_type TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description_transcription TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description_duration_seconds INTEGER;
