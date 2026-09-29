export const reportQuerySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      range: { type: "string", enum: ["24h", "7d", "30d"], default: "7d" },
      projectId: { type: "string", pattern: "^[1-9][0-9]{0,18}$" },
    },
  },
} as const;
