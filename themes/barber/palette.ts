import type { ThemePalette } from "../base/types";
import { cafePalette } from "../cafe/palette";

/** Rojo, blanco y azul de barber pole para la ruleta */
const BARBER_POLE_WHEEL = ["#8B1E1E", "#FDFCF9", "#1C2E4A", "#8B1E1E", "#FDFCF9", "#1C2E4A"];

/**
 * Barbería: estilo camel en UI (fondo, botones) y colores barber pole (rojo, blanco, azul) en la ruleta.
 * Flecha de la ruleta en azul para diferenciarla del borde marrón.
 */
export const barberPalette: ThemePalette = {
  ...cafePalette,
  wheelSegmentColors: BARBER_POLE_WHEEL,
  wheelPointerColor: "#1C2E4A",
};
