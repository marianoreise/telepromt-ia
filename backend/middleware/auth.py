import os
import logging
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from dataclasses import dataclass

logger = logging.getLogger(__name__)
security = HTTPBearer()


@dataclass
class UserContext:
    id: str
    email: str


async def get_current_user(credentials=Depends(security)) -> UserContext:
    try:
        jwt_secret = os.environ["SUPABASE_JWT_SECRET"]
        payload = jwt.decode(
            credentials.credentials,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Token invalido")
        return UserContext(id=uid, email=payload.get("email", ""))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")
    except KeyError:
        logger.error("SUPABASE_JWT_SECRET no configurado")
        raise HTTPException(status_code=500, detail="Error de configuracion del servidor")
