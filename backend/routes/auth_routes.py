from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from models import db, User, AuditLog
from auth import generate_token, token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username_or_email = data.get('username') or data.get('email')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify({'message': 'Username/Email and password are required.'}), 400

    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid credentials. Please try again.'}), 401

    token = generate_token(user)

    # Log audit event
    audit = AuditLog(user_id=user.id, username=user.username, action="User Login", target_type="User", target_id=user.id)
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email address is required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'If that email exists, a password reset link has been dispatched.'}), 200

    return jsonify({'message': f'Password reset link generated for {email}. (Demo mode: reset active)'}), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    audit = AuditLog(user_id=current_user.id, username=current_user.username, action="User Logout", target_type="User", target_id=current_user.id)
    db.session.add(audit)
    db.session.commit()
    return jsonify({'message': 'Logged out successfully.'}), 200
