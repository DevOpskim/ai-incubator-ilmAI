from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    password: str
    display_name: str | None = None
    preferred_language: str = "en"


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str


class GoogleAuth(BaseModel):
    id_token: str
