from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.tables import User
from app.schemas.auth import GoogleAuth, Token, UserCreate, UserLogin
from app.services.email import create_and_send_otp, verify_otp

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: str


class VerifyRegistrationRequest(BaseModel):
    email: str
    otp: str
    password: str
    display_name: str | None = None
    preferred_language: str = "en"


@router.post("/register", status_code=status.HTTP_200_OK)
async def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Send OTP to email for registration."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    create_and_send_otp(body.email, db)
    return {"message": "OTP sent to email"}


@router.post("/verify-registration", status_code=status.HTTP_201_CREATED)
async def verify_registration(
    request: Request,
    body: VerifyRegistrationRequest,
    db: Session = Depends(get_db),
) -> Token:
    """Verify OTP and create account."""
    if not verify_otp(body.email, body.otp, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = get_password_hash(body.password)
    new_user = User(
        email=body.email,
        hashed_password=hashed_password,
        display_name=body.display_name,
        preferred_language=body.preferred_language,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": str(new_user.id), "email": new_user.email}
    )

    response = Response()
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        max_age=60 * 60 * 24,
    )

    return Token(access_token=access_token)


@router.post("/login")
async def login(
    request: Request,
    user_data: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """Log in an existing user."""
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    # Set token in cookie for browser clients
    response = Response()
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        max_age=60 * 60 * 24,  # 24 hours
    )

    return Token(access_token=access_token)


@router.post("/google")
async def google_login(
    request: Request,
    google_data: GoogleAuth,
    db: Session = Depends(get_db),
) -> Token:
    """Log in with Google OAuth."""
    # In production, verify the Google ID token with Google's API
    # For MVP, we'll use a placeholder verification
    # TODO: Implement proper Google ID token verification
    # google.verify_id_token(google_data.id_token, settings.GOOGLE_CLIENT_ID)

    # For now, create a user from the email in the token
    # In real implementation, decode the JWT and extract email
    # Placeholder email - in production, extract from verified token
    email = "user@example.com"

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create new user
        new_user = User(
            email=email,
            display_name=email.split("@")[0],
            preferred_language="en",
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    # Set token in cookie for browser clients
    response = Response()
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        max_age=60 * 60 * 24,  # 24 hours
    )

    return Token(access_token=access_token)


@router.post("/logout")
async def logout(request: Request) -> dict[str, str]:
    """Log out the current user."""
    response = Response()
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}
