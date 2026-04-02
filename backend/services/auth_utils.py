"""JWT verification utilities — soporta HS256 (legacy) y ES256 (ECC P-256, actual)."""
import os
import logging
from functools import lru_cache
import httpx
from jose import jwt, JWTError, ExpiredSignatureError
from jose.backends import ECKey

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")


@lru_cache(maxsize=1)
def _get_jwks() -> list[dict]:
    """Descarga las claves públicas del endpoint JWKS de Supabase (cacheado en memoria)."""
    url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        resp = httpx.get(url, timeout=10)
        resp.raise_for_status()
        return resp.json().get("keys", [])
    except Exception as exc:
        logger.warning("No se pudo obtener JWKS de Supabase: %s", exc)
        return []


def _verify_with_jwks(token: str) -> dict:
    """Verifica el token contra las claves JWKS (ES256 / RS256)."""
    keys = _get_jwks()
    if not keys:
        raise ValueError("JWKS no disponible")

    # Intentar con cada clave del JWKS
    last_exc: Exception = ValueError("Sin claves")
    for key in keys:
        try:
            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
                options={"verify_aud": True},
            )
            return payload
        except ExpiredSignatureError:
            raise ValueError("Token expirado")
        except JWTError as exc:
            last_exc = exc
            continue
    raise ValueError(f"Token inválido (JWKS): {last_exc}")


def _verify_with_secret(token: str) -> dict:
    """Verifica el token con el shared secret HS256 (legacy)."""
    jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "")
    if not jwt_secret:
        raise ValueError("SUPABASE_JWT_SECRET no configurado")
    try:
        return jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except ExpiredSignatureError:
        raise ValueError("Token expirado")
    except JWTError as exc:
        raise ValueError(f"Token inválido (HS256): {exc}")


def verify_supabase_token(token: str) -> tuple[str, str]:
    """
    Valida un JWT de Supabase.
    Intenta primero con JWKS (ES256), luego con shared secret (HS256 legacy).
    Devuelve (user_id, email). Lanza ValueError si el token es inválido.
    """
    # Detectar algoritmo del header para evitar probar innecesariamente
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "")
    except JWTError:
        raise ValueError("Token malformado")

    if alg in ("ES256", "RS256"):
        payload = _verify_with_jwks(token)
    elif alg == "HS256":
        payload = _verify_with_secret(token)
    else:
        # Intentar ambos
        try:
            payload = _verify_with_jwks(token)
        except ValueError:
            payload = _verify_with_secret(token)

    uid = payload.get("sub", "")
    if not uid:
        raise ValueError("Token sin sub")
    return uid, payload.get("email", "")
