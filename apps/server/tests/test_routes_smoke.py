import os
import re
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402


UUID_SAMPLE = "00000000-0000-0000-0000-000000000000"


class FakeQuery:
    def filter(self, *args, **kwargs):
        return self

    def filter_by(self, *args, **kwargs):
        return self

    def join(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def offset(self, *args, **kwargs):
        return self

    def union(self, *args, **kwargs):
        return self

    def all(self):
        return []

    def first(self):
        return None

    def count(self):
        return 0


class FakeSession:
    def query(self, *args, **kwargs):
        return FakeQuery()

    def get(self, *args, **kwargs):
        return None

    def add(self, *args, **kwargs):
        return None

    def add_all(self, *args, **kwargs):
        return None

    def delete(self, *args, **kwargs):
        return None

    def commit(self, *args, **kwargs):
        return None

    def rollback(self, *args, **kwargs):
        return None

    def flush(self, *args, **kwargs):
        return None

    def remove(self, *args, **kwargs):
        return None


def build_url(rule):
    def replace(match):
        token = match.group(1)
        if ":" in token:
            converter, _name = token.split(":", 1)
        else:
            converter = "string"
        converter = converter.lower()
        if "uuid" in converter:
            return UUID_SAMPLE
        if "int" in converter:
            return "1"
        if "path" in converter:
            return "test/path"
        return "test"

    return re.sub(r"<([^>]+)>", replace, rule.rule)


class RouteSmokeTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.testing = True
        self.client = self.app.test_client()
        self._orig_session = db.session
        db.session = FakeSession()
        self.addCleanup(self._restore_session)

    def _restore_session(self):
        db.session = self._orig_session

    def test_all_routes_respond(self):
        for rule in self.app.url_map.iter_rules():
            if rule.endpoint == "static":
                continue
            url = build_url(rule)
            for method in sorted(rule.methods - {"HEAD", "OPTIONS"}):
                kwargs = {"path": url, "method": method}
                if method in {"POST", "PUT", "PATCH"}:
                    kwargs["json"] = {}
                response = self.client.open(**kwargs)
                self.assertLess(
                    response.status_code,
                    500,
                    f"{method} {url} returned {response.status_code}",
                )

