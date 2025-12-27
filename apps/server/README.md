# nush server

## Setup
```bash
uv pip install -e .
cp .env.example .env
FLASK_APP=app:create_app flask db upgrade
```

## Email notifications
Set Mailgun env vars in `.env` to enable emails. Internal account notifications default to `nush@sotodev.com`.

## Development
```bash
FLASK_APP=app:create_app flask run --host 0.0.0.0 --port 5001
```

## Production
Gunicorn entrypoint:
```bash
gunicorn "wsgi:app"
```
