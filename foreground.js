let waitingTime = document.querySelector(".thankyou-time");
let currentTime = new Date();
currentTime = currentTime.toLocaleTimeString([], {hour: 'numeric', hour12: false});

alert(waitingTime.textContent + ' ' + currentTime)