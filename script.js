class ServicioError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ServicioError";
  }
}

function obtenerDatosUsuario() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exito = Math.random() > 0.3;
      if (exito) {
        resolve({ usuario: "Ariel", rol: "estudiante" });
      } else {
        reject(new ServicioError("No se pudo conectar con el servicio"));
      }
    }, 800);
  });
}

const boton = document.getElementById("btnCargar");
const resultado = document.getElementById("resultado");

function mostrarResultado(mensaje, estado) {
  resultado.textContent = mensaje;
  resultado.dataset.state = estado;
}

async function cargarDatos() {
  boton.disabled = true;
  boton.textContent = "Cargando...";
  resultado.setAttribute("aria-busy", "true");
  mostrarResultado("Cargando...", "loading");

  try {
    const datos = await obtenerDatosUsuario();
    mostrarResultado(`Bienvenido, ${datos.usuario} (${datos.rol})`, "success");
  } catch (error) {
    const mensaje = error instanceof ServicioError
      ? error.message
      : "Ocurrió un error inesperado.";
    mostrarResultado(`Error: ${mensaje}`, "error");
  } finally {
    boton.disabled = false;
    boton.textContent = "Cargar datos del usuario";
    resultado.setAttribute("aria-busy", "false");
  }
}

boton.addEventListener("click", cargarDatos);
