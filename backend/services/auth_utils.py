"""JWT verification utilities (no external service deps)."""
import os
import jwt


def verify_supabase_token(token: str) -> tuple[str, str]:
    """
    Validate a Supabase JWT.
    Returns (user_id, email). Raises ValueError on invalid/expired token.
    """
    jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "")
    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        uid = payload.get("sub", "")
        if not uid:
            raise ValueError("Token sin sub")
        return uid, payload.get("email", "")
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expirado")
    except jwt.InvalidTokenError as exc:
        raise ValueError(f"Token inválido: {exc}")
