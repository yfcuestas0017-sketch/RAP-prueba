// Previene el envío implícito del formulario al pulsar Enter.
//
// En un formulario con botón "Guardar" (type="submit"), el navegador envía el
// formulario automáticamente cuando se presiona Enter dentro de un <input> o un
// <select>. En los asistentes de varios pasos (microcurrículo y fichas) esto
// guardaba el documento sin querer mientras se llenaban los datos, y como al
// guardar se vuelve a la lista, el usuario perdía lo que estaba escribiendo.
//
// Con este manejador, solo el clic en el botón "Guardar" envía el formulario.
// Se conserva el salto de línea en <textarea> y el envío al pulsar Enter
// teniendo enfocado el propio botón "Guardar".
export function impedirEnvioPorEnter(evento) {
  if (evento.key !== 'Enter') return;
  const destino = evento.target?.tagName;
  if (destino === 'TEXTAREA' || destino === 'BUTTON') return;
  evento.preventDefault();
}
