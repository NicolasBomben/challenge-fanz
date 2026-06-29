/**
 * Teclas crudas que entrega xterm en su callback onData.
 * Responsabilidad: input de teclado (no output, no lógica).
 */
export const KEY = {
  ENTER: "\r",
  BACKSPACE: "\x7f",
  UP: "\x1b[A",
  DOWN: "\x1b[B",
  CTRL_C: "\x03",
};
