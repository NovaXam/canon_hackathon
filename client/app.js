let socket;

$(document).ready(() => {

  socket = io();
  setup(socket);
});

function setup(socket) {
  // update stream on page
  socket.on('cameraSnap', updateImage);
  socket.on('connect', () => {
    console.log('client has connected to the server');
    socket.emit('sendStatus', true);
  });
}

function updateImage(data) {
  // handle data here.
  var ctx = document.getElementById('canvas').getContext('2d');
  console.log(data);
  if (data.image) {
    var img = new Image();
    img.src = 'data:image/jpeg;base64,' + info.buffer;
    ctx.drawImage(img, 0, 0);
  }
}


// var params = {
//   // Request parameters
// };

// $.ajax({
//   url: "https://eastus2.api.cognitive.microsoft.com/face/v1.0/facelists/shurouq?" + $.param(params),
//   beforeSend: function (xhrObj) {
//     // Request headers
//     xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "a48fab4bcaf247f7b039a816609a2ae2");
//   },
//   type: "GET",
//   // Request body
//   data: {},
// })
//   .done(function (data) {
//     console.log(data);
//   })
//   .fail(function () {
//     alert("error");
//   });
