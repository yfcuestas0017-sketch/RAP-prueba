const pool = require("../../config/database");
const XLSX = require("xlsx");

const importarUsuarios = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        mensaje: "No se recibió ningún archivo."
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer"
    });

    const nombreHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[nombreHoja];

    const usuarios = XLSX.utils.sheet_to_json(hoja);

    if (usuarios.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: "El archivo está vacío."
      });
    }

    let nuevos = 0;
    let actualizados = 0;
    let errores = 0;

    const erroresDetalle = [];

    for (let i = 0; i < usuarios.length; i++) {
      const fila = usuarios[i];

      const numeroFila = i + 2;

      const idInstitucional =
        fila.Id_user_institucional;

      const nombre =
        fila.Nombre;

      const apellido =
        fila.Apellido;

      const correo =
        fila.Correo;

      const idRol =
        fila.Id_rol;

      let estado =
        fila.Estado;


      if (
        !idInstitucional ||
        !nombre ||
        !correo ||
        !idRol
      ) {
        errores++;

        erroresDetalle.push(
          `Fila ${numeroFila}: faltan datos obligatorios.`
        );

        continue;
      }

      const correoNormalizado =
        String(correo)
          .trim()
          .toLowerCase();

      const nombreNormalizado =
        String(nombre)
          .trim();

      const apellidoNormalizado =
        apellido
          ? String(apellido).trim()
          : null;

      const rolNormalizado =
        Number(idRol);

      if (
        estado === undefined ||
        estado === null ||
        estado === ""
      ) {
        estado = true;
      } else {
        estado = String(estado)
          .trim()
          .toLowerCase();

        estado =
          estado === "true" ||
          estado === "1" ||
          estado === "activo" ||
          estado === "si" ||
          estado === "sí";
      }

      const correoValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          correoNormalizado
        );

      if (!correoValido) {
        errores++;

        erroresDetalle.push(
          `Fila ${numeroFila}: correo inválido (${correoNormalizado}).`
        );

        continue;
      }

      if (![5, 6].includes(rolNormalizado)) {
        errores++;

        erroresDetalle.push(
          `Fila ${numeroFila}: el Id_rol ${rolNormalizado} no corresponde a un docente (5) o estudiante (6).`
        );

        continue;
      }

      const existente = await pool.query(
        `
        SELECT "id_user"
        FROM "usuarios"
        WHERE LOWER(TRIM("correo")) = LOWER(TRIM($1))
        `,
        [correoNormalizado]
      );

      if (existente.rows.length > 0) {

        await pool.query(
          `
          UPDATE "usuarios"
          SET
            "id_user_institucional" = $1,
            "nombre" = $2,
            "apellido" = $3,
            "id_rol" = $4,
            "estado" = $5
          WHERE "id_user" = $6
          `,
          [
            idInstitucional,
            nombreNormalizado,
            apellidoNormalizado,
            rolNormalizado,
            estado,
            existente.rows[0].id_user
          ]
        );

        actualizados++;

      } else {

        await pool.query(
          `
          INSERT INTO "usuarios"
          (
            "id_user_institucional",
            "nombre",
            "apellido",
            "correo",
            "estado",
            "id_rol"
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            idInstitucional,
            nombreNormalizado,
            apellidoNormalizado,
            correoNormalizado,
            estado,
            rolNormalizado
          ]
        );

        nuevos++;
      }
    }

    return res.status(200).json({
      success: true,
      mensaje: "Importación completada.",
      procesados: usuarios.length,
      nuevos: nuevos,
      actualizados: actualizados,
      errores: errores,
      erroresDetalle: erroresDetalle
    });

  } catch (error) {

    console.error(
      "Error importando usuarios:",
      error
    );

    return res.status(500).json({
      success: false,
      mensaje: "Error interno al importar los usuarios."
    });
  }
};


// ==========================================
// OBTENER TODOS LOS USUARIOS
// ==========================================
const obtenerUsuarios = async (req, res) => {
  try {

    const resultado = await pool.query(`
      SELECT
        "id_user",
        "id_user_institucional",
        "nombre",
        "apellido",
        "correo",
        "estado",
        "id_rol"
      FROM "usuarios"
      ORDER BY "id_user" ASC;
    `);

    res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      usuarios: resultado.rows
    });

  } catch (error) {

    console.error(
      "Error obteniendo usuarios:",
      error
    );

    res.status(500).json({
      success: false,
      mensaje: "Error al obtener los usuarios"
    });
  }
};


module.exports = {
  importarUsuarios,
  obtenerUsuarios
};