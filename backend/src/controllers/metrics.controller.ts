import { getOverview } from "../services/metrics.service.js";

export async function overview() {
  return { data: await getOverview() };
}
