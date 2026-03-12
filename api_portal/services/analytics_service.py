import json

from django.utils import timezone

from ..models import UsageMetric


class AnalyticsService:
    @staticmethod
    def log_request(user, endpoint, method, payload, status, size, latency):
        from ..conf import get_portal_setting
        from ..models import RequestLog

        # Save exact log entry
        RequestLog.objects.create(
            user=user if user and user.is_authenticated else None,
            endpoint=endpoint,
            method=method,
            request_payload=json.dumps(payload) if payload else "",
            response_status=status,
            response_size=size,
            latency=latency,
        )

        # Auto-cleanup old logs if user exceeds HISTORY_LIMIT
        if user and user.is_authenticated:
            history_limit = get_portal_setting("HISTORY_LIMIT", 100)
            user_log_count = RequestLog.objects.filter(user=user).count()

            if user_log_count > history_limit:
                # Delete oldest logs, keeping only (HISTORY_LIMIT - 1) most recent
                logs_to_keep = RequestLog.objects.filter(user=user).order_by(
                    "-created_at"
                )[: history_limit - 1]
                keep_ids = list(logs_to_keep.values_list("id", flat=True))
                RequestLog.objects.filter(user=user).exclude(id__in=keep_ids).delete()

        # Update Daily Aggregations
        today = timezone.now().date()
        metric, created = UsageMetric.objects.get_or_create(
            endpoint=endpoint,
            date=today,
            defaults={"request_count": 0, "error_count": 0, "average_latency": 0.0},
        )

        # Recalculate rolling average latency
        total_latency = metric.average_latency * metric.request_count + latency
        metric.request_count += 1
        metric.average_latency = total_latency / metric.request_count

        if status >= 400:
            metric.error_count += 1

        metric.save()
