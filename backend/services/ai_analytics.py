from models import db, APIUsageLog, AIAgent, Organization, Team
from datetime import datetime, timedelta
from config import Config

class AIAnalytics:
    @staticmethod
    def forecast_spending() -> dict:
        """
        AI Budget Prediction: Projects total monthly spending based on recent daily velocity.
        """
        logs = APIUsageLog.query.order_by(APIUsageLog.request_time.asc()).all()
        if not logs:
            return {
                "projected_monthly_spend": 0.0,
                "current_month_spend": 0.0,
                "daily_burn_rate": 0.0,
                "days_until_budget_exhausted": 30,
                "recommendation": "Insufficient data for forecasting."
            }

        total_cost_so_far = sum(l.cost for l in logs)
        first_time = logs[0].request_time
        last_time = logs[-1].request_time
        days_span = max(1.0, (last_time - first_time).total_seconds() / 86400.0)

        daily_burn_rate = total_cost_so_far / days_span
        projected_monthly_spend = daily_burn_rate * 30.0

        orgs = Organization.query.all()
        total_org_budget = sum(o.monthly_budget for o in orgs) or 1.0
        total_org_remaining = sum(o.remaining_budget for o in orgs)

        days_until_exhausted = (total_org_remaining / daily_burn_rate) if daily_burn_rate > 0 else 999

        recommendation = "Spending is within normal parameters."
        if projected_monthly_spend > total_org_budget:
            overrun_pct = ((projected_monthly_spend - total_org_budget) / total_org_budget) * 100
            recommendation = f"ALERT: Projected to exceed total monthly budget by {overrun_pct:.1f}%. Consider enabling auto-fallback to lower cost models."
        elif days_until_exhausted < 10:
            recommendation = f"CRITICAL: At current burn rate of ${daily_burn_rate:.2f}/day, remaining budget will be exhausted in {int(days_until_exhausted)} days."

        return {
            "projected_monthly_spend": round(projected_monthly_spend, 2),
            "current_month_spend": round(total_cost_so_far, 2),
            "daily_burn_rate": round(daily_burn_rate, 2),
            "total_monthly_budget": round(total_org_budget, 2),
            "days_until_budget_exhausted": int(min(365, days_until_exhausted)),
            "recommendation": recommendation
        }

    @staticmethod
    def detect_anomalies() -> list:
        """
        Detects abnormal spending / unusually high token usage logs.
        """
        logs = APIUsageLog.query.filter_by(status='Success').order_by(APIUsageLog.tokens.desc()).limit(100).all()
        if not logs:
            return []

        token_list = [l.tokens for l in logs]
        avg_tokens = sum(token_list) / len(token_list)
        
        # Calculate standard deviation
        variance = sum((x - avg_tokens) ** 2 for x in token_list) / len(token_list)
        std_dev = (variance ** 0.5) if variance > 0 else 1.0

        anomalies = []
        for l in logs:
            z_score = (l.tokens - avg_tokens) / std_dev
            if z_score > 2.0: # Tokens > 2 std dev above mean
                anomalies.append({
                    "usage_id": l.usage_id,
                    "agent_id": l.agent_id,
                    "agent_name": l.agent.agent_name if l.agent else "Unknown",
                    "model": l.model,
                    "tokens": l.tokens,
                    "cost": round(l.cost, 4),
                    "request_time": l.request_time.isoformat(),
                    "anomaly_reason": f"Unusually high token payload ({l.tokens} tokens, Z-Score: {z_score:.2f})"
                })

        return anomalies[:10] # Return top 10 anomalies

    @staticmethod
    def get_model_recommendations() -> list:
        """
        Generates recommendations for Agents running expensive models when near budget limits.
        """
        agents = AIAgent.query.all()
        recommendations = []

        for a in agents:
            percentage = (a.used_budget / a.monthly_budget * 100) if a.monthly_budget > 0 else 0
            pref_pricing = Config.MODEL_PRICING.get(a.preferred_model.lower(), {"input": 0.005, "output": 0.015})
            fall_pricing = Config.MODEL_PRICING.get(a.fallback_model.lower(), {"input": 0.00015, "output": 0.0006})

            # Calculate potential savings percentage
            pref_avg_rate = (pref_pricing["input"] + pref_pricing["output"]) / 2.0
            fall_avg_rate = (fall_pricing["input"] + fall_pricing["output"]) / 2.0
            savings_pct = ((pref_avg_rate - fall_avg_rate) / pref_avg_rate * 100) if pref_avg_rate > 0 else 0

            if percentage >= 70 and a.preferred_model != a.fallback_model:
                recommendations.append({
                    "agent_id": a.agent_id,
                    "agent_name": a.agent_name,
                    "team_name": a.team.team_name if a.team else "Unknown",
                    "current_model": a.preferred_model,
                    "recommended_fallback": a.fallback_model,
                    "budget_percentage": round(percentage, 1),
                    "estimated_cost_reduction_pct": round(savings_pct, 1),
                    "action_suggested": f"Switch '{a.agent_name}' from {a.preferred_model} to {a.fallback_model} to save ~{savings_pct:.0f}% on per-token costs."
                })

        return recommendations
