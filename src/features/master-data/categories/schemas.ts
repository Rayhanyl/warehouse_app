export { categoryFormSchema, validateZodSchema } from "../validation";
import type { CategoryListParams } from "./types";

export const INITIAL_CATEGORY_LIST_PARAMS: CategoryListParams = {
  limit: 20,
  offset: 0,
  search: "",
  status: "all",
  sort_by: "id",
  sort_dir: "asc",
};
