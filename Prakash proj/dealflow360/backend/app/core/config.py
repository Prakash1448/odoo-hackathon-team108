from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "dealflow360"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    
    JWT_SECRET_KEY: str = "dealflow360-secure-jwt-secret-key-development-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    PORT: int = 8000

    @property
    def DATABASE_URL(self) -> str:
        # standard PyMySQL connection string
        password_part = f":{self.DB_PASSWORD}" if self.DB_PASSWORD else ""
        return f"mysql+pymysql://{self.DB_USER}{password_part}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        extra = "allow"

settings = Settings()
