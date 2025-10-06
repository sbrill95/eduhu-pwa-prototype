import { useRef, useMemo } from 'react';

/**
 * Deep comparison utility for memoization
 * Used to prevent unnecessary re-renders when objects have same values but different references
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * useMemo with deep equality comparison instead of reference equality
 * Useful for InstantDB queries that return new references even when data is unchanged
 */
export function useDeepCompareMemo<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<{ deps: any[]; value: T } | undefined>(undefined);

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current!.value;
}

/**
 * Stabilize InstantDB query data to prevent infinite loops
 * Returns same reference if data hasn't actually changed
 */
export function useStableData<T>(data: T): T {
  const ref = useRef<T>(data);

  // Only update ref if data actually changed (deep comparison)
  if (!deepEqual(ref.current, data)) {
    ref.current = data;
  }

  return ref.current;
}