const pg = require("pg");
const fs = require("fs");
const logger = require("../../middleware/winston");
let pg_cert = "";
try {
  pg_cert = fs.readFileSync(`./pg-certs/${process.env.APP_ENV || "development"}.crt`).toString();
} catch (error) {
  logger.error("Error reading pg certificate file");
}
const db_config = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "perceptively-smiling-woodlouse.data-1.use1.tembo.io",
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASSWORD || "Y7W5NDCAsVc7x8xL",
  port: 5432,
  max: 10,
  ssl: {
		ca: pg_cert,
	},
};

let db_connection;

function startConnection() {
  // type parsers here
  pg.types.setTypeParser(1082, function (stringValue) {
    return stringValue; // 1082 is for date type
  });

  db_connection = new pg.Pool(db_config);

  db_connection.connect((err, client) => {
    if (!err) {
      logger.info("PostgreSQL Connected");
    } else {
      logger.error("PostgreSQL Connection Failed");
    }
  });

  db_connection.on("error", (err, client) => {
    logger.error("Unexpected error on idle client");
    startConnection();
  });
}

startConnection();

module.exports = db_connection;
