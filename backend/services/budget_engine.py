from config import Config
from models import db, Organization, Team, AIAgent, Session, APIUsageLog, Alert
from datetime import datetime

class BudgetEngine:
    @staticmethod
    def calculate_cost(model_name: str, input_tokens: int, output_tokens: int) -> tuple[float, str]:
        """Calculates cost in USD based on input and output token counts."""
        pricing_data = Config.MODEL_PRICING.get(model_name.lower(), Config.MODEL_PRICING["gpt-4o"])
        input_cost = (input_tokens / 1000.0) * pricing_data["input"]
        output_cost = (output_tokens / 1000.0) * pricing_data["output"]
        total_cost = input_cost + output_cost
        provider = pricing_data.get("provider", "OpenAI")
        return round(total_cost, 6), provider

    @classmethod
    def process_api_request(cls, agent_id: int, session_id: int, model: str, input_tokens: int, output_tokens: int) -> dict:
        """
        Executes the Core Budget Flow:
        Calculate Token Usage -> Calculate Cost -> Check Policy -> 
        Update Session -> Update Agent -> Update Team -> Update Org -> Store Everything
        """
        agent = AIAgent.query.get(agent_id)
        if not agent:
            return {"allowed": False, "reason": "Agent not found", "cost": 0.0}

        team = Team.query.get(agent.team_id)
        organization = Organization.query.get(team.organization_id) if team else None
        session = Session.query.get(session_id) if session_id else None

        total_tokens = input_tokens + output_tokens
        cost, provider = cls.calculate_cost(model, input_tokens, output_tokens)

        # Pre-check budget limits before processing
        rejection_reason = None
        if agent.status == 'Blocked':
            rejection_reason = f"Agent '{agent.agent_name}' is currently blocked."
        elif agent.remaining_budget < cost:
            rejection_reason = f"Agent budget limit exceeded. Required: ${cost:.4f}, Available: ${agent.remaining_budget:.4f}"
        elif session and session.status == 'Running' and session.remaining_budget < cost:
            rejection_reason = f"Session #{session_id} budget limit exceeded. Required: ${cost:.4f}, Available: ${session.remaining_budget:.4f}"
        elif team and team.remaining_budget < cost:
            rejection_reason = f"Team '{team.team_name}' monthly budget limit exceeded."
        elif organization and organization.remaining_budget < cost:
            rejection_reason = f"Organization '{organization.organization_name}' monthly budget limit exceeded."

        if rejection_reason:
            # Create a blocked usage log
            blocked_log = APIUsageLog(
                agent_id=agent_id,
                session_id=session_id,
                tokens=total_tokens,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost=cost,
                provider=provider,
                model=model,
                status='Blocked'
            )
            db.session.add(blocked_log)

            # Create Alert
            block_alert = Alert(
                agent_id=agent_id,
                alert_type="Request Blocked",
                severity="Critical",
                message=f"API Request blocked for agent '{agent.agent_name}': {rejection_reason}"
            )
            db.session.add(block_alert)
            db.session.commit()

            return {
                "allowed": False,
                "reason": rejection_reason,
                "cost": cost,
                "suggested_model": agent.fallback_model if model != agent.fallback_model else None
            }

        # Deduct budget down the hierarchy
        # 1. Session Update
        if session and session.status == 'Running':
            session.used_budget += cost
            session.remaining_budget = max(0.0, session.session_budget - session.used_budget)
            if session.remaining_budget <= 0:
                session.status = 'Completed'

        # 2. Agent Update
        agent.used_budget += cost
        agent.remaining_budget = max(0.0, agent.monthly_budget - agent.used_budget)

        # 3. Team Update
        if team:
            team.used_budget += cost
            team.remaining_budget = max(0.0, team.monthly_budget - team.used_budget)

        # 4. Organization Update
        if organization:
            organization.used_budget += cost
            organization.remaining_budget = max(0.0, organization.monthly_budget - organization.used_budget)

        # 5. Create Usage Log
        usage_log = APIUsageLog(
            agent_id=agent_id,
            session_id=session_id,
            tokens=total_tokens,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            provider=provider,
            model=model,
            status='Success'
        )
        db.session.add(usage_log)

        db.session.commit()

        # Trigger Policy Engine check after deduction
        from services.policy_engine import PolicyEngine
        policy_triggers = PolicyEngine.evaluate_agent_policies(agent)

        return {
            "allowed": True,
            "cost": cost,
            "tokens": total_tokens,
            "provider": provider,
            "agent_used_budget": round(agent.used_budget, 4),
            "agent_remaining_budget": round(agent.remaining_budget, 4),
            "policy_triggers": policy_triggers
        }
