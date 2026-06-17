import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = new URL(process.env.DATABASE_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
});

console.log("✅ Conexión exitosa a BD");

const [rows] = await connection.execute("SELECT COUNT(*) as usuarios FROM user;");
console.log("Usuarios en BD:", rows[0].usuarios);

const [users] = await connection.execute("SELECT email, role FROM user;");
console.log("Usuarios:", users);

await connection.end();
