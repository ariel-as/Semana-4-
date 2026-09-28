import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const raizProyecto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(raizProyecto, "index.html"), "utf8");
const cuerpoHtml = html
  .match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1]
  .replace(/<script[\s\S]*?<\/script>/gi, "");

const TIEMPO_SERVICIO = 800;
const ESPERA = 900;

async function cargarScript() {
  await import("../script.js");
}

function boton() {
  return document.getElementById("btnCargar");
}

function resultado() {
  return document.getElementById("resultado");
}

function fijarAparicionDeExito() {
  vi.spyOn(Math, "random").mockReturnValue(0.9);
}

function fijarFalloDeServicio() {
  vi.spyOn(Math, "random").mockReturnValue(0.1);
}

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = cuerpoHtml;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("index.html", () => {
  it("expone un estado inicial idle antes de interactuar", () => {
    expect(resultado().dataset.state).toBe("idle");
    expect(resultado().getAttribute("aria-busy")).toBe("false");
    expect(resultado().textContent).toBe("Presiona el botón para empezar.");
  });

  it("carga los recursos locales que necesita el sitio", () => {
    expect(html).toContain('href="styles.css"');
    expect(html).toContain('src="script.js"');
    expect(html).toContain('<html lang="es">');
  });
});

describe("simulador de servicio asíncrono", () => {
  it("entra en estado de carga y bloquea el botón mientras espera", async () => {
    fijarAparicionDeExito();
    vi.useFakeTimers();
    await cargarScript();

    boton().click();

    expect(resultado().dataset.state).toBe("loading");
    expect(resultado().getAttribute("aria-busy")).toBe("true");
    expect(resultado().textContent).toBe("Cargando...");
    expect(boton().disabled).toBe(true);
    expect(boton().textContent).toBe("Cargando...");
  });

  it("muestra el usuario y rehabilita el botón cuando el servicio responde", async () => {
    fijarAparicionDeExito();
    vi.useFakeTimers();
    await cargarScript();

    boton().click();
    await vi.advanceTimersByTimeAsync(TIEMPO_SERVICIO);

    expect(resultado().dataset.state).toBe("success");
    expect(resultado().textContent).toBe("Bienvenido, Ariel (estudiante)");
    expect(resultado().getAttribute("aria-busy")).toBe("false");
    expect(boton().disabled).toBe(false);
    expect(boton().textContent).toBe("Cargar datos del usuario");
  });

  it("muestra el mensaje del error cuando el servicio falla", async () => {
    fijarFalloDeServicio();
    vi.useFakeTimers();
    await cargarScript();

    boton().click();
    await vi.advanceTimersByTimeAsync(TIEMPO_SERVICIO);

    expect(resultado().dataset.state).toBe("error");
    expect(resultado().textContent).toBe("Error: No se pudo conectar con el servicio");
    expect(resultado().getAttribute("aria-busy")).toBe("false");
    expect(boton().disabled).toBe(false);
  });

  it("permite reintentar la carga después de un fallo", async () => {
    fijarFalloDeServicio();
    vi.useFakeTimers();
    await cargarScript();

    boton().click();
    await vi.advanceTimersByTimeAsync(TIEMPO_SERVICIO);
    expect(resultado().dataset.state).toBe("error");

    fijarAparicionDeExito();
    boton().click();
    await vi.advanceTimersByTimeAsync(TIEMPO_SERVICIO);

    expect(resultado().dataset.state).toBe("success");
    expect(resultado().textContent).toBe("Bienvenido, Ariel (estudiante)");
  });

  it("realiza la petición con temporizadores reales sin colgarse", async () => {
    fijarAparicionDeExito();
    await cargarScript();

    boton().click();
    await new Promise((resolver) => setTimeout(resolver, ESPERA));

    expect(resultado().dataset.state).toBe("success");
  });
});
