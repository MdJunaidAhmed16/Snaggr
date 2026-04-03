CREATE TABLE IF NOT EXISTS trend_keywords (
    id              SERIAL PRIMARY KEY,
    keyword         VARCHAR(255) NOT NULL,
    category        VARCHAR(100),
    trend_score     FLOAT NOT NULL DEFAULT 0,
    source_count    INT DEFAULT 1,
    sources         JSONB,
    first_seen      TIMESTAMP DEFAULT NOW(),
    last_updated    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_suggestions (
    id              SERIAL PRIMARY KEY,
    domain          VARCHAR(255) NOT NULL UNIQUE,
    tld             VARCHAR(20),
    keyword_id      INT REFERENCES trend_keywords(id),
    reasoning       TEXT,
    is_available    BOOLEAN,
    purchase_url    VARCHAR(512),
    price_usd       DECIMAL(10,2),
    availability_checked_at TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expiring_domains (
    id              SERIAL PRIMARY KEY,
    domain          VARCHAR(255) NOT NULL,
    expiry_date     DATE,
    backlink_count  INT DEFAULT 0,
    domain_age_years INT,
    registrar       VARCHAR(255),
    has_active_business BOOLEAN DEFAULT FALSE,
    business_signals JSONB,
    score           FLOAT DEFAULT 0,
    fetched_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_views (
    id              SERIAL PRIMARY KEY,
    domain_id       INT,
    session_id      VARCHAR(255),
    viewed_at       TIMESTAMP DEFAULT NOW()
);
