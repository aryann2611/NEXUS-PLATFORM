// Query strings arrive as strings (the app disables Ajv type coercion), so numbers and booleans
// are validated as patterns here and converted in the controller.
export const activityQuerySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      limit: { type: "string", pattern: "^[1-9][0-9]{0,2}$", default: "20" },
      projectId: { type: "string", pattern: "^[1-9][0-9]{0,18}$" },
      changes: { type: "string", enum: ["true", "false"], default: "false" },
    },
  },
} as const;

export const MAX_ACTIVITY_LIMIT = 200;
