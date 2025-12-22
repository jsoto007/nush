# API

Base URL
- Local: `http://localhost:5000`
- Versioned prefix: `/api/v1`

## Endpoints

### GET /health
Returns a basic service status.

Response
```json
{ "status": "ok" }
```

### GET /api/v1/health
Versioned health endpoint.

Response
```json
{ "status": "ok" }
```

## Error format (placeholder)
```json
{ "error": "message", "code": "ERROR_CODE" }
```

## Auth (placeholder)
No authentication is required yet. Add auth headers here when implemented.
