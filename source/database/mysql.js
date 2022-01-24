const MySQLSettings = require("../../settings/mysql");

const MySQL = require("mysql2");

const MySQLConnection = MySQL.createConnection({
    database: MySQLSettings.Name,
    host    : MySQLSettings.Host,
    port    : MySQLSettings.Port,
    user    : MySQLSettings.User,
    password: MySQLSettings.Pass,
});

MySQLConnection.connect((error) => {
    if (error) {
        console.log(("[MySQLDB]"), ("Unable to connect with the MySQL server"));
        console.log(("[MySQLDB]"), error.message ? error.message : error);
    } else {
        console.log(("[MySQLDB]"), ("MySQL server connection established"));
    };
});

module.exports = MySQLConnection;