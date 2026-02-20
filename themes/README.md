# Sistema de temas multi-negocio

Cada negocio puede elegir diseño (theme/layout) según `config.theme` o `config.business_type`.

## Estructura

- **base/** — Tipos (`Theme`, `ThemePalette`, `ThemeTokens`), componentes opcionales (`Stamp`, `WheelPresentation`), tokens base.
- **shared/registry.ts** — `getThemeKeyFromConfig(config)`, `getTheme(key)`, registro de temas.
- **cafe/** — Tema cafeterías y bares (camel, marfil, minimalista). Sin overrides de Stamp/Wheel.
- **bar/** — Alias de `cafe` en el registro.
- **barber/** — Tema barbería: paleta rojo/azul/marfil, sellos con icono de tijeras, ruleta con tijeras fijas arriba y centro con nombre del negocio.

## Cómo añadir un nuevo tema

1. Crear carpeta `themes/<key>` (ej. `themes/gym`).
2. Añadir `palette.ts` (objeto que cumpla `ThemePalette`) e `index.ts` que exporte `Theme` con `key`, `tokens`, `color` y opcionalmente `components.Stamp` y/o `components.WheelPresentation`.
3. En `CONFIG_SCHEMA.ts`, añadir el key a `BusinessTypeSchema` si debe ser un tipo de negocio:  
   `z.enum(["cafe", "bar", "barber", "gym", "retail"])`.
4. En `themes/shared/registry.ts`, importar el nuevo tema y añadirlo a `themeRegistry` y al tipo `ThemeKey`.

## Uso

- El layout `/b/[slug]` envuelve los hijos en `BarThemeWrapper`, que usa `useBusinessConfig(slug)` y pone en contexto el tema resuelto con `getThemeKeyFromConfig(config)`.
- Los componentes usan `useTheme()` para leer `theme.color`, `theme.tokens` y opcionalmente `theme.components.Stamp` / `theme.components.WheelPresentation`.
- Fuera del layout de bar (ej. home), `useTheme()` devuelve el tema `cafe` por defecto.

## Config del negocio

En `bars.config` (JSON):

- **theme** (opcional): clave del tema, ej. `"barber"`. Si no se indica, se usa `business_type`.
- **business_type** (opcional): `"cafe" | "bar" | "barber" | "gym" | "retail"`. Por defecto se usa `"cafe"`.

Ejemplo para barbería:

```json
{
  "version": 1,
  "theme": "barber",
  "business_type": "barber",
  "branding": { "name": "Barbería X" },
  ...
}
```
