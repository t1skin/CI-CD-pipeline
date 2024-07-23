import path from 'path';
import { config } from 'dotenv';
import startApp from './boot/setup';

let env_path: string = path.join(__dirname, '../.env.development');

if (process.env.APP_ENV) {
  env_path = path.join(__dirname, `../.env.${process.env.APP_ENV}`);
}
config({ path: env_path });

((): void => {
  try {
    startApp();
  } catch (error) {
    console.log('Error in index.js => startApp');
    console.log(`Error; ${JSON.stringify(error, undefined, 2)}`);
  }
})();
