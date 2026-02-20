import { z } from "zod";

// ---------------------------------------------
// Business (multi-tenant) configuration schema
// ---------------------------------------------

export const WheelSegmentTypeSchema = z.enum(["none", "reward", "stamp"]);
export type WheelSegmentType = z.infer<typeof WheelSegmentTypeSchema>;

export const WheelSegmentSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean().default(true),
  label: z.string().min(1),
  type: WheelSegmentTypeSchema.default("none"),
  /**
   * For type "stamp": stamps to add (usually 1)
   * For type "reward": optional reward value (unused by default)
   * For type "none": ignored
   */
  value: z.number().int().nonnegative().optional(),
  weight: z.number().int().positive().default(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type WheelSegment = z.infer<typeof WheelSegmentSchema>;

/** Theme/business type key for dynamic layout and styling (cafe, bar, barber, gym, retail, etc.) */
export const BusinessTypeSchema = z.enum(["cafe", "bar", "barber", "gym", "retail"]);
export type BusinessType = z.infer<typeof BusinessTypeSchema>;

export const BusinessConfigSchema = z
  .object({
    version: z.number().int().positive().default(1),

    /** Resolved theme key: used by ThemeRegistry. Falls back to business_type. */
    theme: z.string().min(1).optional(),
    /** Business vertical: used for default theme when theme is not set. */
    business_type: BusinessTypeSchema.optional(),

    branding: z
      .object({
        name: z.string().min(1).optional(),
        logo_url: z.union([z.string().url(), z.literal(null)]).optional(),
        favicon_url: z.union([z.string().url(), z.literal(null)]).optional(),
        theme: z
          .object({
            background: z.string().min(1).optional(),
            primary: z.string().min(1).optional(),
            secondary: z.string().min(1).optional(),
            text: z.string().min(1).optional(),
          })
          .default({}),
      })
      .default({ theme: {} }),

    seo: z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
      })
      .default({}),

    features: z
      .object({
        wheel: z.boolean().default(true),
        stamps: z.boolean().default(true),
        wallet: z.boolean().default(true),
        login: z.boolean().default(true),
        admin: z.boolean().default(true),
      })
      .default({ wheel: true, stamps: true, wallet: true, login: true, admin: true }),

    stamps: z
      .object({
        goal: z.number().int().positive().default(8),
        daily_limit: z.number().int().nonnegative().default(1),
        reward_title: z.string().min(1).optional(),
      })
      .default({ goal: 8, daily_limit: 1 }),

    rewards: z
      .object({
        expires_days: z.number().int().positive().default(30),
      })
      .default({ expires_days: 30 }),

    wheel: z
      .object({
        enabled: z.boolean().default(true),
        cooldown_days: z.number().int().nonnegative().default(7),
        segments: z
          .array(WheelSegmentSchema)
          .min(4)
          .default([
            { id: "stamp_1", label: "1 sello extra", type: "stamp", value: 1, weight: 3, enabled: true },
            { id: "none_1", label: "Sigue jugando", type: "none", weight: 6, enabled: true },
            { id: "reward_1", label: "5% dto próxima visita", type: "reward", weight: 2, enabled: true },
            { id: "reward_2", label: "Tapa gratis", type: "reward", weight: 1, enabled: true },
          ]),
        ui: z
          .object({
            segment_colors: z.array(z.string().min(1)).min(2).optional(),
          })
          .default({}),
      })
      .default({
        enabled: true,
        cooldown_days: 7,
        segments: [
          { id: "stamp_1", label: "1 sello extra", type: "stamp", value: 1, weight: 3, enabled: true },
          { id: "none_1", label: "Sigue jugando", type: "none", weight: 6, enabled: true },
          { id: "reward_1", label: "5% dto próxima visita", type: "reward", weight: 2, enabled: true },
          { id: "reward_2", label: "Tapa gratis", type: "reward", weight: 1, enabled: true },
        ],
        ui: {},
      }),

    texts: z
      .object({
        common: z
          .object({
            loading: z.string().min(1).default("Cargando..."),
            back: z.string().min(1).default("Volver"),
            error_generic: z.string().min(1).default("Error"),
          })
          .default({ loading: "Cargando...", back: "Volver", error_generic: "Error" }),

        landing: z
          .object({
            welcome_kicker: z.string().min(1).default("Bienvenido a"),
            subtitle: z.string().min(1).default("Acumula sellos y gana premios. Sin apps, solo QR."),
            cta_start: z.string().min(1).default("Empezar (crear cuenta / entrar)"),
            cta_wallet: z.string().min(1).default("Ver mis sellos"),
            cta_wheel: z.string().min(1).default("🎡 Girar ruleta"),
            cta_premium: z.string().min(1).default("Ver premios"),
            logout: z.string().min(1).default("Cerrar sesión"),
            privacy_line_1: z.string().min(1).default("Al continuar aceptas la política de privacidad del establecimiento."),
            privacy_line_2: z
              .string()
              .min(1)
              .default("Consejo: añade esta web a tu pantalla de inicio para abrirla como app."),
            error_not_found: z.string().min(1).default("Bar no encontrado"),
          })
          .default({
            welcome_kicker: "Bienvenido a",
            subtitle: "Acumula sellos y gana premios. Sin apps, solo QR.",
            cta_start: "Empezar (crear cuenta / entrar)",
            cta_wallet: "Ver mis sellos",
            cta_wheel: "🎡 Girar ruleta",
            cta_premium: "Ver premios",
            logout: "Cerrar sesión",
            privacy_line_1: "Al continuar aceptas la política de privacidad del establecimiento.",
            privacy_line_2: "Consejo: añade esta web a tu pantalla de inicio para abrirla como app.",
            error_not_found: "Bar no encontrado",
          }),

        login: z
          .object({
            title_kicker: z.string().min(1).default("Acceso"),
            subtitle: z.string().min(1).default("Guarda tu wallet y canjea premios."),
            tab_signup: z.string().min(1).default("Crear cuenta"),
            tab_login: z.string().min(1).default("Entrar"),
            email_label: z.string().min(1).default("Email"),
            email_placeholder: z.string().min(1).default("tu@email.com"),
            password_label: z.string().min(1).default("Contraseña"),
            password_placeholder: z.string().min(1).default("********"),
            submit_signup: z.string().min(1).default("Crear cuenta"),
            submit_login: z.string().min(1).default("Entrar"),
            processing: z.string().min(1).default("Procesando..."),
            hint_line_1: z.string().min(1).default("MVP sin SMS: acceso con email y contraseña."),
            hint_line_2: z.string().min(1).default("Consejo: usa una contraseña de 8+ caracteres."),
            validation_missing: z.string().min(1).default("Rellena email y contraseña"),
            validation_password_len: z.string().min(1).default("La contraseña debe tener al menos 6 caracteres"),
          })
          .default({
            title_kicker: "Acceso",
            subtitle: "Guarda tu wallet y canjea premios.",
            tab_signup: "Crear cuenta",
            tab_login: "Entrar",
            email_label: "Email",
            email_placeholder: "tu@email.com",
            password_label: "Contraseña",
            password_placeholder: "********",
            submit_signup: "Crear cuenta",
            submit_login: "Entrar",
            processing: "Procesando...",
            hint_line_1: "MVP sin SMS: acceso con email y contraseña.",
            hint_line_2: "Consejo: usa una contraseña de 8+ caracteres.",
            validation_missing: "Rellena email y contraseña",
            validation_password_len: "La contraseña debe tener al menos 6 caracteres",
          }),

        wallet: z
          .object({
            title_kicker: z.string().min(1).default("Tu wallet"),
            section_stamps: z.string().min(1).default("Tus sellos"),
            reward_for_completion: z.string().min(1).default("Premio por completar:"),
            staff_actions_title: z.string().min(1).default("Acciones (staff)"),
            staff_actions_subtitle: z
              .string()
              .min(1)
              .default("El camarero introduce el PIN del bar para validar consumo o canjear premios."),
            pin_placeholder: z.string().min(1).default("PIN (ej. 1234)"),
            pin_missing_add_stamp: z.string().min(1).default("Introduce el PIN del bar"),
            pin_missing_redeem: z.string().min(1).default("Introduce el PIN del bar para canjear"),
            add_stamp: z.string().min(1).default("Añadir 1 sello"),
            processing: z.string().min(1).default("Procesando..."),
            rewards_title: z.string().min(1).default("Premios activos"),
            rewards_empty: z.string().min(1).default("Aún no tienes premios activos."),
            rewards_expires_at: z.string().min(1).default("Caduca:"),
            rewards_ready: z.string().min(1).default("Listo para usar"),
            stamps_completed_message: z
              .string()
              .min(1)
              .default("¡Objetivo completado! Tienes un nuevo premio para canjear."),
            redeem: z.string().min(1).default("Canjear (staff)"),
            tip: z.string().min(1).default("Consejo: guarda esta página en tu pantalla de inicio para abrirla como app."),
            cta_wheel: z.string().min(1).default("🎡 Ruleta"),
          })
          .default({
            title_kicker: "Tu wallet",
            section_stamps: "Tus sellos",
            reward_for_completion: "Premio por completar:",
            staff_actions_title: "Acciones (staff)",
            staff_actions_subtitle: "El camarero introduce el PIN del bar para validar consumo o canjear premios.",
            pin_placeholder: "PIN (ej. 1234)",
            pin_missing_add_stamp: "Introduce el PIN del bar",
            pin_missing_redeem: "Introduce el PIN del bar para canjear",
            add_stamp: "Añadir 1 sello",
            processing: "Procesando...",
            rewards_title: "Premios activos",
            rewards_empty: "Aún no tienes premios activos.",
            rewards_expires_at: "Caduca:",
            rewards_ready: "Listo para usar",
            stamps_completed_message: "¡Objetivo completado! Tienes un nuevo premio para canjear.",
            redeem: "Canjear (staff)",
            tip: "Consejo: guarda esta página en tu pantalla de inicio para abrirla como app.",
            cta_wheel: "🎡 Ruleta",
          }),

        wheel: z
          .object({
            title_kicker: z.string().min(1).default("Ruleta de premios"),
            cta_wallet: z.string().min(1).default("Mis premios"),
            cta_spin: z.string().min(1).default("Girar ruleta"),
            spinning: z.string().min(1).default("Girando..."),
            result_title: z.string().min(1).default("Resultado"),
            saved_ok: z.string().min(1).default("✅ Premio guardado en tu wallet."),
            saved_fail: z.string().min(1).default("⚠️ No se ha podido guardar el premio. (revisa /api/spin)"),
            cta_view_reward: z.string().min(1).default("Ver mi premio en Wallet"),
            need_login: z.string().min(1).default("Necesitas iniciar sesión"),
          })
          .default({
            title_kicker: "Ruleta de premios",
            cta_wallet: "Mis premios",
            cta_spin: "Girar ruleta",
            spinning: "Girando...",
            result_title: "Resultado",
            saved_ok: "✅ Premio guardado en tu wallet.",
            saved_fail: "⚠️ No se ha podido guardar el premio. (revisa /api/spin)",
            cta_view_reward: "Ver mi premio en Wallet",
            need_login: "Necesitas iniciar sesión",
          }),

        api: z
          .object({
            missing_params: z.string().min(1).default("Missing params"),
            bar_not_found: z.string().min(1).default("Bar not found"),
            wheel_disabled: z.string().min(1).default("Wheel disabled"),
            invalid_pin: z.string().min(1).default("Invalid PIN"),
            daily_limit_reached: z.string().min(1).default("Daily limit reached"),
            reward_not_found: z.string().min(1).default("Reward not found"),
            reward_not_active: z.string().min(1).default("Reward not active"),
            reward_wrong_user: z.string().min(1).default("Reward does not belong to this user"),
            cooldown_active: z.string().min(1).default("Wheel cooldown active"),
          })
          .default({
            missing_params: "Missing params",
            bar_not_found: "Bar not found",
            wheel_disabled: "Wheel disabled",
            invalid_pin: "Invalid PIN",
            daily_limit_reached: "Daily limit reached",
            reward_not_found: "Reward not found",
            reward_not_active: "Reward not active",
            reward_wrong_user: "Reward does not belong to this user",
            cooldown_active: "Wheel cooldown active",
          }),
      })
      .default({
        common: { loading: "Cargando...", back: "Volver", error_generic: "Error" },
        landing: {
          welcome_kicker: "Bienvenido a",
          subtitle: "Acumula sellos y gana premios. Sin apps, solo QR.",
          cta_start: "Empezar (crear cuenta / entrar)",
          cta_wallet: "Ver mis sellos",
          cta_wheel: "🎡 Girar ruleta",
          cta_premium: "Ver premios",
          logout: "Cerrar sesión",
          privacy_line_1: "Al continuar aceptas la política de privacidad del establecimiento.",
          privacy_line_2: "Consejo: añade esta web a tu pantalla de inicio para abrirla como app.",
          error_not_found: "Bar no encontrado",
        },
        login: {
          title_kicker: "Acceso",
          subtitle: "Guarda tu wallet y canjea premios.",
          tab_signup: "Crear cuenta",
          tab_login: "Entrar",
          email_label: "Email",
          email_placeholder: "tu@email.com",
          password_label: "Contraseña",
          password_placeholder: "********",
          submit_signup: "Crear cuenta",
          submit_login: "Entrar",
          processing: "Procesando...",
          hint_line_1: "MVP sin SMS: acceso con email y contraseña.",
          hint_line_2: "Consejo: usa una contraseña de 8+ caracteres.",
          validation_missing: "Rellena email y contraseña",
          validation_password_len: "La contraseña debe tener al menos 6 caracteres",
        },
        wallet: {
          title_kicker: "Tu wallet",
          section_stamps: "Tus sellos",
          reward_for_completion: "Premio por completar:",
          staff_actions_title: "Acciones (staff)",
          staff_actions_subtitle: "El camarero introduce el PIN del bar para validar consumo o canjear premios.",
          pin_placeholder: "PIN (ej. 1234)",
          pin_missing_add_stamp: "Introduce el PIN del bar",
          pin_missing_redeem: "Introduce el PIN del bar para canjear",
          add_stamp: "Añadir 1 sello",
          processing: "Procesando...",
          rewards_title: "Premios activos",
          rewards_empty: "Aún no tienes premios activos.",
          rewards_expires_at: "Caduca:",
          rewards_ready: "Listo para usar",
          stamps_completed_message: "¡Objetivo completado! Tienes un nuevo premio para canjear.",
          redeem: "Canjear (staff)",
          tip: "Consejo: guarda esta página en tu pantalla de inicio para abrirla como app.",
          cta_wheel: "🎡 Ruleta",
        },
        wheel: {
          title_kicker: "Ruleta de premios",
          cta_wallet: "Mis premios",
          cta_spin: "Girar ruleta",
          spinning: "Girando...",
          result_title: "Resultado",
          saved_ok: "✅ Premio guardado en tu wallet.",
          saved_fail: "⚠️ No se ha podido guardar el premio. (revisa /api/spin)",
          cta_view_reward: "Ver mi premio en Wallet",
          need_login: "Necesitas iniciar sesión",
        },
        api: {
          missing_params: "Missing params",
          bar_not_found: "Bar not found",
          wheel_disabled: "Wheel disabled",
          invalid_pin: "Invalid PIN",
          daily_limit_reached: "Daily limit reached",
          reward_not_found: "Reward not found",
          reward_not_active: "Reward not active",
          reward_wrong_user: "Reward does not belong to this user",
          cooldown_active: "Wheel cooldown active",
        },
      }),
  })
  .strict();

export type BusinessConfig = z.infer<typeof BusinessConfigSchema>;

export function validateBusinessConfig(input: unknown): { ok: true; value: BusinessConfig } | { ok: false; issues: string[] } {
  const parsed = BusinessConfigSchema.safeParse(input ?? {});
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    issues: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
}

