import type { BusinessConfig } from "@/lib/CONFIG_SCHEMA";
import { BusinessConfigSchema } from "@/lib/CONFIG_SCHEMA";

/**
 * Canonical defaults (validated) required by specs.
 * Keep this as the single source of safe fallbacks.
 */
export const DEFAULT_CONFIG: BusinessConfig = BusinessConfigSchema.parse({});

