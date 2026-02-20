import type { ThemePalette } from "../base/types";
import { cafePalette } from "../cafe/palette";

/** Rojo, azul y blanco para la ruleta; en segmentos blancos el texto es negro para buena lectura */
const BARBER_POLE_WHEEL = ["#8B1E1E", "#1C2E4A", "#FDFCF9", "#8B1E1E", "#1C2E4A", "#FDFCF9"];

/**
 * Barbería: estilo camel en UI (fondo, botones) y colores barber pole (rojo, blanco, azul) en la ruleta.
 * Flecha de la ruleta en azul para diferenciarla del borde marrón.
 */
export const barberPalette: ThemePalette = {
  ...cafePalette,
  wheelSegmentColors: BARBER_POLE_WHEEL,
  wheelPointerColor: "#1C2E4A",
};
