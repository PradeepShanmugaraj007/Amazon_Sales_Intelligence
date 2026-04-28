from datetime import datetime, timedelta
import uuid

# ── Plan expiry helpers ────────────────────────────────────────────────────────
def _expiry_in_1h():
    """Return an ISO-8601 string 1 hour from now (UTC)."""
    return (datetime.utcnow() + timedelta(hours=1)).isoformat()

class StatelessService:
    def __init__(self):
        from app.core.security import get_password_hash

        # ── Demo accounts – one per plan for aajay1118@gmail.com ─────────────
        demo_password = get_password_hash("Demo@1234")
        now = datetime.utcnow()
        expiry_30d = (now + timedelta(days=30)).isoformat()

        demo_starter = {
            "id": "demo-starter-id",
            "user_id": "SIQ-DEMO1",
            "name": "Ajay Demo (Starter)",
            "email": "aajay1118+starter@gmail.com",
            "phone": "9000000001",
            "plan": "starter",
            "status": "Active",
            "monthly_uploads": 0,
            "joined": now,
            "plan_start": now.isoformat(),
            "plan_expiry": expiry_30d,
            "password": demo_password,
        }
        demo_pro = {
            "id": "demo-pro-id",
            "user_id": "SIQ-DEMO2",
            "name": "Ajay Demo (Pro)",
            "email": "aajay1118+pro@gmail.com",
            "phone": "9000000002",
            "plan": "pro",
            "status": "Active",
            "monthly_uploads": 0,
            "joined": now,
            "plan_start": now.isoformat(),
            "plan_expiry": expiry_30d,
            "password": demo_password,
        }
        demo_enterprise = {
            "id": "demo-enterprise-id",
            "user_id": "SIQ-DEMO3",
            "name": "Ajay Demo (Enterprise)",
            "email": "aajay1118@gmail.com",
            "phone": "9000000003",
            "plan": "enterprise",
            "status": "Active",
            "monthly_uploads": 0,
            "joined": now,
            "plan_start": now.isoformat(),
            "plan_expiry": expiry_30d,
            "password": demo_password,
        }

        # In-memory user store to persist data during the server lifecycle
        self.users = {
            "mock_guest_id": {
                "id": "mock_guest_id",
                "user_id": "GUEST-001",
                "name": "Guest Admin",
                "email": "admin@selleriq.pro",
                "phone": "9999999999",
                "plan": "enterprise",
                "status": "Active",
                "monthly_uploads": 0,
                "joined": now,
                "password": "",  # This would be a hashed password in a real app
            },
            "demo-starter-id": demo_starter,
            "demo-pro-id": demo_pro,
            "demo-enterprise-id": demo_enterprise,
        }
        self.reports = []

    # ── User Operations ──────────────────────────────────────────────────────
    def find_user_by_email(self, email: str):
        email_lower = email.lower()
        for user in self.users.values():
            if user.get("email", "").lower() == email_lower:
                return user
        return None

    def create_user(self, user_data: dict):
        user_id = str(uuid.uuid4())
        user_data["id"] = user_id
        if "joined" not in user_data:
            user_data["joined"] = datetime.utcnow()
        self.users[user_id] = user_data
        return user_id

    def update_user(self, user_id: str, update_data: dict):
        if user_id in self.users:
            self.users[user_id].update(update_data)
        else:
            # Fallback for old hardcoded IDs if they appear
            for uid, user in self.users.items():
                if uid == user_id or user.get("id") == user_id:
                    user.update(update_data)

    def get_all_users(self):
        return list(self.users.values())

    # ── Plan Status ──────────────────────────────────────────────────────────
    def get_plan_status(self, user: dict) -> dict:
        """
        Returns plan expiry status for a user.
        Status values: 'active' | 'expiring_soon' | 'expired'
        """
        expiry_str = user.get("plan_expiry")
        if not expiry_str:
            # No expiry set → treat as never-expiring (admin / legacy users)
            return {"status": "active", "minutes_remaining": None, "expiry_date": None}

        try:
            expiry_dt = datetime.fromisoformat(expiry_str)
        except Exception:
            return {"status": "active", "minutes_remaining": None, "expiry_date": expiry_str}

        now = datetime.utcnow()
        diff = expiry_dt - now
        minutes_remaining = int(diff.total_seconds() / 60)
        expiry_readable = expiry_dt.strftime("%Y-%m-%d %H:%M UTC")

        if diff.total_seconds() <= 0:
            return {"status": "expired", "minutes_remaining": 0, "expiry_date": expiry_readable}
        elif diff.days <= 7:   # less than 7 days left
            return {"status": "expiring_soon", "minutes_remaining": minutes_remaining, "expiry_date": expiry_readable}
        else:
            return {"status": "active", "minutes_remaining": minutes_remaining, "expiry_date": expiry_readable}

    # ── Report Operations ────────────────────────────────────────────────────
    def create_report(self, report_data: dict):
        report_data["id"] = str(uuid.uuid4())
        report_data["upload_date"] = datetime.utcnow()
        self.reports.append(report_data)
        return report_data["id"]

    def get_reports_by_user(self, user_id: str):
        return [r for r in self.reports if r["user_id"] == user_id]

# Singleton instance for the app
stateless_service = StatelessService()
