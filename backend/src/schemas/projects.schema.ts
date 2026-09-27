/** Ajv format "http-url": an absolute http(s) URL with a host, checked by the WHATWG URL parser. */
export function isHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    return new URL(value).hostname !== "";
  } catch {
    return false;
  }
}

const nonBlank = "\\S";

export const createProjectSchema = {
  body: {
    type: "object",
    required: ["name", "baseUrl"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, pattern: nonBlank },
      baseUrl: { type: "string", maxLength: 2048, format: "http-url" },
      description: { type: "string", maxLength: 1000 },
      tags: {
        type: "array",
        maxItems: 10,
        uniqueItems: true,
        default: [],
        items: { type: "string", minLength: 1, maxLength: 24, pattern: nonBlank },
      },
      checkInterval: { type: "integer", minimum: 30, maximum: 3600, default: 60 },
      timeout: { type: "integer", minimum: 1, maximum: 30, default: 10 },
    },
  },
} as const;

export const projectParamsSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string", pattern: "^[1-9][0-9]{0,18}$" } },
  },
} as const;
