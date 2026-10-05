CREATE TABLE checks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  checked_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  outcome VARCHAR(16) NOT NULL COMMENT 'healthy | degraded | down',
  status_code SMALLINT UNSIGNED NULL,
  latency_ms INT UNSIGNED NULL COMMENT 'time to response headers; null when there was no response',
  error VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY ix_checks_project_time (project_id, checked_at),
  KEY ix_checks_time (checked_at),
  CONSTRAINT fk_checks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE projects ADD COLUMN last_checked_at TIMESTAMP(3) NULL AFTER timeout;
