const path = require("path");
let env_path = path.join(__dirname, "../.env.development");
if (process.env.APP_ENV) {
  env_path = path.join(__dirname, `../.env.${process.env.APP_ENV}`);
}
require("dotenv").config({ path: env_path });
const startApp = require("./boot/setup").startApp;

(() => {
  try {
    startApp();
  } catch (error) {
    console.log("Error in index.js => startApp");
    console.log(`Error; ${JSON.stringify(error, undefined, 2)}`);
  }
})();
