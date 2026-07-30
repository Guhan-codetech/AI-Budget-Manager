import random
import time
import threading
from datetime import datetime
from models import db, AIAgent, Session
from services.budget_engine import BudgetEngine
from services.real_llm_service import RealLLMService

class LiveTrafficGenerator:
    _thread = None
    _running = False

    @classmethod
    def start_live_traffic(cls, app):
        if cls._running:
            return False
        cls._running = True

        def run_loop():
            from routes.llm_routes import STORED_API_KEYS
            with app.app_context():
                print("Started Live Background Real-Time AI Traffic Generator thread with API Keys...")
                prompts_pool = [
                    "Perform automated security log scan and detect anomalies.",
                    "Summarize recent customer support tickets and flag urgent issues.",
                    "Review code diff for potential SQL injection vulnerabilities.",
                    "Parse incoming invoice PDF and extract total line items.",
                    "Execute database query optimization check for slow indexes.",
                    "Translate user feedback from Spanish to English."
                ]
                models = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "gemini-1.5-pro", "deepseek-r1"]

                while cls._running:
                    try:
                        agent = AIAgent.query.filter_by(status='Active').order_by(db.func.random()).first()
                        if agent:
                            model = random.choice([agent.preferred_model, agent.fallback_model, random.choice(models)])
                            prompt = random.choice(prompts_pool)
                            
                            # Call Real LLM Service with API Keys
                            llm_res = RealLLMService.call_llm(model=model, prompt=prompt, api_keys=STORED_API_KEYS)
                            
                            session = Session.query.filter_by(agent_id=agent.agent_id, status='Running').first()
                            session_id = session.session_id if session else None

                            BudgetEngine.process_api_request(
                                agent_id=agent.agent_id,
                                session_id=session_id,
                                model=model,
                                input_tokens=llm_res['input_tokens'],
                                output_tokens=llm_res['output_tokens']
                            )
                    except Exception as e:
                        print(f"Error in real-time LLM traffic loop: {e}")
                    
                    time.sleep(random.uniform(2.5, 4.5))

        cls._thread = threading.Thread(target=run_loop, daemon=True)
        cls._thread.start()
        return True

    @classmethod
    def stop_live_traffic(cls):
        cls._running = False
        return True

    @classmethod
    def is_running(cls):
        return cls._running
