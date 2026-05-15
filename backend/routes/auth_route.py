from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from database import get_user_by_email, get_user_by_id, create_user

auth_bp = Blueprint('auth', __name__)


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name  = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    pw    = data.get('password', '')

    if not name or not email or not pw:
        return jsonify({"error": "Name, email and password are required"}), 400
    if len(pw) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if get_user_by_email(email):
        return jsonify({"error": "Email already registered"}), 409

    user_id = create_user(name, email, _hash(pw))
    token = create_access_token(identity=str(user_id))
    return jsonify({"token": token, "user": {"id": user_id, "name": name, "email": email}}), 201


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data  = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    pw    = data.get('password', '')

    user = get_user_by_email(email)
    if not user or not _verify(pw, user['password_hash']):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user['id']))
    return jsonify({
        "token": token,
        "user": {"id": user['id'], "name": user['name'], "email": user['email']}
    }), 200


@auth_bp.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"id": user['id'], "name": user['name'], "email": user['email']}), 200
