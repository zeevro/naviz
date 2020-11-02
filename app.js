window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js");
  }
});

var points = [];

fetch('points.json')
  .then(response => response.json())
  .then(json => { points = json; });

var lastAngle = 0;
var arrow = document.getElementById('arrow');

function rotateArrow(deg) {
  arrow.setAttribute('transform', 'rotate(' + deg + ' 100 100)')
}

function newAngle(deg) {
  console.log('newAngle(' + deg + ') lastAngle=' + lastAngle);
  if (lastAngle > 180 && deg < 180) {
    arrow.classList.remove('transition');
    rotateArrow(lastAngle - 360);
    setTimeout(()=> {
      arrow.classList.add('transition')
      rotateArrow(deg);
    } , 1);
  } else if (lastAngle < 180 && deg > 180) {
    arrow.classList.remove('transition');
    rotateArrow(lastAngle + 360);
    setTimeout(()=> {
      arrow.classList.add('transition')
      rotateArrow(deg);
    } , 1);
  } else {
    rotateArrow(deg);
  }
  lastAngle = deg;
}

// setInterval(() => {
//   newAngle((lastAngle + 360 + 30) % 360);
// }, 500);

navigator.geolocation.watchPosition(
  position => {
    console.log(position.coords.latitude, position.coords.longitude, position.coords.speed, position.coords.heading);
    document.getElementById('location').innerHTML = position.coords.latitude + ', ' + position.coords.longitude
    document.getElementById('speed').innerHTML = position.coords.speed
    document.getElementById('heading').innerHTML = position.coords.heading
    var angle = position.coords.heading;
    if (angle === null || angle === NaN || angle === undefined) return;
    newAngle(angle);
  },
  console.warn,
  {
    enableHighAccuracy: true,
    maximumAge: 0
  }
);