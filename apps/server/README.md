# nush server

## Setup
```bash
uv pip install -e .
cp .env.example .env
FLASK_APP=app:create_app flask db upgrade
```

## Development
```bash
FLASK_APP=app:create_app flask run --port 5001
```

## Production
Gunicorn entrypoint:
```bash
gunicorn "wsgi:app"
```
