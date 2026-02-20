import type { Theme } from "../base/types";
import { baseTokens } from "../base/tokens";
import { cafePalette } from "./palette";

export const cafeTheme: Theme = {
  key: "cafe",
  tokens: baseTokens,
  color: cafePalette,
  components: undefined,
};
