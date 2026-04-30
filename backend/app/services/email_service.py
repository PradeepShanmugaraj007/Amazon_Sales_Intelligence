import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_email(to_email: str, subject: str, html_body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False

def get_welcome_email_html(name, user_id, password, plan):
    plan_colors = {"starter": "#64748b", "pro": "#a855f7", "enterprise": "#f59e0b"}
    color = plan_colors.get(plan.lower(), "#3b82f6")
    return f"""
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" max-width="600" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:60px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:900;letter-spacing:-1px;">SellerIQ <span style="color:#60a5fa;">Pro</span></h1>
              <p style="color:rgba(255,255,255,0.6);margin:12px 0 0;font-size:14px;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Account Activation</p>
            </td>
          </tr>
          <tr>
            <td style="padding:50px 40px;">
              <h2 style="color:#0f172a;font-size:24px;margin:0 0 16px;font-weight:800;">Welcome to the Inner Circle, {name}</h2>
              <p style="color:#64748b;font-size:16px;line-height:1.7;margin:0 0 40px;">
                Your subscription has been successfully provisioned. You now have full access to the SellerIQ Pro intelligence suite. Below are your unique workspace credentials.
              </p>
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:20px;border:1px solid #edf2f7;margin-bottom:40px;">
                <tr>
                  <td style="padding:32px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom:24px;">
                          <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Plan Tier</div>
                          <div style="display:inline-block;padding:6px 16px;background-color:{color}15;color:{color};border-radius:100px;font-size:13px;font-weight:800;border:1px solid {color}30;">{plan.upper()}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:24px;">
                          <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Workspace ID</div>
                          <div style="font-size:24px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">{user_id}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Access Key</div>
                          <div style="font-size:24px;font-weight:900;color:#3b82f6;letter-spacing:-0.5px;">{password}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#ef4444;font-size:13px;font-weight:700;margin-bottom:32px;display:flex;align-items:center;gap:8px;">
                🔒 Security Note: Please rotate your access key immediately upon first login.
              </p>

              <a href="http://localhost:5173" style="display:block;text-align:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;padding:20px;border-radius:16px;text-decoration:none;font-weight:800;font-size:16px;box-shadow:0 10px 30px rgba(37,99,235,0.25);">
                Initialize Workspace Access
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;background-color:#fcfdfe;text-align:center;border-top:1px solid #f1f5f9;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">Managed by SellerIQ Global Intelligence Division</p>
              <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; 2026 SellerIQ Pro. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

def get_reset_email_html(name, new_password):
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;">SellerIQ <span style="color:#60a5fa;">Pro</span></h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Password Reset, {name}</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 32px;">
        Your password has been reset. Use the temporary password below to log in.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">NEW TEMPORARY PASSWORD</div>
        <div style="font-size:28px;font-weight:900;color:#3b82f6;font-family:monospace;">{new_password}</div>
      </div>
      <p style="color:#64748b;font-size:13px;">If you did not request this, please contact support immediately.</p>
    </div>
  </div>
</body>
</html>
"""

def get_expiry_warning_email_html(name, plan, expiry_date):
    plan_colors = {"starter": "#64748b", "pro": "#a855f7", "enterprise": "#f59e0b"}
    color = plan_colors.get(plan.lower(), "#3b82f6")
    return f"""
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#fff7ed;font-family:'Inter', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" max-width="600" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 25px 60px rgba(124,45,18,0.1);border:1px solid #ffedd5;">
          <tr>
            <td style="background:linear-gradient(135deg,#7c2d12,#ea580c);padding:60px 40px;text-align:center;">
              <div style="font-size:56px;margin-bottom:20px;">⚖️</div>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;">Subscription Continuity Notice</h1>
              <p style="color:rgba(255,255,255,0.7);margin:12px 0 0;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Action Required Immediately</p>
            </td>
          </tr>
          <tr>
            <td style="padding:50px 40px;">
              <h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;font-weight:800;">Hello {name},</h2>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 40px;">
                Our systems indicate that your <strong>{plan.upper()}</strong> intelligence subscription is approaching its term limit. To prevent any disruption to your risk modeling and regional analytics, a renewal cycle must be initiated.
              </p>
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#fffaf5;border-radius:20px;border:1px solid #ffedd5;margin-bottom:40px;">
                <tr>
                  <td style="padding:32px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom:24px;border-bottom:1px solid #ffedd5;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size:11px;font-weight:800;color:#9a3412;text-transform:uppercase;letter-spacing:1.5px;">Current Tier</td>
                              <td align="right" style="font-size:14px;font-weight:900;color:{color};">{plan.upper()}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:24px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size:11px;font-weight:800;color:#9a3412;text-transform:uppercase;letter-spacing:1.5px;">Expiration Date</td>
                              <td align="right" style="font-size:14px;font-weight:900;color:#c2410c;">{expiry_date}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <a href="http://localhost:5173" style="display:block;text-align:center;background:linear-gradient(135deg,#ea580c,#c2410c);color:#ffffff;padding:22px;border-radius:18px;text-decoration:none;font-weight:900;font-size:17px;box-shadow:0 12px 30px rgba(234,88,12,0.3);">
                ⚡ Authorize Subscription Renewal
              </a>
              
              <p style="color:#94a3b8;font-size:13px;text-align:center;margin-top:32px;font-weight:500;">
                Systems will remain active until the date specified above.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;background-color:#fcfdfe;text-align:center;border-top:1px solid #ffedd5;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;font-weight:600;">STATUTORY NOTICE: Automated Continuity Engine</p>
              <p style="color:#cbd5e0;font-size:11px;margin:0;">SellerIQ Pro Hub · 2026 Enterprise Edition</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

def get_otp_email_html(name: str, otp: str):
    return f"""
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f0f9ff;font-family:'Inter', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.07);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:48px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;">SellerIQ <span style="color:#60a5fa;">Pro</span></h1>
              <p style="color:rgba(255,255,255,0.55);margin:10px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Email Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:44px 40px;">
              <h2 style="color:#0f172a;font-size:22px;margin:0 0 12px;font-weight:800;">Hello {name} 👋</h2>
              <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 32px;">
                Use the one-time verification code below to complete your registration. This code expires in <strong>10 minutes</strong>.
              </p>
              <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
                <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Your OTP Code</div>
                <div style="font-size:44px;font-weight:900;color:#2563eb;letter-spacing:12px;font-family:monospace;">{otp}</div>
              </div>
              <p style="color:#ef4444;font-size:13px;font-weight:700;text-align:center;">🔒 Never share this code with anyone. SellerIQ staff will never ask for it.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;background-color:#fcfdfe;text-align:center;border-top:1px solid #f1f5f9;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 SellerIQ Pro. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
