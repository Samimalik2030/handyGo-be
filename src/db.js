const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "sami",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "my_new_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ Pool created successfully");

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database Connected Successfully!");
    connection.release();
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
  }
}

// Call function explicitly
testDatabaseConnection();

module.exports = { pool };
