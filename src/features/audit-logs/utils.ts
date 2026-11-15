/**
 * Formats an audit log field value for tabular comparison display.
 */
export function formatCellValue(value: unknown): string {
  if (value === undefined) {
    return "-";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Computes field-level diff entries between old and new audit log JSON snapshots.
 */
export function collectDiffRows(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
) {
  const keys = Array.from(
    new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})]),
  ).sort();

  return keys.map((field) => {
    const hasOld = oldValues !== null && Object.prototype.hasOwnProperty.call(oldValues, field);
    const hasNew = newValues !== null && Object.prototype.hasOwnProperty.call(newValues, field);
    const oldVal = hasOld ? oldValues[field] : undefined;
    const newVal = hasNew ? newValues[field] : undefined;
    const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

    return {
      field,
      hasOld,
      hasNew,
      oldVal,
      newVal,
      changed,
    };
  });
}
