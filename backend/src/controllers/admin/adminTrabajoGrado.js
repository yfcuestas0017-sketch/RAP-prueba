const { crearControladorProyectos } = require("../../utils/Proyectosadmin");
const { listarProyectos, obtenerProyecto } = crearControladorProyectos({
  numeroSemestre: 9,
  etiqueta: "trabajo de grado"
});

module.exports = {
  listarTrabajosGrado: listarProyectos,
  obtenerTrabajoGrado: obtenerProyecto
};