type MetricEntry = {
  count: number;
  updatedAt: string;
};

const metrics = new Map<string, MetricEntry>();

export function incrementMetric(name: string) {
  const current = metrics.get(name);
  metrics.set(name, {
    count: (current?.count ?? 0) + 1,
    updatedAt: new Date().toISOString()
  });
}

export function getMetricsSnapshot() {
  return Array.from(metrics.entries()).reduce<Record<string, MetricEntry>>((accumulator, [key, value]) => {
    accumulator[key] = value;
    return accumulator;
  }, {});
}
