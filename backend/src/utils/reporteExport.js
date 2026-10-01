const XLSX = require("xlsx");

// Genera un libro de Excel a partir de cabeceras + filas y devuelve un Buffer.
function construirExcel(nombreHoja, columnas, filas) {
  const hoja = XLSX.utils.aoa_to_sheet([
    columnas,
    ...filas
  ]);

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    libro,
    hoja,
    (nombreHoja || "Reporte").slice(0, 31)
  );

  return XLSX.write(libro, {
    type: "buffer",
    bookType: "xlsx"
  });
}

// Escritor mínimo de PDF (sin dependencias externas): una tabla simple con
// fuente Helvetica y paginación automática. Devuelve un Buffer.
function construirPdf(titulo, columnas, filas) {
  const anchoPagina = 595.28;
  const altoPagina = 841.89;
  const margen = 40;
  const fuenteTabla = 9;
  const fuenteTitulo = 15;
  const altoFila = 16;

  const totalColumnas = columnas.length || 1;
  const anchoColumna =
    (anchoPagina - margen * 2) / totalColumnas;
  const maxCaracteres = Math.max(
    6,
    Math.floor(anchoColumna / (fuenteTabla * 0.5))
  );

  const sanear = (valor) =>
    String(valor === null || valor === undefined ? "" : valor)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

  const truncar = (valor) => {
    const texto = String(
      valor === null || valor === undefined ? "" : valor
    );
    return texto.length > maxCaracteres
      ? texto.slice(0, maxCaracteres - 3) + "..."
      : texto;
  };

  const lineas = [
    columnas.map((c) => truncar(c)),
    ...filas.map((fila) =>
      Array.from({ length: totalColumnas }, (_, i) =>
        truncar(fila[i])
      )
    )
  ];

  const filasPorPagina = Math.max(
    1,
    Math.floor(
      (altoPagina - margen * 2 - fuenteTitulo - 24) / altoFila
    )
  );

  const paginas = [];
  for (let i = 0; i < lineas.length; i += filasPorPagina) {
    paginas.push(lineas.slice(i, i + filasPorPagina));
  }
  if (paginas.length === 0) paginas.push([[]]);

  const contenidoPagina = (lineasPagina) => {
    let y = altoPagina - margen;
    let flujo = "";

    flujo += `BT /F1 ${fuenteTitulo} Tf ${margen} ${
      y - fuenteTitulo
    } Td (${sanear(titulo)}) Tj ET\n`;
    y -= fuenteTitulo + 20;

    lineasPagina.forEach((linea) => {
      let x = margen;
      linea.forEach((celda) => {
        flujo += `BT /F1 ${fuenteTabla} Tf ${x.toFixed(2)} ${y.toFixed(
          2
        )} Td (${sanear(celda)}) Tj ET\n`;
        x += anchoColumna;
      });
      y -= altoFila;
    });

    return flujo;
  };

  const objetos = [];
  objetos.push("<< /Type /Catalog /Pages 2 0 R >>");
  // El objeto 2 (Pages) se rellena cuando sepamos el número de páginas.
  const totalObjetos = 3 + paginas.length * 2;
  const kids = paginas.map(
    (_, i) => `${4 + i * 2} 0 R`
  );
  objetos.push(
    `<< /Type /Pages /Kids [${kids.join(
      " "
    )}] /Count ${paginas.length} >>`
  );
  objetos.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  );

  paginas.forEach((lineasPagina) => {
    const numeroPagina = objetos.length + 1;
    const numeroContenido = numeroPagina + 1;
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${anchoPagina} ${altoPagina}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${numeroContenido} 0 R >>`
    );
    const flujo = contenidoPagina(lineasPagina);
    objetos.push(`__STREAM__${flujo}`);
  });

  const partes = [];
  const offsets = [];
  let cursor = 0;

  const cabecera = Buffer.from("%PDF-1.4\n", "latin1");
  partes.push(cabecera);
  cursor += cabecera.length;

  objetos.forEach((cuerpo, indice) => {
    const numeroObjeto = indice + 1;
    offsets.push(cursor);

    let bufferObjeto;
    if (cuerpo.startsWith("__STREAM__")) {
      const datos = cuerpo.slice("__STREAM__".length);
      const datosBuffer = Buffer.from(datos, "latin1");
      bufferObjeto = Buffer.concat([
        Buffer.from(
          `${numeroObjeto} 0 obj\n<< /Length ${datosBuffer.length} >>\nstream\n`,
          "latin1"
        ),
        datosBuffer,
        Buffer.from("\nendstream\nendobj\n", "latin1")
      ]);
    } else {
      bufferObjeto = Buffer.from(
        `${numeroObjeto} 0 obj\n${cuerpo}\nendobj\n`,
        "latin1"
      );
    }

    partes.push(bufferObjeto);
    cursor += bufferObjeto.length;
  });

  const inicioXref = cursor;
  let xref = `xref\n0 ${totalObjetos + 1}\n`;
  xref += "0000000000 65535 f \n";
  offsets.forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${
    totalObjetos + 1
  } /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;

  partes.push(Buffer.from(xref, "latin1"));

  return Buffer.concat(partes);
}

// Despacha la respuesta de exportación según el formato solicitado.
function enviarReporte(res, formato, nombreBase, titulo, columnas, filas) {
  if (formato === "excel") {
    const buffer = construirExcel(nombreBase, columnas, filas);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreBase}.xlsx"`
    );
    return res.status(200).send(buffer);
  }

  const buffer = construirPdf(titulo, columnas, filas);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${nombreBase}.pdf"`
  );
  return res.status(200).send(buffer);
}

module.exports = {
  construirExcel,
  construirPdf,
  enviarReporte
};
