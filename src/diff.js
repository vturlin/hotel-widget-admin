/**
 * Compute a flat, readable diff between two config objects.
 *
 * Returns an array of change entries, each with:
 *   - path    : string like "brandColor" or "channelLabels.agoda"
 *   - type    : "added" | "removed" | "modified"
 *   - before  : value in the old config (undefined if added)
 *   - after   : value in the new config (undefined if removed)
 *
 * Why flat and not tree-shaped:
 *   - Easier to render as a list of lines (like a git diff)
 *   - Arrays of objects (like roomOptions) are compared by their JSON
 *     representation rather than item-by-item, which is good enough for
 *     our use case where rooms are small and rarely reordered.
 */

export function diffConfigs(oldCfg, newCfg) {
  const changes = [];
  const oldFlat = flatten(oldCfg);
  const newFlat = flatten(newCfg);

  const allKeys = new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)]);

  for (const key of allKeys) {
    // Skip internal fields — not meaningful for the user
    if (key.startsWith('_')) continue;

    const before = oldFlat[key];
    const after = newFlat[key];

    if (before === undefined && after !== undefined) {
      changes.push({ path: key, type: 'added', before: undefined, after });
    } else if (before !== undefined && after === undefined) {
      changes.push({ path: key, type: 'removed', before, after: undefined });
    } else if (!deepEqual(before, after)) {
      changes.push({ path: key, type: 'modified', before, after });
    }
  }

  // Sort for predictable rendering: top-level fields first, then nested
  changes.sort((a, b) => {
    const dotA = (a.path.match(/\./g) || []).length;
    const dotB = (b.path.match(/\./g) || []).length;
    if (dotA !== dotB) return dotA - dotB;
    return a.path.localeCompare(b.path);
  });

  return changes;
}

/**
 * Flatten one level of nesting for plain objects. Arrays and primitives
 * are kept as-is (we compare them by deepEqual at the leaves).
 */
function flatten(obj, prefix = '', out = {}) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out[prefix.slice(0, -1)] = obj;
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const path = `${prefix}${k}`;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, `${path}.`, out);
    } else {
      out[path] = v;
    }
  }
  return out;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/**
 * Format a value for display in the diff list.
 * Long strings and objects get truncated; null/undefined get placeholders.
 */
export function formatDiffValue(v) {
  if (v === undefined) return '—';
  if (v === null) return 'null';
  if (v === '') return '(empty)';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) {
    return `[${v.length} item${v.length === 1 ? '' : 's'}]`;
  }
  if (typeof v === 'object') {
    return '{object}';
  }
  const s = String(v);
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}