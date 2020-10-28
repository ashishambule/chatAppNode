const express = require('express');
const app = express();
const dateTime = require('simple-datetime-formater');
const bodyParser = require('body-parser');
const chatRouter = require('./route/chatroute');

const http = require('http').Server(app);

const io = require('socket.io');

const port = 3000;

app.use(bodyParser.json());

//routes
app.use('/chats', chatRouter);

app.use(express.static(__dirname + '/public'));

socket = io(http);

//database connection
const Chat = require('./models/Chat');
const connect = require('./dbconnect');

//setup event listener
socket.on('connection', (socket) => {
  console.log('user connected');

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });

  //Someone is typing
  socket.on('typing', (data) => {
    socket.broadcast.emit('notifyTyping', {
      user: data.user,
      message: data.message,
    });
  });

  //when soemone stops typing
  socket.on('stopTyping', () => {
    socket.broadcast.emit('notifyStopTyping');
  });

  socket.on('chat message', function (msg) {
    console.log('message: ' + msg);

    //broadcast message to everyone in port:3000 except yourself.
    socket.broadcast.emit('received', { message: msg });

    //save chat to the database
    connect.then((db) => {
      console.log('connected correctly to the server');
      let chatMessage = new Chat({ message: msg, sender: 'User' });

      chatMessage.save();
    });
  });
});

http.listen(port, () => {
  console.log('Running on Port: ' + port);
});
