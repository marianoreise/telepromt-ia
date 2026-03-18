"""Tests for STT WebSocket endpoint and AI service utilities."""
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from services.ai_service import is_question


# ── is_question heuristic ─────────────────────────────────────────────────────

class TestIsQuestion:
    def test_question_mark(self):
        assert is_question("¿Cuántos años de experiencia tenés?")

    def test_english_question_mark(self):
        assert is_question("What is your greatest strength?")

    def test_spanish_question_word(self):
        assert is_question("Cómo manejas el trabajo bajo presión")

    def test_english_question_word(self):
        assert is_question("How do you handle tight deadlines")

    def test_tell_me(self):
        assert is_question("Tell me about yourself")

    def test_explain(self):
        assert is_question("Explain your experience with Python")

    def test_not_question_statement(self):
        assert not is_question("Tengo cinco años de experiencia")

    def test_empty_string(self):
        assert not is_question("")

    def test_whitespace_only(self):
        assert not is_question("   ")

    def test_can_you(self):
        assert is_question("Can you walk me through your last project")

    def test_describe(self):
        assert is_question("Describe a challenging situation you faced")


# ── WebSocket auth ────────────────────────────────────────────────────────────

class TestTokenVerification:
    def test_valid_token(self):
        import jwt
        from services.auth_utils import verify_supabase_token

        secret = "test-secret-key"
        token = jwt.encode(
            {"sub": "user-123", "email": "test@test.com", "aud": "authenticated"},
            secret,
            algorithm="HS256",
        )

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": secret}):
            uid, email = verify_supabase_token(token)
        assert uid == "user-123"
        assert email == "test@test.com"

    def test_expired_token(self):
        import jwt
        from datetime import datetime, timezone
        from services.auth_utils import verify_supabase_token

        secret = "test-secret-key"
        token = jwt.encode(
            {
                "sub": "user-123",
                "aud": "authenticated",
                "exp": datetime(2000, 1, 1, tzinfo=timezone.utc),
            },
            secret,
            algorithm="HS256",
        )

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": secret}):
            with pytest.raises(ValueError, match="expirado"):
                verify_supabase_token(token)

    def test_invalid_token(self):
        from services.auth_utils import verify_supabase_token
        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": "secret"}):
            with pytest.raises(ValueError):
                verify_supabase_token("not.a.token")


# ── Text chunking ─────────────────────────────────────────────────────────────

class TestTextChunking:
    def test_chunk_basic(self):
        from services.text_utils import chunk_text
        text = "a" * 2000
        chunks = chunk_text(text, size=800, overlap=100)
        assert len(chunks) > 1
        # Each chunk ≤ size
        assert all(len(c) <= 800 for c in chunks)

    def test_chunk_short_text(self):
        from services.text_utils import chunk_text
        text = "Short text."
        chunks = chunk_text(text)
        assert len(chunks) == 1
        assert chunks[0] == "Short text."

    def test_chunk_empty(self):
        from services.text_utils import chunk_text
        chunks = chunk_text("")
        assert chunks == []
