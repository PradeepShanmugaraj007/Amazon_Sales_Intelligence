from datetime import datetime
import uuid

class StatelessService:
    def __init__(self):
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
                "joined": datetime.utcnow(),
                "password": "" # This would be a hashed password in a real app
            }
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
