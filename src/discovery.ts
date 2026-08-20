export function discoveryInputExample(schema: Record<string, unknown>): Record<string, unknown> {
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const required = new Set(Array.isArray(schema.required) ? schema.required.map(String) : []);
  const result: Record<string, unknown> = {};
  for (const [name, property] of Object.entries(properties)) {
    if (!required.has(name) && property.default === undefined) continue;
    if (property.example !== undefined) result[name] = property.example;
    else if (property.default !== undefined) result[name] = property.default;
    else if (Array.isArray(property.enum) && property.enum.length) result[name] = property.enum[0];
    else if (property.type === "object") result[name] = {};
    else if (property.type === "array") result[name] = [];
    else if (property.type === "number" || property.type === "integer") result[name] = 1;
    else if (property.type === "boolean") result[name] = false;
    else result[name] = "example";
  }
  return result;
}
