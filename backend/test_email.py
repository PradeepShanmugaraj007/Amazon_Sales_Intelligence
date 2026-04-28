from app.services.email_service import send_email
import sys
try:
    sent = send_email("test@example.com", "Test", "<b>Test</b>")
    print("Sent:", sent)
except Exception as e:
    print("FATAL ERROR", e)
