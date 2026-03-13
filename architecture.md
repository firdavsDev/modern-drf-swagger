# Architecture

### Service Layer Pattern

```
Views → Services → Models
```

**Services:**
- `request_executor.py`: HTTP proxy using `requests` library
- `analytics_service.py`: Request logging and metrics aggregation
- `endpoint_permissions.py`: Permission checking with caching

**Why External HTTP Proxy?**
Uses real HTTP requests (not Django test client) to measure accurate latency and simulate production behavior.
