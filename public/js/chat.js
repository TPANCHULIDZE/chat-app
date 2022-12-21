const socket = io();

const $messageForm = document.getElementById("messageForm");
const $messageInputForm = document.getElementById("message");
const $sendLocationForm = document.getElementById("sendLocation");
const $messageContainer = document.getElementById("message-container");

const sidebar = document.getElementById('sidebar-template').innerHTML;
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTamplate = document.getElementById("location-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messageContainer.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messageContainer.offsetHeight

  // Height of messages container
  const containerHeight = $messageContainer.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messageContainer.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
      $messageContainer.scrollTop = $messageContainer.scrollHeight
  }
}


socket.on("writeMessage", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messageContainer.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

$messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = $messageInputForm.value;
  $messageInputForm.value = "";
  $messageForm.setAttribute("disabled", "disabled");
  $messageInputForm.focus();

  socket.emit("sendMessage", message, (error) => {
    $messageForm.removeAttribute("disabled");

    if (error) {
      return console.log(error);
    }
    console.log("Message delevered successfully");
  });
});

socket.on("writeLocation", (location) => {
  console.log(location);

  const html = Mustache.render(locationTamplate, {
    username: location.username,
    url: location.url,
    createdAt: moment(location.createdAt).format("h:mm a"),
  });
  $messageContainer.insertAdjacentHTML("beforeend", html);
  autoscroll();
});


socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebar, {room, users});
  document.getElementById('sidebar').innerHTML = html;
})

$sendLocationForm.addEventListener("click", () => {
  $sendLocationForm.setAttribute("disabled", "disabled");

  if (!navigator.geolocation) {
    return alert("Your Brawser not support geolocation");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "location",
      { lat: position.coords.latitude, long: position.coords.longitude },
      () => {
        $sendLocationForm.removeAttribute("disabled");
        console.log("Location Shared");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert("User is already in chat");
    location.href = "/";
  }
});
