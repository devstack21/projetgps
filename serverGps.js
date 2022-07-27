const express = require('express') , bodyParser = require('body-parser');
// definition de l'instance server ou l'app server 
const app = express();
// definition du module socket.io
const http = require('http').Server(app);
const io = require('socket.io')(http);
// definition du port 
const PORT = process.env.PORT || 4567;
// definition du middlieware pour l'interception des requetes et les logs_url
const getUrlRequest = async(req , res) =>{

    try {
        let urlClient = await req.url
        console.log('URL_REQUEST_CLIENT : ', urlClient);
    } catch (error) {
        return res.status(400).json({
            statut : true , 
            message : error
        });
    }
};
// connexion a la base de donnée MYSQL 
const conn = require('./dbconnect/connect');
// id ws admin
let adminId = null , wsAdmin = {} , wsUser = {};
// implementation des middlewares 

app
    .use(getUrlRequest)
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended : true
    }))
    // defintion des differentes routes 
    // enregistrement du client 
    .post('enregistrement-client' , (req , res) =>{
        // req.body : données envoyées depuis le front end
        conn.query('INSERT INTO client SET ?' , req.body, (err , result) =>{
            if(err) return res.status(400).json({
                statut : false ,
                message : err,
            });
            else {
                console.log('Enregistrement du client reussie');
                res.status(200).json({
                    statut : true,
                    data : result.id,
                    message : "Enregistrement du client reussie" ,
                });
            }
        });
    })
    // envoie des données recues et stockées dans la bd au client
    //methode GET
    .get('envoi-data' , (req , res) =>{
        // recuperation des données dans la base de donnée a la table dataanimal 
        conn.query('SELECT * from dataanimal ' , (err , result) =>{
            if(err) return res.status(400).json({
                statut : false,
                message : err
            });
            else res.status(200).json({
                statut : true , 
                message : 'succes de la requete GET',
                data : result
            });
        });
    })
    // envoie des messages entre client et l'admin
    io
      .on('connection' , (socket) =>{
    
        // log id client - admin
        // evenement lié au lancement de l'application coté administrateur (au demarrage)
        socket.on('admin' , (id) =>{
            // id correspond a l'id de l'administrateur dans la base de donnée 
            wsAdmin[id] = socket;
            adminId = id;
        });
        socket.on('message-client' , (data) =>{
            /*
                data = {
                    message : String 
                    idClient integer
                }
            */
           // definition de l'id user et de son socket 
           wsUser[data.idClient] = socket;
           // definition de l'ovjet Date
           let time = new Date();
           // envoie message a l'administrateur
            wsAdmin[adminId].emit('admin' , {message : data.message , idClient : data.idClient});
            // insertion des données dans la table chat
            conn.query('INSERT INTO chat SET ? ', {
                "contenuChat" : data.message,
                "dateHeure" : time.getDate()+'/'+time.getMonth()+'/'+time.getFullYear()+'-'+time.getHours()+'h'+time.getMinutes(),
                "idClient" : data.idClient,
                "idAdmin" : adminId
            },
            (err ,result) =>{
                if(err) throw err
                else console.log('Chat enregistré');
            });

        });
        // reponse de l'administrateur au client 
        socket.on('reponse-admin' , (data) =>{
            /*
                data = {
                    message String 
                    idClient Integer
                }
            */
           wsUser[data.idClient].emit('send-client' , data.message);

        });
      });

http.listen(PORT , () =>{
        console.log('Lancement du serveur sur le port ' , PORT);
    });
