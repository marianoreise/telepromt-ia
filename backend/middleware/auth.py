import os
import logging
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from dataclasses import dataclass
from supabase import create_client

logger = logging.getLogger(__name__)
security = HTTPBearer()


@dataclass
class UserContext:
    id: str
    email: str


async def get_current_user(credentials=Depends(security)) -> UserContext:
    try:
        client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_ANON_KEY"],
        )
        response = client.auth.get_user(credentials.credentials)
        user = response.user
        if not user:
            raise HTTPException(status_code=401, detail="Token invalido")
        return UserContext(id=str(user.id), email=user.email or "")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error validando token: %s", e)
        raise HTTPException(status_code=401, detail="Token invalido")
