import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("email_service")

class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, name: str, otp: str) -> bool:
        subject = f"Your Verification OTP: {otp} - {settings.PROJECT_NAME}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #15803d; margin: 0;">Poultry Farm Portal</h2>
                <p style="color: #64748b; font-size: 14px;">Mortality Management System</p>
            </div>
            <p>Hello <strong>{name}</strong>,</p>
            <p>Thank you for registering as a farm manager. Please use the following 6-digit One-Time Password (OTP) to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #16a34a; color: #166534; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; border-radius: 8px;">
                    {otp}
                </span>
            </div>
            <p style="color: #ef4444; font-size: 13px;">This OTP is valid for {settings.OTP_EXPIRE_MINUTES} minutes. Do not share this code with anyone.</p>
            <p>After verifying your email, your account will be submitted to the system administrator for final approval.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">Poultry Farm Mortality Management System &copy; 2026</p>
        </div>
        """

        print(f"\n=======================================================")
        print(f"[EMAIL OTP SIMULATION] Destination: {to_email}")
        print(f"[VERIFICATION OTP CODE]: >>> {otp} <<< (Expires in {settings.OTP_EXPIRE_MINUTES}m)")
        print(f"=======================================================\n")

        if not settings.EMAIL_ENABLED or not settings.SMTP_USERNAME:
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            port = int(settings.SMTP_PORT)
            if port == 465:
                # SSL Direct
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, port, timeout=15)
                server.ehlo()
            else:
                # STARTTLS (usually 587)
                server = smtplib.SMTP(settings.SMTP_HOST, port, timeout=15)
                server.ehlo()
                server.starttls()
                server.ehlo()

            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            server.quit()
            logger.info(f"Email OTP sent successfully to {to_email}")
            return True
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication Failed: {e}. For Gmail, make sure to use a 16-character Google App Password (not your account password).")
            return False
        except smtplib.SMTPServerDisconnected as e:
            logger.error(f"SMTP Connection Disconnected: {e}. On AWS EC2, outbound email traffic may be throttled or blocked by default, or credentials/port are rejected.")
            return False
        except Exception as e:
            logger.error(f"Failed to send email OTP: {e}")
            return False

    @staticmethod
    def send_account_approved_email(to_email: str, name: str) -> bool:
        print(f"\n=======================================================")
        print(f"[EMAIL NOTIFICATION] Manager Approved: {to_email} ({name})")
        print(f"=======================================================\n")
        return True

    @staticmethod
    def send_account_rejected_email(to_email: str, name: str, reason: str = "") -> bool:
        print(f"\n=======================================================")
        print(f"[EMAIL NOTIFICATION] Manager Rejected: {to_email} ({name})")
        print(f"=======================================================\n")
        return True
