from typing import Any

from flask import jsonify


def ok(data: Any, status: int = 200):
    return jsonify({"data": data, "error": None}), status


def error(code: str, message: str, details: dict | None = None, status: int = 400):
    payload = {"code": code, "message": message, "details": details or {}}
    return jsonify({"data": None, "error": payload}), status
