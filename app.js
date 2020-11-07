window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js");
  }
});

var points = [];
var currentCoords = null;
var currentAngle = 0;
var arrow = document.getElementById('arrow');
var waypointSelect = document.getElementById('waypoint');

fetch('points.json')
  .then(response => response.json())
  .then(json => {
    points = json;

    points.forEach((point, i) => {
      var opt = document.createElement('option');
      opt.innerHTML = point.name;
      opt.value = i;
      waypointSelect.appendChild(opt);
    });
  });

function rotateArrow(deg) {
  arrow.setAttribute('transform', 'rotate(' + deg + ' 100 100)')
}

function newAngle(deg) {
  console.log('newAngle(' + deg + ') currentAngle=' + currentAngle);
  // if (currentAngle > 180 && deg < 180) {
  //   arrow.classList.remove('transition');
  //   rotateArrow(currentAngle - 360);
  //   setTimeout(()=> {
  //     arrow.classList.add('transition')
  //     rotateArrow(deg);
  //   } , 1);
  // } else if (currentAngle < 180 && deg > 180) {
  //   arrow.classList.remove('transition');
  //   rotateArrow(currentAngle + 360);
  //   setTimeout(()=> {
  //     arrow.classList.add('transition')
  //     rotateArrow(deg);
  //   } , 1);
  // } else {
  //   rotateArrow(deg);
  // }
  rotateArrow(deg);
  currentAngle = deg;
}

function updateNavData() {
  if (!waypointSelect.selectedOptions.length) return;
  var waypoint = points[waypointSelect.selectedOptions[0].value];
  var bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, waypoint.lat, waypoint.lon) - (currentCoords.heading || 0);
  var distance = GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, waypoint.lat, waypoint.lon);
  document.getElementById('bearing').innerHTML = bearing.toFixed(2);
  document.getElementById('distance').innerHTML = distance.toFixed(2) + ' km';
  newAngle(bearing);
}

waypointSelect.addEventListener('change', updateNavData);

navigator.geolocation.watchPosition(
  position => {
    currentCoords = position.coords;
    console.log(currentCoords.latitude, currentCoords.longitude, currentCoords.speed, currentCoords.heading);
    document.getElementById('location').innerHTML = currentCoords.latitude.toFixed(6) + ',' + currentCoords.longitude.toFixed(6);
    document.getElementById('speed').innerHTML = (currentCoords.speed || 0).toFixed(2) + ' km/h';
    document.getElementById('heading').innerHTML = (currentCoords.heading || 0).toFixed(2) + '&deg;';
    updateNavData();
    var angle = position.coords.heading;
    if (angle === null || angle === NaN || angle === undefined) return;
    newAngle(angle);
  },
  console.error,
  {
    enableHighAccuracy: true,
    maximumAge: 0
  }
);

if ('wakeLock' in navigator) {
  wakeLock = navigator.wakeLock.request('screen').catch(console.error);
}
