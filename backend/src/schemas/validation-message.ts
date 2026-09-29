interface ValidationIssue {
  instancePath: string;
  keyword: string;
  message?: string;
  params: Record<string, unknown>;
}

const labels: Record<string, string> = {
  name: "name",
  baseUrl: "baseUrl",
  description: "description",
  tags: "tags",
  checkInterval: "checkInterval",
  timeout: "timeout",
};

/** Turns the first Ajv issue into a readable sentence that still names the offending field. */
export function describeValidationIssue(issue: ValidationIssue, prefix = "body"): string {
  const path = issue.instancePath.replace(/^\//, "").split("/");
  const field = labels[path[0]] ?? (path[0] || prefix);
  const where = path.length > 1 ? `${field} entry ${path[1]}` : field;

  switch (issue.keyword) {
    case "required":
      return `${String(issue.params.missingProperty)} is required`;
    case "additionalProperties":
      return `Unknown field "${String(issue.params.additionalProperty)}"`;
    case "format":
      return issue.params.format === "http-url"
        ? `${where} must be a valid http(s) URL, e.g. https://api.example.com`
        : `${where} has an invalid format`;
    case "type":
      return `${where} must be of type ${String(issue.params.type)}`;
    case "minimum":
      return `${where} must be at least ${String(issue.params.limit)}`;
    case "maximum":
      return `${where} must be at most ${String(issue.params.limit)}`;
    case "minLength":
      return `${where} can't be empty`;
    case "maxLength":
      return `${where} must be at most ${String(issue.params.limit)} characters`;
    case "maxItems":
      return `${where} can have at most ${String(issue.params.limit)} entries`;
    case "uniqueItems":
      return `${where} must not contain duplicates`;
    case "pattern":
      return issue.instancePath ? `${where} can't be blank` : `${where} is invalid`;
    default:
      return `${where} ${issue.message ?? "is invalid"}`;
  }
}
