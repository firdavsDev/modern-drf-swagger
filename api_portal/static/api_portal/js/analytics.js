/**
 * Analytics Dashboard Controller
 * Handles fetching and displaying analytics data
 */

class AnalyticsController {
  constructor() {
    this.dateRangeSelector = document.getElementById("date-range-selector");
    this.chart = null;

    this.init();
  }

  init() {
    // Setup date range selector
    this.dateRangeSelector.addEventListener("change", () => {
      this.loadAnalytics();
    });

    // Initial load
    this.loadAnalytics();
  }

  async loadAnalytics() {
    const days = this.dateRangeSelector.value;

    try {
      const response = await fetch(
        `/portal/analytics/?days=${days}&format=json`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.renderAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      showToast("Failed to load analytics data", "error");
    }
  }

  renderAnalytics(data) {
    const summary = data.summary || {};

    // Update summary cards
    document.getElementById("total-requests").textContent = this.formatNumber(
      summary.total_requests || 0,
    );
    document.getElementById("error-count").textContent = this.formatNumber(
      summary.error_count || 0,
    );
    document.getElementById("error-rate").textContent =
      `${summary.error_rate || 0}%`;
    document.getElementById("avg-latency").textContent =
      `${summary.avg_latency || 0} ms`;

    // Render top endpoints table
    this.renderTopEndpoints(data.top_endpoints || []);

    // Render requests by user
    this.renderRequestsByUser(data.requests_by_user || []);

    // Render timeline chart
    this.renderTimelineChart(data.daily_stats || []);
  }

  renderTopEndpoints(endpoints) {
    const container = document.getElementById("top-endpoints");

    if (endpoints.length === 0) {
      container.innerHTML = `
                <p class="text-center text-gray-400 py-8">No data available</p>
            `;
      return;
    }

    let html = `
            <table class="w-full text-sm">
                <thead class="border-b border-gray-700">
                    <tr class="text-left">
                        <th class="pb-2 text-gray-400">Endpoint</th>
                        <th class="pb-2 text-gray-400 text-right">Requests</th>
                        <th class="pb-2 text-gray-400 text-right">Avg Latency</th>
                    </tr>
                </thead>
                <tbody>
        `;

    endpoints.forEach((ep, index) => {
      const latencyClass = this.getLatencyClass(ep.avg_latency || 0);
      html += `
                <tr class="border-b border-gray-700 last:border-b-0">
                    <td class="py-3 font-mono text-xs">${this.escapeHtml(ep.endpoint || "")}</td>
                    <td class="py-3 text-right text-blue-400 font-semibold">${this.formatNumber(ep.total_requests || 0)}</td>
                    <td class="py-3 text-right ${latencyClass} font-semibold">${(ep.avg_latency || 0).toFixed(2)} ms</td>
                </tr>
            `;
    });

    html += `
                </tbody>
            </table>
        `;

    container.innerHTML = html;
  }

  renderRequestsByUser(users) {
    const container = document.getElementById("requests-by-user");

    if (users.length === 0) {
      container.innerHTML = `
                <p class="text-center text-gray-400 py-8">No data available</p>
            `;
      return;
    }

    let html = `
            <table class="w-full text-sm">
                <thead class="border-b border-gray-700">
                    <tr class="text-left">
                        <th class="pb-2 text-gray-400">User</th>
                        <th class="pb-2 text-gray-400 text-right">Requests</th>
                    </tr>
                </thead>
                <tbody>
        `;

    users.forEach((user) => {
      html += `
                <tr class="border-b border-gray-700 last:border-b-0">
                    <td class="py-3">${this.escapeHtml(user.user__username || "Unknown")}</td>
                    <td class="py-3 text-right text-blue-400 font-semibold">${this.formatNumber(user.count || 0)}</td>
                </tr>
            `;
    });

    html += `
                </tbody>
            </table>
        `;

    container.innerHTML = html;
  }

  renderTimelineChart(dailyStats) {
    const canvas = document.getElementById("timeline-chart");
    const ctx = canvas.getContext("2d");

    // Destroy previous chart if exists
    if (this.chart) {
      this.chart.destroy();
    }

    if (dailyStats.length === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.font = "14px sans-serif";
      ctx.fillText("No data available", canvas.width / 2, canvas.height / 2);
      return;
    }

    const labels = dailyStats.map((stat) => stat.date);
    const requestData = dailyStats.map((stat) => stat.total_requests || 0);
    const errorData = dailyStats.map((stat) => stat.total_errors || 0);

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Requests",
            data: requestData,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Errors",
            data: errorData,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#f3f4f6",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#9ca3af",
            },
            grid: {
              color: "#374151",
            },
          },
          x: {
            ticks: {
              color: "#9ca3af",
            },
            grid: {
              color: "#374151",
            },
          },
        },
      },
    });
  }

  getLatencyClass(latency) {
    if (latency < 200) return "latency-fast";
    if (latency < 1000) return "latency-medium";
    return "latency-slow";
  }

  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new AnalyticsController();
});
