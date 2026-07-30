from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='Viewer') # Admin, Manager, Viewer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Organization(db.Model):
    __tablename__ = 'organizations'

    organization_id = db.Column(db.Integer, primary_key=True)
    organization_name = db.Column(db.String(150), nullable=False)
    monthly_budget = db.Column(db.Float, nullable=False, default=10000.0)
    used_budget = db.Column(db.Float, nullable=False, default=0.0)
    remaining_budget = db.Column(db.Float, nullable=False, default=10000.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teams = db.relationship('Team', backref='organization', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        percentage = (self.used_budget / self.monthly_budget * 100) if self.monthly_budget > 0 else 0
        return {
            'organization_id': self.organization_id,
            'organization_name': self.organization_name,
            'monthly_budget': round(self.monthly_budget, 2),
            'used_budget': round(self.used_budget, 2),
            'remaining_budget': round(self.remaining_budget, 2),
            'budget_percentage': round(percentage, 2),
            'teams_count': len(self.teams),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Team(db.Model):
    __tablename__ = 'teams'

    team_id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.organization_id'), nullable=False)
    team_name = db.Column(db.String(150), nullable=False)
    monthly_budget = db.Column(db.Float, nullable=False, default=2500.0)
    used_budget = db.Column(db.Float, nullable=False, default=0.0)
    remaining_budget = db.Column(db.Float, nullable=False, default=2500.0)

    agents = db.relationship('AIAgent', backref='team', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        percentage = (self.used_budget / self.monthly_budget * 100) if self.monthly_budget > 0 else 0
        return {
            'team_id': self.team_id,
            'organization_id': self.organization_id,
            'organization_name': self.organization.organization_name if self.organization else 'Unknown',
            'team_name': self.team_name,
            'monthly_budget': round(self.monthly_budget, 2),
            'used_budget': round(self.used_budget, 2),
            'remaining_budget': round(self.remaining_budget, 2),
            'budget_percentage': round(percentage, 2),
            'agents_count': len(self.agents)
        }

class AIAgent(db.Model):
    __tablename__ = 'ai_agents'

    agent_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=False)
    agent_name = db.Column(db.String(150), nullable=False)
    preferred_model = db.Column(db.String(50), nullable=False, default='gpt-4o')
    fallback_model = db.Column(db.String(50), nullable=False, default='gpt-4o-mini')
    monthly_budget = db.Column(db.Float, nullable=False, default=500.0)
    used_budget = db.Column(db.Float, nullable=False, default=0.0)
    remaining_budget = db.Column(db.Float, nullable=False, default=500.0)
    status = db.Column(db.String(20), nullable=False, default='Active') # Active, Suspended, Blocked

    sessions = db.relationship('Session', backref='agent', lazy=True, cascade="all, delete-orphan")
    usage_logs = db.relationship('APIUsageLog', backref='agent', lazy=True)
    alerts = db.relationship('Alert', backref='agent', lazy=True)

    def to_dict(self):
        percentage = (self.used_budget / self.monthly_budget * 100) if self.monthly_budget > 0 else 0
        return {
            'agent_id': self.agent_id,
            'team_id': self.team_id,
            'team_name': self.team.team_name if self.team else 'Unknown',
            'organization_id': self.team.organization_id if self.team else None,
            'organization_name': self.team.organization.organization_name if self.team and self.team.organization else 'Unknown',
            'agent_name': self.agent_name,
            'preferred_model': self.preferred_model,
            'fallback_model': self.fallback_model,
            'monthly_budget': round(self.monthly_budget, 2),
            'used_budget': round(self.used_budget, 2),
            'remaining_budget': round(self.remaining_budget, 2),
            'budget_percentage': round(percentage, 2),
            'status': self.status
        }

class Session(db.Model):
    __tablename__ = 'sessions'

    session_id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('ai_agents.agent_id'), nullable=False)
    session_budget = db.Column(db.Float, nullable=False, default=50.0)
    used_budget = db.Column(db.Float, nullable=False, default=0.0)
    remaining_budget = db.Column(db.Float, nullable=False, default=50.0)
    status = db.Column(db.String(20), nullable=False, default='Running') # Running, Completed, Terminated, Closed
    created_time = db.Column(db.DateTime, default=datetime.utcnow)

    usage_logs = db.relationship('APIUsageLog', backref='session', lazy=True)

    def to_dict(self):
        percentage = (self.used_budget / self.session_budget * 100) if self.session_budget > 0 else 0
        return {
            'session_id': self.session_id,
            'agent_id': self.agent_id,
            'agent_name': self.agent.agent_name if self.agent else 'Unknown',
            'session_budget': round(self.session_budget, 2),
            'used_budget': round(self.used_budget, 2),
            'remaining_budget': round(self.remaining_budget, 2),
            'budget_percentage': round(percentage, 2),
            'status': self.status,
            'created_time': self.created_time.isoformat() if self.created_time else None
        }

class APIUsageLog(db.Model):
    __tablename__ = 'api_usage_logs'

    usage_id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('ai_agents.agent_id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('sessions.session_id'), nullable=True)
    tokens = db.Column(db.Integer, nullable=False, default=0)
    input_tokens = db.Column(db.Integer, nullable=False, default=0)
    output_tokens = db.Column(db.Integer, nullable=False, default=0)
    cost = db.Column(db.Float, nullable=False, default=0.0)
    provider = db.Column(db.String(50), nullable=False, default='OpenAI')
    model = db.Column(db.String(50), nullable=False, default='gpt-4o')
    request_time = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False, default='Success') # Success, Blocked, Failed

    def to_dict(self):
        return {
            'usage_id': self.usage_id,
            'agent_id': self.agent_id,
            'agent_name': self.agent.agent_name if self.agent else 'Unknown',
            'team_name': self.agent.team.team_name if self.agent and self.agent.team else 'Unknown',
            'organization_name': self.agent.team.organization.organization_name if self.agent and self.agent.team and self.agent.team.organization else 'Unknown',
            'session_id': self.session_id,
            'tokens': self.tokens,
            'input_tokens': self.input_tokens,
            'output_tokens': self.output_tokens,
            'cost': round(self.cost, 5),
            'provider': self.provider,
            'model': self.model,
            'status': self.status,
            'request_time': self.request_time.isoformat() if self.request_time else None
        }

class Alert(db.Model):
    __tablename__ = 'alerts'

    alert_id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('ai_agents.agent_id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False) # Budget Warning, Critical Limit, Request Blocked, Model Fallback Triggered
    severity = db.Column(db.String(20), nullable=False, default='Warning') # Info, Warning, High, Critical
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_resolved = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'alert_id': self.alert_id,
            'agent_id': self.agent_id,
            'agent_name': self.agent.agent_name if self.agent else 'Unknown',
            'team_name': self.agent.team.team_name if self.agent and self.agent.team else 'Unknown',
            'alert_type': self.alert_type,
            'severity': self.severity,
            'message': self.message,
            'is_resolved': self.is_resolved,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Report(db.Model):
    __tablename__ = 'reports'

    report_id = db.Column(db.Integer, primary_key=True)
    report_type = db.Column(db.String(50), nullable=False) # Daily, Monthly, Agent, Team, Organization, Token Usage
    generated_date = db.Column(db.DateTime, default=datetime.utcnow)
    summary_json = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'report_id': self.report_id,
            'report_type': self.report_type,
            'generated_date': self.generated_date.isoformat() if self.generated_date else None,
            'summary_json': self.summary_json
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    username = db.Column(db.String(80), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    target_type = db.Column(db.String(50), nullable=True)
    target_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'log_id': self.log_id,
            'user_id': self.user_id,
            'username': self.username,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
