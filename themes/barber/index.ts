import type { Theme } from "../base/types";
import { baseTokens } from "../base/tokens";
import { barberPalette } from "./palette";
import { BarberStamp } from "./components/Stamp";
import { BarberWheelCenter } from "./components/WheelCenter";

/**
 * Barbería: estilo camel en página, ruleta rojo/blanco/azul (barber pole).
 * Sellos = círculo con tijeras cuando conseguido, vacío cuando no.
 * Puntero = flecha (color distinto al borde). Centro = PNG tijeras.
 */
export const barberTheme: Theme = {
  key: "barber",
  tokens: baseTokens,
  color: barberPalette,
  components: {
    Stamp: BarberStamp,
    WheelCenterContent: BarberWheelCenter,
  },
};
