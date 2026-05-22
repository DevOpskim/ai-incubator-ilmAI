import random
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.tables import RegistrationOTP

settings = get_settings()


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def send_otp_email(to_email: str, otp: str) -> None:
    if not settings.resend_api_key:
        print(f"[email] Resend not configured. OTP for {to_email}: {otp}")
        return

    resp = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": settings.smtp_from_email or "onboarding@resend.dev",
            "to": [to_email],
            "subject": "Your Ilm Agent Verification Code",
            "html": f"<p>Your Ilm Agent verification code is: <strong>{otp}</strong></p><p>This code expires in 10 minutes.</p>",
        },
        timeout=15,
    )
    if resp.is_error:
        print(f"[email] Failed to send OTP to {to_email}: {resp.text}")
        raise RuntimeError(f"Resend API error: {resp.text}")


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
