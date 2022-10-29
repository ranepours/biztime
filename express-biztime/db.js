/** Database setup for BizTime.
 * 
 * fix db.js so that it connects to db and exports the client object
 * 
 */
const { Client } = require("pg");
const client = new Client(
    { connectionString: "postgresql:///biztime" }
);
client.connect();

module.exports = client;