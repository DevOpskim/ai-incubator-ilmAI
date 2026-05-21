import random
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from uuid import uuid4

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.tables import RegistrationOTP

settings = get_settings()


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def send_otp_email(to_email: str, otp: str) -> None:
    if not settings.smtp_host:
        print(f"[email] SMTP not configured. OTP for {to_email}: {otp}")
        return

    msg = MIMEText(f"Your Ilm Agent verification code is: {otp}\n\nThis code expires in 10 minutes.")
    msg["Subject"] = "Your Ilm Agent Verification Code"
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())


def create_and_send_otp(email: str, db: Session) -> None:
    otp = generate_otp()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp_record = RegistrationOTP(
        id=uuid4(),
        email=email,
        otp_code=otp,
        expires_at=expiry,
    )
    db.add(otp_record)
    db.commit()

    send_otp_email(email, otp)


def verify_otp(email: str, otp: str, db: Session) -> bool:
    record = (
        db.query(RegistrationOTP)
        .filter(
            RegistrationOTP.email == email,
            RegistrationOTP.otp_code == otp,
            RegistrationOTP.used == False,
            RegistrationOTP.expires_at > datetime.now(timezone.utc),
        )
        .order_by(RegistrationOTP.created_at.desc())
        .first()
    )
    if not record:
        return False

    record.used = True
    db.commit()
    return True
