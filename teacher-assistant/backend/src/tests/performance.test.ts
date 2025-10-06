/**
 * Performance and Load Testing Suite
 * Tests system performance, response times, and scalability under load
 */

import request from 'supertest';
import { app } from '../app';
import { performance } from 'perf_hooks';

describe('Performance and Load Testing', () => {
  const testUserId = 'perf-test-user-' + Date.now();
  const performanceMetrics: { [key: string]: number[] } = {};

  const recordMetric = (operation: string, duration: number) => {
    if (!performanceMetrics[operation]) {
      performanceMetrics[operation] = [];
    }
    performanceMetrics[operation].push(duration);
  };

  const getMetricStats = (operation: string) => {
    const times = performanceMetrics[operation] || [];
    if (times.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };

    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p95 = sorted[p95Index];

    return { avg, min, max, p95 };
  };

  afterAll(() => {
    // Log performance summary
    console.log('\n=== Performance Test Summary ===');
    Object.keys(performanceMetrics).forEach(operation => {
      const stats = getMetricStats(operation);
      console.log(`${operation}:`);
      console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
      console.log(`  95th percentile: ${stats.p95.toFixed(2)}ms`);
    });
  });

  describe('API Response Time Performance', () => {
    test('agent discovery should respond quickly', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const response = await request(app)
          .get('/api/langgraph-agents/available')
          .expect(200);

        const endTime = performance.now();
        const duration = endTime - startTime;
        times.push(duration);
        recordMetric('agent_discovery', duration);

        expect(response.body).toHaveProperty('success', true);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Agent discovery average response time: ${avgTime.toFixed(2)}ms`);

      // Should respond within 100ms on average
      expect(avgTime).toBeLessThan(100);
    });

    test('usage tracking should respond quickly', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const response = await request(app)
          .get(`/api/langgraph-agents/image/usage/${testUserId}-${i}`)
          .expect(200);

        const endTime = performance.now();
        const duration = endTime - startTime;
        times.push(duration);
        recordMetric('usage_tracking', duration);

        expect(response.body).toHaveProperty('success', true);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Usage tracking average response time: ${avgTime.toFixed(2)}ms`);

      // Should respond within 200ms on average
      expect(avgTime).toBeLessThan(200);
    });

    test('artifact retrieval should respond quickly', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const response = await request(app)
          .get(`/api/agents/artifacts/${testUserId}-${i}`)
          .expect(200);

        const endTime = performance.now();
        const duration = endTime - startTime;
        times.push(duration);
        recordMetric('artifact_retrieval', duration);

        expect(response.body).toHaveProperty('success', true);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Artifact retrieval average response time: ${avgTime.toFixed(2)}ms`);

      // Should respond within 300ms on average
      expect(avgTime).toBeLessThan(300);
    });

    test('execution status should respond quickly', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const response = await request(app)
          .get(`/api/langgraph-agents/execution/test-exec-${i}/status`);

        const endTime = performance.now();
        const duration = endTime - startTime;
        times.push(duration);
        recordMetric('execution_status', duration);

        // Should respond (either success or error)
        expect([200, 400, 404]).toContain(response.status);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Execution status average response time: ${avgTime.toFixed(2)}ms`);

      // Should respond within 150ms on average
      expect(avgTime).toBeLessThan(150);
    });
  });

  describe('Concurrent Request Performance', () => {
    test('should handle concurrent agent discovery requests', async () => {
      const concurrentRequests = 20;
      const startTime = performance.now();

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .get('/api/langgraph-agents/available')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      recordMetric('concurrent_discovery', totalDuration);

      // All requests should succeed
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });

      console.log(`${concurrentRequests} concurrent requests completed in ${totalDuration.toFixed(2)}ms`);

      // Should complete within 2 seconds
      expect(totalDuration).toBeLessThan(2000);
    });

    test('should handle concurrent usage tracking requests', async () => {
      const concurrentRequests = 10;
      const startTime = performance.now();

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .get(`/api/langgraph-agents/image/usage/${testUserId}-concurrent-${i}`)
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      recordMetric('concurrent_usage', totalDuration);

      // All requests should succeed
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });

      console.log(`${concurrentRequests} concurrent usage requests completed in ${totalDuration.toFixed(2)}ms`);

      // Should complete within 3 seconds
      expect(totalDuration).toBeLessThan(3000);
    });

    test('should handle mixed concurrent requests', async () => {
      const concurrentRequests = 15;
      const startTime = performance.now();

      const promises = [];

      // Mix of different endpoint types
      for (let i = 0; i < concurrentRequests; i++) {
        if (i % 3 === 0) {
          promises.push(
            request(app)
              .get('/api/langgraph-agents/available')
          );
        } else if (i % 3 === 1) {
          promises.push(
            request(app)
              .get(`/api/langgraph-agents/image/usage/${testUserId}-mixed-${i}`)
          );
        } else {
          promises.push(
            request(app)
              .get(`/api/agents/artifacts/${testUserId}-mixed-${i}`)
          );
        }
      }

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      recordMetric('concurrent_mixed', totalDuration);

      // Most requests should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(concurrentRequests * 0.8);

      console.log(`${concurrentRequests} mixed concurrent requests completed in ${totalDuration.toFixed(2)}ms`);

      // Should complete within 4 seconds
      expect(totalDuration).toBeLessThan(4000);
    });
  });

  describe('Memory and Resource Performance', () => {
    test('should handle large parameter payloads efficiently', async () => {
      const largePrompt = 'Educational content prompt. '.repeat(100); // ~2.7KB
      const largeContext = 'Detailed educational context. '.repeat(50); // ~1.35KB

      const startTime = performance.now();

      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: 'large-payload-session',
          params: {
            prompt: largePrompt
          },
          educationalContext: largeContext,
          targetAgeGroup: '10-12 Jahre',
          subject: 'Performance Testing',
          confirmExecution: true
        });

      const endTime = performance.now();
      const duration = endTime - startTime;

      recordMetric('large_payload', duration);

      // Should handle large payloads (success or meaningful error)
      expect([200, 400, 413, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');

      console.log(`Large payload request completed in ${duration.toFixed(2)}ms`);

      // Should not take excessively long
      expect(duration).toBeLessThan(1000);
    });

    test('should handle many small requests efficiently', async () => {
      const numberOfRequests = 50;
      const startTime = performance.now();

      const promises = Array.from({ length: numberOfRequests }, (_, i) =>
        request(app)
          .get(`/api/langgraph-agents/image/usage/${testUserId}-small-${i}`)
      );

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / numberOfRequests;

      recordMetric('many_small_requests', totalDuration);
      recordMetric('avg_small_request', avgDuration);

      // Most should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(numberOfRequests * 0.9);

      console.log(`${numberOfRequests} small requests: ${totalDuration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms average`);

      // Average should be fast
      expect(avgDuration).toBeLessThan(100);
    });
  });

  describe('Stress Testing', () => {
    test('should maintain performance under sustained load', async () => {
      const duration = 5000; // 5 seconds
      const requestInterval = 100; // Every 100ms
      const expectedRequests = Math.floor(duration / requestInterval);

      const startTime = performance.now();
      const endTime = startTime + duration;
      const responses: any[] = [];

      let requestCount = 0;

      while (performance.now() < endTime) {
        const promise = request(app)
          .get('/api/langgraph-agents/available')
          .then(response => {
            responses.push(response);
            return response;
          })
          .catch(error => {
            responses.push({ status: 500, error });
            return error;
          });

        // Don't await here to maintain load
        requestCount++;

        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // Wait for any pending requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      const actualDuration = performance.now() - startTime;
      recordMetric('stress_test_duration', actualDuration);
      recordMetric('stress_test_requests', requestCount);

      const successfulResponses = responses.filter(r => r.status === 200);
      const successRate = successfulResponses.length / responses.length;

      console.log(`Stress test: ${requestCount} requests over ${actualDuration.toFixed(0)}ms`);
      console.log(`Success rate: ${(successRate * 100).toFixed(1)}%`);

      // Should maintain reasonable success rate under load
      expect(successRate).toBeGreaterThan(0.8);
      expect(requestCount).toBeGreaterThan(expectedRequests * 0.8);
    });

    test('should recover from peak load scenarios', async () => {
      // Burst of requests followed by normal load
      const burstSize = 30;
      const normalSize = 10;

      console.log('Generating peak load burst...');
      const burstStart = performance.now();

      // Peak load burst
      const burstPromises = Array.from({ length: burstSize }, (_, i) =>
        request(app)
          .get('/api/langgraph-agents/available')
      );

      const burstResponses = await Promise.all(burstPromises);
      const burstEnd = performance.now();
      const burstDuration = burstEnd - burstStart;

      recordMetric('peak_load_burst', burstDuration);

      // Wait for system to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Testing normal load after peak...');
      const normalStart = performance.now();

      // Normal load after peak
      const normalPromises = Array.from({ length: normalSize }, (_, i) =>
        request(app)
          .get('/api/langgraph-agents/available')
          .expect(200)
      );

      const normalResponses = await Promise.all(normalPromises);
      const normalEnd = performance.now();
      const normalDuration = normalEnd - normalStart;

      recordMetric('post_peak_normal', normalDuration);

      // Burst should complete (some may fail under load)
      const burstSuccessRate = burstResponses.filter(r => r.status === 200).length / burstSize;

      // Normal load after peak should succeed
      expect(normalResponses).toHaveLength(normalSize);

      console.log(`Peak load burst: ${burstDuration.toFixed(2)}ms, success rate: ${(burstSuccessRate * 100).toFixed(1)}%`);
      console.log(`Normal load recovery: ${normalDuration.toFixed(2)}ms`);

      // System should recover and handle normal load well
      expect(burstSuccessRate).toBeGreaterThan(0.6);
    });
  });

  describe('Database Performance', () => {
    test('should handle usage tracking queries efficiently', async () => {
      const users = Array.from({ length: 20 }, (_, i) => `perf-db-user-${i}-${Date.now()}`);

      const startTime = performance.now();

      // Create usage data for multiple users
      const usagePromises = users.map(userId =>
        request(app)
          .get(`/api/langgraph-agents/image/usage/${userId}`)
          .expect(200)
      );

      const responses = await Promise.all(usagePromises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / users.length;

      recordMetric('db_usage_queries', totalDuration);
      recordMetric('avg_db_usage_query', avgDuration);

      // All queries should succeed
      expect(responses).toHaveLength(users.length);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });

      console.log(`Database usage queries: ${totalDuration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms average`);

      // Database queries should be fast
      expect(avgDuration).toBeLessThan(50);
    });

    test('should handle artifact queries efficiently', async () => {
      const users = Array.from({ length: 10 }, (_, i) => `perf-artifact-user-${i}-${Date.now()}`);

      const startTime = performance.now();

      // Query artifacts for multiple users
      const artifactPromises = users.map(userId =>
        request(app)
          .get(`/api/agents/artifacts/${userId}`)
          .query({ limit: 10 })
          .expect(200)
      );

      const responses = await Promise.all(artifactPromises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / users.length;

      recordMetric('db_artifact_queries', totalDuration);
      recordMetric('avg_db_artifact_query', avgDuration);

      // All queries should succeed
      expect(responses).toHaveLength(users.length);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      console.log(`Database artifact queries: ${totalDuration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms average`);

      // Artifact queries should be reasonably fast
      expect(avgDuration).toBeLessThan(100);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance SLA requirements', () => {
      const requirements = {
        agent_discovery: { max_avg: 100, max_p95: 200 },
        usage_tracking: { max_avg: 200, max_p95: 400 },
        artifact_retrieval: { max_avg: 300, max_p95: 600 },
        execution_status: { max_avg: 150, max_p95: 300 }
      };

      Object.keys(requirements).forEach(operation => {
        const stats = getMetricStats(operation);
        const req = requirements[operation as keyof typeof requirements];

        if (stats.avg > 0) { // Only check if we have data
          console.log(`${operation}: avg ${stats.avg.toFixed(2)}ms (req: <${req.max_avg}ms), p95 ${stats.p95.toFixed(2)}ms (req: <${req.max_p95}ms)`);

          expect(stats.avg).toBeLessThan(req.max_avg);
          expect(stats.p95).toBeLessThan(req.max_p95);
        }
      });
    });

    test('should provide performance baseline for monitoring', () => {
      console.log('\n=== Performance Baseline ===');

      const baseline = {
        agent_discovery_avg: getMetricStats('agent_discovery').avg,
        usage_tracking_avg: getMetricStats('usage_tracking').avg,
        artifact_retrieval_avg: getMetricStats('artifact_retrieval').avg,
        concurrent_request_time: getMetricStats('concurrent_discovery').avg,
        db_query_avg: getMetricStats('avg_db_usage_query').avg
      };

      Object.entries(baseline).forEach(([metric, value]) => {
        if (value > 0) {
          console.log(`${metric}: ${value.toFixed(2)}ms`);
        }
      });

      // Performance baseline should be reasonable
      expect(baseline.agent_discovery_avg).toBeLessThan(200);
      if (baseline.usage_tracking_avg > 0) {
        expect(baseline.usage_tracking_avg).toBeLessThan(400);
      }
    });
  });
});