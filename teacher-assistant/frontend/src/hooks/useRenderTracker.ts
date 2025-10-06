import { useEffect, useRef } from 'react';

/**
 * Hook to track renders and detect infinite loops
 * For debugging render issues
 */
export const useRenderTracker = (componentName: string, props?: any) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const propsHistory = useRef<any[]>([]);

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Track prop changes
    if (props) {
      propsHistory.current.push({
        count: renderCount.current,
        timestamp: now,
        props: JSON.stringify(props, null, 2)
      });

      // Keep only last 10 renders
      if (propsHistory.current.length > 10) {
        propsHistory.current.shift();
      }
    }

    console.log(`🔄 [${componentName}] Render #${renderCount.current} (${timeSinceLastRender}ms since last)`);

    // Detect infinite loop - more than 20 renders in 5 seconds
    if (renderCount.current > 20 && timeSinceLastRender < 250) {
      console.error(`⚠️ INFINITE LOOP DETECTED in ${componentName}!`);
      console.error('Props history:', propsHistory.current);

      // Analyze what's changing
      if (propsHistory.current.length >= 2) {
        const lastTwo = propsHistory.current.slice(-2);
        console.error('Last two prop states:', lastTwo);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    propsHistory: propsHistory.current
  };
};