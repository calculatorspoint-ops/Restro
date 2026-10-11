/**
 * Performance Monitor & Diagnostics Engine for Cloud Firestore & React
 * Tracks:
 * - Query and Write execution latencies
 * - Read/Write/Delete/Batch counts
 * - Cache hit ratios & in-flight deduplications
 * - Slow query detection (> 800ms)
 * - Live diagnostic event subscription for Developer HUD
 */

export interface OperationMetric {
  id: string;
  type: 'read' | 'write' | 'delete' | 'batch' | 'cache_hit';
  collection: string;
  durationMs: number;
  itemCount?: number;
  timestamp: string;
  isSlow: boolean;
}

export interface PerformanceSummary {
  reads: number;
  writes: number;
  deletes: number;
  batches: number;
  cacheHits: number;
  deduplicatedQueries: number;
  totalOperations: number;
  cacheHitRatioPercent: number;
  averageLatencyMs: number;
  slowQueryCount: number;
  recentMetrics: OperationMetric[];
}

type Subscriber = (summary: PerformanceSummary) => void;

class PerformanceMonitor {
  private metrics: OperationMetric[] = [];
  private readCount = 0;
  private writeCount = 0;
  private deleteCount = 0;
  private batchCount = 0;
  private cacheHitCount = 0;
  private deduplicatedCount = 0;
  private slowQueryThresholdMs = 800;
  private subscribers = new Set<Subscriber>();

  private notify() {
    if (this.subscribers.size === 0) return;
    const summary = this.getSummary();
    this.subscribers.forEach((sub) => {
      try {
        sub(summary);
      } catch (err) {
        console.error('Perf subscriber error:', err);
      }
    });
  }

  public subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getSummary());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public trackRead(collection: string, itemCount: number, durationMs: number, fromCache = false) {
    if (fromCache) {
      this.cacheHitCount++;
    } else {
      this.readCount += itemCount || 1;
    }

    const isSlow = !fromCache && durationMs > this.slowQueryThresholdMs;
    const metric: OperationMetric = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: fromCache ? 'cache_hit' : 'read',
      collection,
      durationMs: Math.round(durationMs),
      itemCount,
      timestamp: new Date().toISOString(),
      isSlow
    };

    this.metrics.push(metric);
    if (this.metrics.length > 250) this.metrics.shift();

    if (isSlow) {
      console.warn(`[PerfWarning] Slow query on collection '${collection}': ${Math.round(durationMs)}ms (${itemCount} docs)`);
    }

    this.notify();
  }

  public trackWrite(collection: string, docId: string, durationMs: number, isBatch = false) {
    if (isBatch) {
      this.batchCount++;
    } else {
      this.writeCount++;
    }

    const isSlow = durationMs > this.slowQueryThresholdMs;
    const metric: OperationMetric = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: isBatch ? 'batch' : 'write',
      collection,
      durationMs: Math.round(durationMs),
      timestamp: new Date().toISOString(),
      isSlow
    };

    this.metrics.push(metric);
    if (this.metrics.length > 250) this.metrics.shift();

    if (isSlow) {
      console.warn(`[PerfWarning] Slow write to '${collection}/${docId}': ${Math.round(durationMs)}ms`);
    }

    this.notify();
  }

  public trackDelete(collection: string, docId: string, durationMs: number) {
    this.deleteCount++;
    const isSlow = durationMs > this.slowQueryThresholdMs;
    const metric: OperationMetric = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'delete',
      collection,
      durationMs: Math.round(durationMs),
      timestamp: new Date().toISOString(),
      isSlow
    };

    this.metrics.push(metric);
    if (this.metrics.length > 250) this.metrics.shift();
    this.notify();
  }

  public trackDeduplication(collection: string) {
    this.deduplicatedCount++;
    this.notify();
  }

  public getSummary(): PerformanceSummary {
    const totalOps = this.readCount + this.writeCount + this.deleteCount + this.batchCount + this.cacheHitCount;
    const recent = this.metrics.slice(-30);
    const nonCacheMetrics = recent.filter((m) => m.type !== 'cache_hit');
    const avgDuration = nonCacheMetrics.length > 0
      ? Math.round(nonCacheMetrics.reduce((acc, m) => acc + m.durationMs, 0) / nonCacheMetrics.length)
      : 0;

    const totalReadsAndHits = this.readCount + this.cacheHitCount;
    const cacheRatio = totalReadsAndHits > 0
      ? Math.round((this.cacheHitCount / totalReadsAndHits) * 100)
      : 0;

    return {
      reads: this.readCount,
      writes: this.writeCount,
      deletes: this.deleteCount,
      batches: this.batchCount,
      cacheHits: this.cacheHitCount,
      deduplicatedQueries: this.deduplicatedCount,
      totalOperations: totalOps,
      cacheHitRatioPercent: cacheRatio,
      averageLatencyMs: avgDuration,
      slowQueryCount: this.metrics.filter((m) => m.isSlow).length,
      recentMetrics: [...this.metrics].reverse().slice(0, 30)
    };
  }

  public reset() {
    this.metrics = [];
    this.readCount = 0;
    this.writeCount = 0;
    this.deleteCount = 0;
    this.batchCount = 0;
    this.cacheHitCount = 0;
    this.deduplicatedCount = 0;
    this.notify();
  }
}

export const perfMonitor = new PerformanceMonitor();
