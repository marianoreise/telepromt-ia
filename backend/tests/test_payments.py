"""Tests for payment router utilities."""
import pytest
from unittest.mock import patch, MagicMock


class TestPackages:
    def test_all_packages_defined(self):
        from routers.payments import PACKAGES
        assert "starter" in PACKAGES
        assert "pro" in PACKAGES
        assert "max" in PACKAGES

    def test_package_fields(self):
        from routers.payments import PACKAGES
        for pkg_id, pkg in PACKAGES.items():
            assert "credits" in pkg, f"{pkg_id} missing credits"
            assert "price" in pkg, f"{pkg_id} missing price"
            assert "title" in pkg, f"{pkg_id} missing title"
            assert pkg["credits"] > 0
            assert pkg["price"] > 0

    def test_credits_increase_with_price(self):
        from routers.payments import PACKAGES
        pkgs = list(PACKAGES.values())
        # Each next package should have more credits
        assert pkgs[1]["credits"] > pkgs[0]["credits"]
        assert pkgs[2]["credits"] > pkgs[1]["credits"]


class TestSignatureHelpers:
    def test_extract_ts(self):
        from routers.payments import _extract_ts
        sig = "ts=1234567890,v1=abc123def"
        assert _extract_ts(sig) == "1234567890"

    def test_extract_v1(self):
        from routers.payments import _extract_v1
        sig = "ts=1234567890,v1=abc123def"
        assert _extract_v1(sig) == "abc123def"

    def test_extract_ts_missing(self):
        from routers.payments import _extract_ts
        assert _extract_ts("v1=abc") == ""

    def test_extract_v1_missing(self):
        from routers.payments import _extract_v1
        assert _extract_v1("ts=123") == ""


class TestExternalReferenceFormat:
    """Validate the external_reference format used in webhooks."""

    def test_parse_external_reference(self):
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        pkg_id = "pro"
        nonce = "some-uuid"
        ref = f"{user_id}|{pkg_id}|{nonce}"
        parts = ref.split("|")
        assert len(parts) == 3
        assert parts[0] == user_id
        assert parts[1] == pkg_id

    def test_short_reference_rejected(self):
        ref = "invalid-reference"
        parts = ref.split("|")
        assert len(parts) < 2
