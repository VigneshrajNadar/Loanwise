import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'loanwise.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            email       TEXT    NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS analyses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            module      TEXT    NOT NULL,
            verdict     TEXT,
            input_json  TEXT,
            result_json TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            date        TEXT    NOT NULL,
            description TEXT,
            amount      REAL    NOT NULL,
            category    TEXT    DEFAULT 'Other',
            type        TEXT    DEFAULT 'debit',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            type        TEXT,
            severity    TEXT    DEFAULT 'Info',
            title       TEXT,
            message     TEXT,
            action      TEXT,
            is_read     INTEGER DEFAULT 0,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS user_profile (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER NOT NULL UNIQUE,
            monthly_income      REAL    DEFAULT 0,
            monthly_expenses    REAL    DEFAULT 0,
            rent                REAL    DEFAULT 0,
            savings             REAL    DEFAULT 0,
            investments         REAL    DEFAULT 0,
            insurance_premium   REAL    DEFAULT 0,
            dependents          INTEGER DEFAULT 0,
            city_tier           TEXT    DEFAULT 'Tier 2',
            employment_type     TEXT    DEFAULT 'Salaried',
            emis_json           TEXT    DEFAULT '[]',
            updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS agent_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            action      TEXT,
            outcome     TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS agent_plans (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL UNIQUE,
            objective   TEXT,
            plan_json   TEXT,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS agent_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            objective   TEXT,
            plan_json   TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()

    # ── Safe column migrations (additive only) ────────────────────────────────
    new_profile_cols = [
        ("age",                  "INTEGER DEFAULT 0"),
        ("cibil_score",          "INTEGER DEFAULT 0"),
        ("annual_bonus",         "REAL DEFAULT 0"),
        ("other_income",         "REAL DEFAULT 0"),
        ("goal_home_amount",     "REAL DEFAULT 0"),
        ("goal_home_years",      "INTEGER DEFAULT 0"),
        ("goal_retirement_years","INTEGER DEFAULT 30"),
        ("occupation",           "TEXT DEFAULT ''"),
        ("company_name",         "TEXT DEFAULT ''"),
        ("work_experience_years","INTEGER DEFAULT 0"),
        ("credit_utilization",   "INTEGER DEFAULT 0"),
        ("credit_cards_count",   "INTEGER DEFAULT 0"),
        ("net_worth_assets",     "REAL DEFAULT 0"),
        ("ppf_nps",              "REAL DEFAULT 0"),
        ("gold_value",           "REAL DEFAULT 0"),
        ("pan_last4",            "TEXT DEFAULT ''"),
        ("n8n_alert_email",      "TEXT DEFAULT ''"),
        ("n8n_alert_frequency",  "TEXT DEFAULT 'Manual'"),
        ("whatsapp_number",       "TEXT DEFAULT ''"),
    ]
    for col, defn in new_profile_cols:
        try:
            c.execute(f"ALTER TABLE user_profile ADD COLUMN {col} {defn}")
            conn.commit()
        except Exception:
            pass  # Column already exists — safe to skip

    conn.close()
    print("✅ SQLite DB initialised at:", DB_PATH)


# ── Users ─────────────────────────────────────────────────────────────────────
def save_analysis(user_id, module, verdict, input_data, result_data):
    import json
    conn = get_db()
    conn.execute(
        "INSERT INTO analyses (user_id, module, verdict, input_json, result_json) VALUES (?,?,?,?,?)",
        (user_id, module, verdict, json.dumps(input_data), json.dumps(result_data))
    )
    conn.commit()
    conn.close()


def get_user_analyses(user_id, limit=30):
    import json
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM analyses WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit)
    ).fetchall()
    conn.close()
    return [{"id": r["id"], "module": r["module"], "verdict": r["verdict"],
             "input": json.loads(r["input_json"] or "{}"), "result": json.loads(r["result_json"] or "{}"),
             "created_at": r["created_at"]} for r in rows]


def get_user_by_email(email):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(name, email, password_hash):
    conn = get_db()
    cursor = conn.execute("INSERT INTO users (name, email, password_hash) VALUES (?,?,?)",
                          (name, email, password_hash))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return user_id


# ── Transactions ──────────────────────────────────────────────────────────────
def save_transaction(user_id, date, description, amount, category, txn_type):
    conn = get_db()
    conn.execute(
        "INSERT INTO transactions (user_id, date, description, amount, category, type) VALUES (?,?,?,?,?,?)",
        (user_id, date, description, float(amount), category, txn_type)
    )
    conn.commit()
    conn.close()


def get_transactions(user_id, limit=100):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC, created_at DESC LIMIT ?",
        (user_id, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_transaction(txn_id, user_id):
    conn = get_db()
    conn.execute("DELETE FROM transactions WHERE id=? AND user_id=?", (txn_id, user_id))
    conn.commit()
    conn.close()


# ── Alerts ────────────────────────────────────────────────────────────────────
def save_alert(user_id, alert_type, severity, title, message, action=""):
    conn = get_db()
    conn.execute(
        "INSERT INTO alerts (user_id, type, severity, title, message, action) VALUES (?,?,?,?,?,?)",
        (user_id, alert_type, severity, title, message, action)
    )
    conn.commit()
    conn.close()


def get_alerts(user_id, limit=20):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM alerts WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_alerts_read(user_id):
    conn = get_db()
    conn.execute("UPDATE alerts SET is_read=1 WHERE user_id=?", (user_id,))
    conn.commit()
    conn.close()


# ── User Financial Profile ─────────────────────────────────────────────────────
def upsert_user_profile(user_id, data):
    import json
    conn = get_db()
    emis = json.dumps(data.get('emis', []))
    conn.execute("""
        INSERT INTO user_profile (
            user_id, monthly_income, monthly_expenses, rent, savings, investments,
            insurance_premium, dependents, city_tier, employment_type, emis_json,
            age, cibil_score, annual_bonus, other_income, goal_home_amount,
            goal_home_years, goal_retirement_years, occupation, company_name,
            work_experience_years, credit_utilization, credit_cards_count,
            net_worth_assets, ppf_nps, gold_value, pan_last4, n8n_alert_email, n8n_alert_frequency, whatsapp_number, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            monthly_income=excluded.monthly_income,
            monthly_expenses=excluded.monthly_expenses,
            rent=excluded.rent, savings=excluded.savings,
            investments=excluded.investments,
            insurance_premium=excluded.insurance_premium,
            dependents=excluded.dependents,
            city_tier=excluded.city_tier,
            employment_type=excluded.employment_type,
            emis_json=excluded.emis_json,
            age=excluded.age, cibil_score=excluded.cibil_score,
            annual_bonus=excluded.annual_bonus, other_income=excluded.other_income,
            goal_home_amount=excluded.goal_home_amount,
            goal_home_years=excluded.goal_home_years,
            goal_retirement_years=excluded.goal_retirement_years,
            occupation=excluded.occupation, company_name=excluded.company_name,
            work_experience_years=excluded.work_experience_years,
            credit_utilization=excluded.credit_utilization,
            credit_cards_count=excluded.credit_cards_count,
            net_worth_assets=excluded.net_worth_assets,
            ppf_nps=excluded.ppf_nps, gold_value=excluded.gold_value,
            pan_last4=excluded.pan_last4,
            n8n_alert_email=excluded.n8n_alert_email,
            n8n_alert_frequency=excluded.n8n_alert_frequency,
            whatsapp_number=excluded.whatsapp_number,
            updated_at=CURRENT_TIMESTAMP
    """, (
        user_id,
        data.get('monthly_income', 0), data.get('monthly_expenses', 0),
        data.get('rent', 0), data.get('savings', 0), data.get('investments', 0),
        data.get('insurance_premium', 0), data.get('dependents', 0),
        data.get('city_tier', 'Tier 2'), data.get('employment_type', 'Salaried'), emis,
        data.get('age', 0), data.get('cibil_score', 0),
        data.get('annual_bonus', 0), data.get('other_income', 0),
        data.get('goal_home_amount', 0), data.get('goal_home_years', 0),
        data.get('goal_retirement_years', 30),
        data.get('occupation', ''), data.get('company_name', ''),
        data.get('work_experience_years', 0),
        data.get('credit_utilization', 0), data.get('credit_cards_count', 0),
        data.get('net_worth_assets', 0), data.get('ppf_nps', 0),
        data.get('gold_value', 0), data.get('pan_last4', ''),
        data.get('n8n_alert_email', ''),
        data.get('n8n_alert_frequency', 'Manual'),
        data.get('whatsapp_number', ''),
    ))
    conn.commit()
    conn.close()


def get_user_profile(user_id):
    import json
    conn = get_db()
    row = conn.execute("SELECT * FROM user_profile WHERE user_id=?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return {}
    d = dict(row)
    d['emis'] = json.loads(d.get('emis_json', '[]'))
    return d

# ── Agent Plans ───────────────────────────────────────────────────────────────
def save_agent_plan(user_id, objective, plan_data):
    import json
    conn = get_db()
    conn.execute("""
        INSERT INTO agent_plans (user_id, objective, plan_json, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            objective=excluded.objective,
            plan_json=excluded.plan_json,
            updated_at=CURRENT_TIMESTAMP
    """, (user_id, objective, json.dumps(plan_data)))
    conn.commit()
    conn.close()

def get_agent_plan(user_id):
    import json
    conn = get_db()
    row = conn.execute("SELECT * FROM agent_plans WHERE user_id=?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d['plan_data'] = json.loads(d['plan_json'])
    except:
        d['plan_data'] = {}
    return d

def update_agent_plan_json(user_id, plan_data):
    import json
    conn = get_db()
    conn.execute("UPDATE agent_plans SET plan_json=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?", (json.dumps(plan_data), user_id))
    conn.commit()
    conn.close()


# ── Agent History ─────────────────────────────────────────────────────────────
def save_agent_history(user_id, objective, plan_data):
    import json
    conn = get_db()
    conn.execute(
        "INSERT INTO agent_history (user_id, objective, plan_json) VALUES (?, ?, ?)",
        (user_id, objective, json.dumps(plan_data))
    )
    conn.commit()
    conn.close()


def get_agent_history(user_id, limit=10):
    import json
    conn = get_db()
    rows = conn.execute(
        "SELECT id, objective, plan_json, created_at FROM agent_history WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit)
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        try:
            plan = json.loads(r['plan_json'] or '{}')
        except Exception:
            plan = {}
        result.append({
            'id': r['id'],
            'objective': r['objective'],
            'trend': plan.get('progress', {}).get('trend', 'No Data'),
            'health_score': plan.get('health_score', 0),
            'created_at': r['created_at'],
            'plan': plan
        })
    return result
