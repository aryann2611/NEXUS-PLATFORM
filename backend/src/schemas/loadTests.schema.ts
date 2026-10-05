// Caps keep this a load tester for your own services, not a stress weapon.
export const startLoadTestSchema = {
  body: {
    type: "object",
    required: ["url"],
    additionalProperties: false,
    properties: {
      url: { type: "string", maxLength: 2048, format: "http-url" },
      vus: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      durationSeconds: { type: "integer", minimum: 5, maximum: 60, default: 30 },
    },
  },
} as const;
