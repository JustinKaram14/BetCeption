type StatusBuckets = Record<string, number>;

const state = {
  totalRequests: 0,
  activeRequests: 0,
  totalErrors: 0,
  statusCounts: {} as StatusBuckets,
  avgLatencyMs: 0,
};

export function trackRequestStart() {
  state.totalRequests += 1;
  state.activeRequests += 1;
}

export function trackRequestEnd(statusCode: number, durationMs: number) {
  state.activeRequests = Math.max(0, state.activeRequests - 1);
  const bucket = String(Math.floor(statusCode / 100) * 100);
  state.statusCounts[bucket] = (state.statusCounts[bucket] ?? 0) + 1;
  if (statusCode >= 500) state.totalErrors += 1;

  const alpha = 0.1;
  state.avgLatencyMs = state.avgLatencyMs
    ? state.avgLatencyMs * (1 - alpha) + durationMs * alpha
    : durationMs;
}

export function getMetricsSnapshot() {
  return {
    ...state,
    statusCounts: { ...state.statusCounts },
  };
}
