from flask import Blueprint, jsonify
from services.ai_analytics import AIAnalytics
from auth import token_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/forecast', methods=['GET'])
@token_required
def get_forecast(current_user):
    forecast_data = AIAnalytics.forecast_spending()
    return jsonify(forecast_data), 200

@analytics_bp.route('/anomalies', methods=['GET'])
@token_required
def get_anomalies(current_user):
    anomalies = AIAnalytics.detect_anomalies()
    return jsonify(anomalies), 200

@analytics_bp.route('/recommendations', methods=['GET'])
@token_required
def get_recommendations(current_user):
    recommendations = AIAnalytics.get_model_recommendations()
    return jsonify(recommendations), 200
