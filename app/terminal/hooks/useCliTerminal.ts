import { useEffect, useRef, type RefObject } from "react";
import { runCommand } from "../cli-client";
import { CYAN, GREEN, RESET } from "../lib/ansi";
import { KEY } from "../lib/keys";
import { banner, renderResponse } from "../lib/format";
import { useCommandHistory } from "./useCommandHistory";

//Hook orquestador de la web terminal: es el "driver" que conecta xterm con el CLI.
export function useCliTerminal(containerRef: RefObject<HTMLDivElement | null>) {
  const lineRef = useRef(""); // lo que se está tipeando
  const tokenRef = useRef<string | undefined>(undefined); // token de sesión (tras login)
  const roleRef = useRef<string | undefined>(undefined); // rol actual (para el prompt)
  const busyRef = useRef(false); // true mientras procesa un comando
  const history = useCommandHistory();

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const { Terminal: XTerm } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      if (disposed || !containerRef.current) return;

      const term = new XTerm({
        cursorBlink: true,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
        fontSize: 14,
        theme: {
          background: "#0a0a0a",
          foreground: "#e5e5e5",
          cursor: "#22c55e",
        },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(containerRef.current);
      fit.fit();

      //Helpers de escritura
      const writeLines = (text: string) =>
        term.write(text.replace(/\n/g, "\r\n"));
      const prompt = () => {
        const who = roleRef.current
          ? `${CYAN}fanz(${roleRef.current})>${RESET} `
          : `${CYAN}fanz>${RESET} `;
        term.write(`\r\n${who}`);
      };
      const replaceLine = (next: string) => {
        for (let i = 0; i < lineRef.current.length; i++) term.write("\b \b");
        term.write(next);
        lineRef.current = next;
      };

      writeLines(banner());
      prompt();

      //Procesa un comando completo al apretar enter.
      const submit = async (raw: string) => {
        const cmd = raw.trim();
        if (cmd) history.record(cmd);

        if (!cmd) {
          prompt();
          return;
        }

        //Comandos locales
        if (cmd === "clear") {
          term.clear();
          prompt();
          return;
        }
        if (cmd === "logout") {
          tokenRef.current = undefined;
          roleRef.current = undefined;
          writeLines(
            `${GREEN}Logged out. Token cleared from this session.${RESET}`,
          );
          prompt();
          return;
        }

        //Comando real
        busyRef.current = true;
        const res = await runCommand(cmd, tokenRef.current);
        busyRef.current = false;

        //login exitoso, guardamos el token en la sesión del browser
        if (res.ok && res.command === "login" && res.data) {
          const d = res.data as { token: string; role: string };
          tokenRef.current = d.token;
          roleRef.current = d.role;
        }

        const out = renderResponse(res);
        if (out) writeLines(out);
        prompt();
      };

      //Handler de teclado crudo
      term.onData((data) => {
        if (busyRef.current) return;
        if (data === KEY.ENTER) {
          term.write("\r\n");
          void submit(lineRef.current);
          lineRef.current = "";
          return;
        }

        if (data === KEY.BACKSPACE) {
          if (lineRef.current.length > 0) {
            lineRef.current = lineRef.current.slice(0, -1);
            term.write("\b \b");
          }
          return;
        }

        if (data === KEY.UP) {
          const cmd = history.previous();
          if (cmd !== null) replaceLine(cmd);
          return;
        }

        if (data === KEY.DOWN) {
          const cmd = history.next();
          if (cmd !== null) replaceLine(cmd);
          return;
        }

        if (data === KEY.CTRL_C) {
          term.write("^C");
          lineRef.current = "";
          prompt();
          return;
        }

        //Texto imprimible (incluye pegado). Filtramos caracteres de control.
        const printable = data.replace(/[\x00-\x1f]/g, "");
        if (printable.length > 0) {
          lineRef.current += printable;
          term.write(printable);
        }
      });

      // Reajuste al cambiar el tamaño de la ventana
      const onResize = () => fit.fit();
      window.addEventListener("resize", onResize);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        term.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [containerRef, history]);
}
