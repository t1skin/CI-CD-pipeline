import { Pool, PoolClient, PoolConfig, types } from 'pg';
import fs from 'fs';
import logger from '../../middleware/winston';

let pg_cert = '';
try {
  pg_cert = fs
    .readFileSync(`./pg-certs/${process.env.CERT_NAME || 'development'}.crt`)
    .toString();
} catch (error) {
  logger.error('Error reading pg certificate file');
}

const db_config: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host:
    process.env.DB_HOST ||
    'perceptively-smiling-woodlouse.data-1.use1.tembo.io',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Y7W5NDCAsVc7x8xL',
  port: 5432,
  max: 10,
  ssl: {
    ca: pg_cert,
  },
};

let db_connection: Pool;

function startConnection(): void {
  // type parsers here
  types.setTypeParser(1082, (stringValue: string) => {
    return stringValue; // 1082 is for date type
  });

  db_connection = new Pool(db_config);

  db_connection.connect((err: Error | null, client: PoolClient) => {
    if (!err) {
      logger.info('PostgreSQL Connected');
    } else {
      logger.error('PostgreSQL Connection Failed', err);
    }
    client.release();
  });

  db_connection.on('error', (err: Error) => {
    logger.error('Unexpected error on idle client', err);
    startConnection();
  });
}

const closePool = async (): Promise<void> => {
  if (db_connection) {
    await db_connection.end();
    db_connection = undefined;
    logger.info('Database pool closed');
  }
};

startConnection();

export default db_connection;
export { closePool };
