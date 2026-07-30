import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-jwt-key-agent-budget-controller-2026")
    # Support MySQL via DB_URI env var, default to SQLite for instant local execution
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        "sqlite:///" + os.path.join(os.path.abspath(os.path.dirname(__file__)), "agent_budget.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Model Pricing per 1k tokens (Input / Output) in USD
    MODEL_PRICING = {
        "gpt-4": {"input": 0.03, "output": 0.06, "provider": "OpenAI"},
        "gpt-4o": {"input": 0.005, "output": 0.015, "provider": "OpenAI"},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006, "provider": "OpenAI"},
        "claude-3-5-sonnet": {"input": 0.003, "output": 0.015, "provider": "Anthropic"},
        "claude-3-haiku": {"input": 0.00025, "output": 0.00125, "provider": "Anthropic"},
        "claude-3-opus": {"input": 0.015, "output": 0.075, "provider": "Anthropic"},
        "gemini-1.5-pro": {"input": 0.00125, "output": 0.005, "provider": "Google"},
        "gemini-1.5-flash": {"input": 0.000075, "output": 0.0003, "provider": "Google"},
        "deepseek-r1": {"input": 0.00055, "output": 0.00219, "provider": "DeepSeek"},
    }

    # Policy Thresholds
    POLICY_WARNING_THRESHOLD = 0.80      # 80% usage
    POLICY_CRITICAL_THRESHOLD = 0.90     # 90% usage
    POLICY_BLOCK_THRESHOLD = 1.00        # 100% usage
