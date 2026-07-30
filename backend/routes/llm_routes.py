import os
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv, set_key
from models import db, AIAgent, Session
from services.real_llm_service import RealLLMService
from services.budget_engine import BudgetEngine
from auth import token_required

llm_bp = Blueprint('llm', __name__, url_prefix='/api/llm')

ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(ENV_PATH, override=True)

STORED_API_KEYS = {
    "openai": os.getenv("OPENAI_API_KEY", ""),
    "anthropic": os.getenv("ANTHROPIC_API_KEY", ""),
    "google": os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", "")),
    "deepseek": os.getenv("DEEPSEEK_API_KEY", "")
}

@llm_bp.route('/api-keys', methods=['GET'])
@token_required
def get_api_keys(current_user):
    masked = {}
    for key, val in STORED_API_KEYS.items():
        if val:
            masked[key] = val[:8] + "..." + val[-6:] if len(val) > 14 else "****"
        else:
            masked[key] = ""
    return jsonify(masked), 200

@llm_bp.route('/api-keys', methods=['POST'])
@token_required
def update_api_keys(current_user):
    data = request.get_json() or {}
    
    if not os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'w') as f:
            f.write("# Agent Budget Controller Environment Config\n")

    env_key_map = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "google": "GEMINI_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY"
    }

    for k, env_var in env_key_map.items():
        if k in data and data[k]:
            val = data[k].strip()
            STORED_API_KEYS[k] = val
            os.environ[env_var] = val
            try:
                set_key(ENV_PATH, env_var, val)
            except Exception as e:
                print(f"Could not set_key in .env: {e}")

    return jsonify({
        'message': 'API Keys saved to system environment and .env file.',
        'keys_set': [k for k, v in STORED_API_KEYS.items() if v]
    }), 200

@llm_bp.route('/chat', methods=['POST'])
@token_required
def execute_real_chat(current_user):
    data = request.get_json() or {}
    agent_id = data.get('agent_id')
    prompt = data.get('prompt', '').strip()
    model = data.get('model')

    if not prompt:
        return jsonify({'message': 'Prompt text is required.'}), 400

    if not agent_id:
        agent = AIAgent.query.filter_by(status='Active').first() or AIAgent.query.first()
        if not agent:
            return jsonify({'message': 'No active AI Agent found in database.'}), 400
        agent_id = agent.agent_id

    agent = AIAgent.query.get(agent_id)
    if not agent:
        return jsonify({'message': f'Agent #{agent_id} not found.'}), 404

    model = model or agent.preferred_model

    # Always fetch latest keys from ENV if available
    keys_to_use = {
        "openai": STORED_API_KEYS.get("openai") or os.getenv("OPENAI_API_KEY", ""),
        "anthropic": STORED_API_KEYS.get("anthropic") or os.getenv("ANTHROPIC_API_KEY", ""),
        "google": STORED_API_KEYS.get("google") or os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", "")),
        "deepseek": STORED_API_KEYS.get("deepseek") or os.getenv("DEEPSEEK_API_KEY", "")
    }

    llm_result = RealLLMService.call_llm(model=model, prompt=prompt, api_keys=keys_to_use)

    input_tokens = llm_result['input_tokens']
    output_tokens = llm_result['output_tokens']

    session = Session.query.filter_by(agent_id=agent_id, status='Running').first()
    session_id = session.session_id if session else None

    budget_result = BudgetEngine.process_api_request(
        agent_id=agent_id,
        session_id=session_id,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens
    )

    if not budget_result['allowed']:
        return jsonify({
            'allowed': False,
            'reason': budget_result['reason'],
            'suggested_model': budget_result.get('suggested_model'),
            'cost': budget_result['cost']
        }), 402

    return jsonify({
        'allowed': True,
        'response_text': llm_result['response_text'],
        'input_tokens': input_tokens,
        'output_tokens': output_tokens,
        'tokens': input_tokens + output_tokens,
        'cost': budget_result['cost'],
        'provider': llm_result['provider'],
        'agent_remaining_budget': budget_result['agent_remaining_budget'],
        'policy_triggers': budget_result.get('policy_triggers', []),
        'note': llm_result.get('note')
    }), 200
