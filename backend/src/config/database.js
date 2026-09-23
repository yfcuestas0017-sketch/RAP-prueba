const { Pool } = require("pg");
require("dotenv").config();

// En Neon/producción se usa DATABASE_URL (una sola cadena de conexión).
// En local (pgAdmin/postgres en tu PC) se siguen usando las variables sueltas.
const useConnectionString = Boolean(process.env.DATABASE_URL);

const pool = useConnectionString
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    });

module.exports = pool;
