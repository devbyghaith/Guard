const MySQL = require("./mysql");

module.exports = class TableManager {
    constructor(table) {
        this.table = table;
    };

    fetchRows = (filter, limit, offset) => new Promise((resolve, reject) => {
        MySQL.query((`SELECT * FROM ${this.table}${filter ? (` WHERE ${Object.keys(filter).map((key) => (`\`${key}\`${filter[key] ? (`=${MySQL.escape(filter[key])}`) : " IS NULL"}`)).join(" AND ")}`) : ""}${limit ? (` LIMIT ${limit}`) : ""}${offset ? (` OFFSET ${offset}`) : ""};`), (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });

    doesRowExist = (filter) => new Promise((resolve, reject) => {
        MySQL.query((`SELECT EXISTS(SELECT * FROM ${this.table} WHERE ${Object.keys(filter).map((key) => (`\`${key}\`${filter[key] ? (`=${MySQL.escape(filter[key])}`) : " IS NULL"}`)).join(" AND ")} LIMIT 1) as doesExist;`), (error, result) => {
            if (error) reject(error);
            else resolve(result?.[0]?.doesExist);
        });
    });

    deleteRow = (filter) => new Promise((resolve, reject) => {
        MySQL.query((`DELETE FROM ${this.table} WHERE ${Object.keys(filter).map((key) => (`\`${key}\`${filter[key] ? (`=${MySQL.escape(filter[key])}`) : " IS NULL"}`)).join(" AND ")}`), (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });

    insertRow = (values) => new Promise((resolve, reject) => {
        MySQL.query((`INSERT INTO ${this.table} (${Object.keys(values).map((key) => (`\`${key}\``)).join(", ")}) VALUES (${Object.keys(values).map((key) => MySQL.escape(values[key])).join(", ")})`), (error, result) => {
            if (error) reject(error);
            else this.fetchRows({ Id: result.insertId }).then((results) => resolve(results[0])).catch(reject);
        });
    });

    updateRow = (filter, values) => new Promise((resolve, reject) => {
        this.doesRowExist(filter).then((doesExist) => {
            if (doesExist) {
                this.fetchRow(filter).then((row) => {
                    MySQL.query((`UPDATE ${this.table} SET ${Object.keys(values).map((key) => (`\`${key}\`=${MySQL.escape(values[key])}`)).join(", ")} WHERE ${Object.keys(filter).map((key) => (`${key}=${MySQL.escape(filter[key])}`)).join(" AND ")};`), (error, result) => {
                        if (error) reject(error);
                        else this.fetchRows({ Id: row.Id }).then((results) => resolve(results[0])).catch(reject);
                    });
                }).catch(reject);
            } else this.insertRow(values).then(resolve).catch(reject);
        }).catch(reject);
    });

    fetchRow = (filter) => new Promise((resolve, reject) => {
        this.doesRowExist(filter).then((doesExist) => {
            if (doesExist) this.fetchRows(filter, 1).then((results) => resolve(results[0])).catch(reject);
            else this.insertRow(filter).then(resolve).catch(reject);
        }).catch(reject);
    });
};