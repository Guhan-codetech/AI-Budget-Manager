import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from models import db, User, Organization, Team, AIAgent, Session, APIUsageLog, Alert, Report, AuditLog
from config import Config

def seed_database():
    """Populates the database with realistic enterprise dummy data."""
    # Clear existing tables
    db.drop_all()
    db.create_all()

    print("Seeding Users...")
    # 1. Users
    users = [
        User(username="admin", email="admin@agentbudget.ai", password=generate_password_hash("admin123"), role="Admin"),
        User(username="manager", email="manager@agentbudget.ai", password=generate_password_hash("manager123"), role="Manager"),
        User(username="viewer", email="viewer@agentbudget.ai", password=generate_password_hash("viewer123"), role="Viewer"),
    ]
    db.session.add_all(users)
    db.session.commit()

    print("Seeding Organizations...")
    # 2. 10 Organizations
    org_names = [
        "FinTech Global Solutions", "HealthAI Enterprise", "CyberShield Defense", 
        "RetailTech Commerce", "OmniData Analytics", "AutoCloud Mobility", 
        "BioGen AI Labs", "LogiChain Dynamics", "EduSmart Learning", "Apex Media Group"
    ]
    organizations = []
    for name in org_names:
        budget = round(random.uniform(25000.0, 150000.0), 2)
        org = Organization(
            organization_name=name,
            monthly_budget=budget,
            used_budget=0.0,
            remaining_budget=budget
        )
        organizations.append(org)
    db.session.add_all(organizations)
    db.session.commit()

    print("Seeding Teams...")
    # 3. 20 Teams
    team_prefixes = [
        "Core NLP", "Customer Support Copilot", "Risk Analysis Engine", 
        "Document Processing", "Code Assistant Team", "Market Intelligence", 
        "Fraud Detection", "Visual Recognition", "Search & Discovery", 
        "Autonomous Agents", "Billing Automation", "Data Science Core",
        "Personalization Engine", "Predictive Support", "DevOps Assistant",
        "Legal Compliance", "HR Automation", "Content Generation",
        "Security Operations", "API Integration Unit"
    ]
    teams = []
    for i, prefix in enumerate(team_prefixes):
        org = organizations[i % len(organizations)]
        team_budget = round(org.monthly_budget / random.uniform(3.5, 6.0), 2)
        t = Team(
            organization_id=org.organization_id,
            team_name=f"{org.organization_name[:6]} - {prefix}",
            monthly_budget=team_budget,
            used_budget=0.0,
            remaining_budget=team_budget
        )
        teams.append(t)
    db.session.add_all(teams)
    db.session.commit()

    print("Seeding AI Agents...")
    # 4. 50 AI Agents
    models_pool = [
        ("gpt-4o", "gpt-4o-mini"),
        ("gpt-4", "gpt-4o-mini"),
        ("claude-3-5-sonnet", "claude-3-haiku"),
        ("claude-3-opus", "claude-3-5-sonnet"),
        ("gemini-1.5-pro", "gemini-1.5-flash"),
        ("deepseek-r1", "gpt-4o-mini")
    ]

    agent_roles = [
        "Summarizer Agent", "Code Review Bot", "Customer Chat Agent", "Invoice Parser", 
        "Data Mining Agent", "Security Log Analyzer", "Translation Bot", "RAG Retriever",
        "Email Auto-Responder", "SQL Query Builder", "Sentiment Classifier", "Report Generator"
    ]

    agents = []
    for i in range(50):
        t = teams[i % len(teams)]
        pref_m, fall_m = random.choice(models_pool)
        role = agent_roles[i % len(agent_roles)]
        agent_budget = round(t.monthly_budget / random.uniform(2.0, 4.0), 2)
        
        agent = AIAgent(
            team_id=t.team_id,
            agent_name=f"{role} #{i+101}",
            preferred_model=pref_m,
            fallback_model=fall_m,
            monthly_budget=agent_budget,
            used_budget=0.0,
            remaining_budget=agent_budget,
            status=random.choice(["Active", "Active", "Active", "Active", "Suspended"])
        )
        agents.append(agent)
    db.session.add_all(agents)
    db.session.commit()

    print("Seeding Sessions...")
    # 5. 200 Sessions
    sessions = []
    statuses = ["Running", "Completed", "Terminated", "Closed"]
    for i in range(200):
        agent = agents[i % len(agents)]
        s_budget = round(random.uniform(20.0, 200.0), 2)
        session = Session(
            agent_id=agent.agent_id,
            session_budget=s_budget,
            used_budget=0.0,
            remaining_budget=s_budget,
            status=random.choice(statuses),
            created_time=datetime.utcnow() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        )
        sessions.append(session)
    db.session.add_all(sessions)
    db.session.commit()

    print("Seeding API Usage Logs (500 logs)...")
    # 6. 500 API Usage Logs
    usage_logs = []
    now = datetime.utcnow()

    for i in range(500):
        agent = agents[i % len(agents)]
        session = sessions[i % len(sessions)] if i % 2 == 0 else None
        
        # Decide model (preferred vs fallback)
        use_fallback = random.random() < 0.25
        model = agent.fallback_model if use_fallback else agent.preferred_model
        
        pricing = Config.MODEL_PRICING.get(model.lower(), Config.MODEL_PRICING["gpt-4o"])
        provider = pricing.get("provider", "OpenAI")

        input_toks = random.randint(150, 4500)
        output_toks = random.randint(50, 1800)
        total_toks = input_toks + output_toks

        # Calculate cost
        cost = round(((input_toks / 1000.0) * pricing["input"]) + ((output_toks / 1000.0) * pricing["output"]), 6)
        
        # Random time within last 30 days
        days_ago = random.uniform(0, 30)
        req_time = now - timedelta(days=days_ago, minutes=random.randint(0, 1440))
        
        is_blocked = random.random() < 0.05
        status = "Blocked" if is_blocked else "Success"

        log = APIUsageLog(
            agent_id=agent.agent_id,
            session_id=session.session_id if session else None,
            tokens=total_toks,
            input_tokens=input_toks,
            output_tokens=output_toks,
            cost=cost if status == "Success" else 0.0,
            provider=provider,
            model=model,
            status=status,
            request_time=req_time
        )
        usage_logs.append(log)

        # Update budget accumulators for successful calls
        if status == "Success":
            agent.used_budget += cost
            if session:
                session.used_budget += cost
            
            t = agent.team
            if t:
                t.used_budget += cost
                o = t.organization
                if o:
                    o.used_budget += cost

    db.session.add_all(usage_logs)

    # Recalculate remaining budgets and update status
    for a in agents:
        a.used_budget = round(a.used_budget, 2)
        a.remaining_budget = max(0.0, round(a.monthly_budget - a.used_budget, 2))
        if a.used_budget >= a.monthly_budget:
            a.status = "Blocked"

    for s in sessions:
        s.used_budget = round(s.used_budget, 2)
        s.remaining_budget = max(0.0, round(s.session_budget - s.used_budget, 2))

    for t in teams:
        t.used_budget = round(t.used_budget, 2)
        t.remaining_budget = max(0.0, round(t.monthly_budget - t.used_budget, 2))

    for o in organizations:
        o.used_budget = round(o.used_budget, 2)
        o.remaining_budget = max(0.0, round(o.monthly_budget - o.used_budget, 2))

    db.session.commit()

    print("Seeding Alerts (100 alerts)...")
    # 7. 100 Alerts
    alert_types = [
        ("Budget Warning", "Warning", "Agent spending reached 82% of allocated budget."),
        ("High Budget Warning", "High", "Agent usage exceeded 90% threshold. Fallback model recommended."),
        ("Budget Exhausted", "Critical", "Monthly budget cap reached (100%). Request pipeline paused."),
        ("Request Blocked", "Critical", "API Request rejected due to team budget limit overflow."),
        ("Model Fallback Triggered", "Info", "Automated policy rerouted prompt from GPT-4 to GPT-4o-mini."),
        ("Abnormal Token Spike", "High", "Single prompt consumed >12,000 tokens (Z-Score: 3.2).")
    ]

    alerts = []
    for i in range(100):
        agent = agents[i % len(agents)]
        a_type, severity, msg = random.choice(alert_types)
        alert = Alert(
            agent_id=agent.agent_id,
            alert_type=a_type,
            severity=severity,
            message=f"{msg} (Agent: {agent.agent_name})",
            timestamp=now - timedelta(days=random.uniform(0, 15), hours=random.randint(0, 23)),
            is_resolved=random.choice([True, False, False])
        )
        alerts.append(alert)
    db.session.add_all(alerts)

    print("Seeding Reports & Audit Logs...")
    # 8. Reports & Audit Logs
    report1 = Report(report_type="Monthly Budget Report", summary_json='{"total_spent": 14230.50, "savings": 2150.00}')
    report2 = Report(report_type="Agent Spending Report", summary_json='{"top_spending_agent": "Code Review Bot #102"}')
    db.session.add_all([report1, report2])

    audit = AuditLog(username="admin", action="Initialized System Seed", target_type="System", details="Generated 10 Orgs, 20 Teams, 50 Agents, 500 API Logs, 100 Alerts")
    db.session.add(audit)

    db.session.commit()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    from app import app
    with app.app_context():
        seed_database()
