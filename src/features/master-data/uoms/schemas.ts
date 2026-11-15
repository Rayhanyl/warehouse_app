export { uomFormSchema, validateZodSchema } from "../validation";
import type { UomListParams } from "./types";

export const INITIAL_UOM_LIST_PARAMS: UomListParams = {
  limit: 20,
  offset: 0,
  search: "",
  status: "all",
  sort_by: "id",
  sort_dir: "asc",
};
