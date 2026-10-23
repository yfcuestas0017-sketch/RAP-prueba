const { crearControladorProyectos } = require("../../utils/Proyectosadmin");
const { listarProyectos, obtenerProyecto } = crearControladorProyectos({
  numeroSemestre: 7,
  etiqueta: "interestructurante"
});

module.exports = {
  listarInterestructurantes: listarProyectos,
  obtenerInterestructurante: obtenerProyecto
};