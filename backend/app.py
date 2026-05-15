from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import init_db
from routes.eligibility_route import eligibility_bp
from routes.default_risk_route import default_risk_bp
from routes.loan_intelligence_route import loan_intelligence_bp
from routes.financial_health_route import financial_health_bp
from routes.ai_chat_route import ai_chat_bp
from routes.auth_route import auth_bp
from routes.user_route import user_bp

app = Flask(__name__)

# Fix: wildcard "*" is incompatible with supports_credentials=True.
# Browsers block that combination by spec. Use explicit origins instead.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS(app,
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Belt-and-suspenders: force CORS headers on EVERY response,
# including 4xx/5xx errors that Flask sometimes strips them from.
@app.after_request
def inject_cors(response):
    origin = request.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'loanwise-ultra-secret-2026-secure-key!'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

jwt = JWTManager(app)

# Register Blueprints

app.register_blueprint(eligibility_bp, url_prefix='/api')
app.register_blueprint(default_risk_bp, url_prefix='/api')
app.register_blueprint(loan_intelligence_bp, url_prefix='/api')
app.register_blueprint(financial_health_bp, url_prefix='/api')
app.register_blueprint(ai_chat_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)

@app.route('/', methods=['GET'])
def health_check():
    return {"status": "ok", "message": "Loanwise API is running."}, 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
