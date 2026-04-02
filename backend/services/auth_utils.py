"""JWT verification utilities — soporta HS256 (legacy) y ES256 (ECC P-256, actual)."""
import os
import logging
import httpx
from jose import jwt, JWTError, ExpiredSignatureError

logger = logging.getLogger(__name__)

_jwks_cache: list[dict] | None = None


def _get_jwks() -> list[dict]:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    if not supabase_url:
        logger.warning("SUPABASE_URL no configurado — JWKS no disponible")
        return []
    url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        resp = httpx.get(url, timeout=10)
        resp.raise_for_status()
        keys = resp.json().get("keys", [])
        _jwks_cache = keys
        logger.info("JWKS cargado: %d claves", len(keys))
        return keys
    except Exception as exc:
        logger.warning("No se pudo obtener JWKS: %s", exc)
        return []


def verify_supabase_token(token: str) -> tuple[str, str]:
    """
    Valida un JWT de Supabase.
    Soporta ES256 (ECC P-256, actual) y HS256 (legacy shared secret).
    Devuelve (user_id, email). Lanza ValueError si el token es inválido.
    """
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise ValueError(f"Token malformado: {exc}")

    alg = header.get("alg", "")
    logger.debug("JWT alg=%s", alg)

    payload: dict | None = None

    if alg in ("ES256", "RS256"):
        keys = _get_jwks()
        last_exc: Exception = ValueError("Sin claves JWKS")
        for key in keys:
            try:
                payload = jwt.decode(
                    token,
                    key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                )
                break
            except ExpiredSignatureError:
                raise ValueError("Token expirado")
            except JWTError as exc:
                last_exc = exc
        if payload is None:
            raise ValueError(f"Token inválido: {last_exc}")

    elif alg == "HS256":
        jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "")
        if not jwt_secret:
            raise ValueError("SUPABASE_JWT_SECRET no configurado")
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except ExpiredSignatureError:
            raise ValueError("Token expirado")
        except JWTError as exc:
            raise ValueError(f"Token inválido: {exc}")

    else:
        # Algoritmo desconocido — intentar ambas estrategias
        try:
            keys = _get_jwks()
            last_exc = ValueError("Sin claves")
            for key in keys:
                try:
                    payload = jwt.decode(
                        token, key,
                        algorithms=["ES256", "RS256", "HS256"],
                        audience="authenticated",
                    )
                    break
                except ExpiredSignatureError:
                    raise ValueError("Token expirado")
                except JWTError as exc:
                    last_exc = exc
        except ValueError:
            raise

        if payload is None:
            jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "")
            if jwt_secret:
                try:
                    payload = jwt.decode(
                        token, jwt_secret,
                        algorithms=["HS256"],
                        audience="authenticated",
                    )
                except JWTError as exc:
                    raise ValueError(f"Token inválido: {exc}")
            else:
                raise ValueError(f"Token inválido (alg={alg})")

    if payload is None:
        raise ValueError("Token inválido")

    uid = payload.get("sub", "")
    if not uid:
        raise ValueError("Token sin sub")
    return uid, payload.get("email", "")
