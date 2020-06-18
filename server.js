/*jshint esversion: 6 */
net = require('net');     // TCP lib :

// Un nouveau canal d'évènements
const EventEmitter = require('events');
class Chat extends EventEmitter{}
const ChatEvent = new Chat();

// Liste des clients (bon ok, en Node, on a aussi la fonction : server.getConnections() mais bon...)
var clients = [];

// Serveur TCP
net.createServer(function (socket) {

  ChatEvent.emit('connect', socket);    // Evenement de nouvelle connexion

  socket.on('data', function (data) {   // Quand on reçoit des données
    socket.data = data;                 // On met les données dans ce socket sous "data"
    ChatEvent.emit('msg', socket);      // Evenement de nouveau message (on considère que la donnée reçue est un message)
  });

  socket.on('timeout', function () {    // Quand quelqu'un se prend un timeout dans la tronche
    ChatEvent.emit('timeout', socket);  // Evenement de connexion en timeout
  });

  socket.on('end', function () {        // Quand une connexion est fermée
    ChatEvent.emit('end', socket);      // Evenement de fin de connexion
  });

// Bon aller on écoute le port 666, c'est bien 666, C'est le port du jeu Doom
}).listen(666);

ChatEvent.on('connect', (socket) => {   // Quand on chope une nouvelle connexion
  // On donne un nom au socket, c'est pratique
  socket.name = socket.remoteAddress + ":" + socket.remotePort;
  // On ajoute un pseudo vide
  socket.pseudo = false;
  // On ajoute cette connexion à notre tableau des connexions active
  clients.push(socket);
  // On écrit le message de bienvenue
  socket.write("Welcome " + socket.name + "\r\nPlease set your pseudo with #pseudo=my_pseudo\r\n");
  // On prévient tout le monde que y'a un nouveau
  broadcast(socket.name + " joined the chat\r\n", socket);
  // On définit un tiemout pour éviter qu'un vilain de la NSA se pose en écoute dans notre super-chat !
  socket.setTimeout(2*60*60*1000); // en milli-secondes
});

// Quand on chope un nouveau message
ChatEvent.on('msg', (socket) => {
  var msg = socket.data.toString('ascii');
  if (msg.indexOf('#pseudo=') !== -1){
    // Changement de pseudo
    socket.pseudo = socket.data.toString('ascii').split('#pseudo=')[1].replace('\r','').replace('\n','');
    broadcast(socket.name + " has now pseudo "+socket.pseudo+'\r\n');
  }else{
    // On l'envoit à tout le monde
    if (socket.pseudo){
      broadcast(socket.pseudo + "> " + msg, socket);
    }else{
      broadcast(socket.name + "> " + msg, socket);
    }
  }
});

// Quand on chope un timeout
ChatEvent.on('timeout', (socket) => {
  // On ferme tout ca
  socket.end();
});

// Quand on chope une connexion qui se termine
ChatEvent.on('end', (socket) => {
  // On supprime du tableau des connexions actives
  clients.splice(clients.indexOf(socket), 1);
  // On prévient que untel s'est barré
  if (socket.pseudo){
    broadcast(socket.pseudo + " left the chat.\r\n");
  }else{
    broadcast(socket.name + " left the chat.\r\n");
  }
});

// Le fameux broadcast de la mort qui tue !
  function broadcast(message, sender) {
    // Pour nos clients actifs
    clients.forEach(function (client) {
      // Si c'est l'envoyeur, on ne lui renvoie pas
      if (client === sender) return;
      // Si c'est un autre, on lui envoie le message
      client.write(message);
    });
    // Et on log le message .... NSA Style
    // Vous chauffez pas : Je ne fait que l'afficher à la console  :-)
    process.stdout.write(message)
  }

// On prévient dès que le serveur est opé
console.log("Chat server running on port 666\r\n");
