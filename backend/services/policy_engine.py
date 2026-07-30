from models import db, AIAgent, Alert, Session, Team, Organization
from config import Config

class PolicyEngine:
    @staticmethod
    def evaluate_agent_policies(agent: AIAgent) -> list:
        """
        Evaluates policy rules for an agent after a budget deduction.
        Generates alerts, recommends fallback model, or changes agent status.
        """
        if agent.monthly_budget <= 0:
            return []

        usage_ratio = agent.used_budget / agent.monthly_budget
        triggers = []

        # Check >= 100% threshold
        if usage_ratio >= Config.POLICY_BLOCK_THRESHOLD:
            agent.status = 'Blocked'
            
            # Close active sessions
            active_sessions = Session.query.filter_by(agent_id=agent.agent_id, status='Running').all()
            for s in active_sessions:
                s.status = 'Closed'

            alert_msg = f"CRITICAL: Agent '{agent.agent_name}' has depleted 100% of its monthly budget (${agent.monthly_budget}). Agent blocked and active sessions closed."
            
            # Prevent duplicate recent unhandled alerts
            existing = Alert.query.filter_by(agent_id=agent.agent_id, alert_type="Budget Exhausted", is_resolved=False).first()
            if not existing:
                alert = Alert(
                    agent_id=agent.agent_id,
                    alert_type="Budget Exhausted",
                    severity="Critical",
                    message=alert_msg
                )
                db.session.add(alert)
                triggers.append({"type": "Budget Exhausted", "severity": "Critical", "message": alert_msg})

        # Check >= 90% threshold
        elif usage_ratio >= Config.POLICY_CRITICAL_THRESHOLD:
            alert_msg = f"HIGH ALERT: Agent '{agent.agent_name}' has reached {usage_ratio*100:.1f}% of budget limit (${agent.used_budget:.2f} / ${agent.monthly_budget:.2f}). Consider switching to fallback model '{agent.fallback_model}'."
            existing = Alert.query.filter_by(agent_id=agent.agent_id, alert_type="High Budget Warning", is_resolved=False).first()
            if not existing:
                alert = Alert(
                    agent_id=agent.agent_id,
                    alert_type="High Budget Warning",
                    severity="High",
                    message=alert_msg
                )
                db.session.add(alert)
                triggers.append({"type": "High Budget Warning", "severity": "High", "message": alert_msg})

        # Check >= 80% threshold
        elif usage_ratio >= Config.POLICY_WARNING_THRESHOLD:
            alert_msg = f"WARNING: Agent '{agent.agent_name}' budget usage reached {usage_ratio*100:.1f}%. Remaining: ${agent.remaining_budget:.2f}."
            existing = Alert.query.filter_by(agent_id=agent.agent_id, alert_type="Budget Warning", is_resolved=False).first()
            if not existing:
                alert = Alert(
                    agent_id=agent.agent_id,
                    alert_type="Budget Warning",
                    severity="Warning",
                    message=alert_msg
                )
                db.session.add(alert)
                triggers.append({"type": "Budget Warning", "severity": "Warning", "message": alert_msg})

        db.session.commit()
        return triggers
