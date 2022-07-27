const mysql = require('mysql');


let conn = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database: 'bdgps'
});

try {
    conn.connect();
    console.log('Connexion au serveur Mysql reussie')
} catch (error) {
    console.log('Error : ', error);
    
}
module.exports = conn;