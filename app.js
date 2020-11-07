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
var currentWaypointId = null;

fetch('points.json')
  .then(response => response.json())
  .then(json => {
    points = json;

    sortWaypoints();
  });

function km2mile(x) {
  return x * 0.621371;
}

function sortWaypoints() {
  let wpid = currentWaypointId;
  let sortFunc = currentCoords === null ? (a, b) => a.name.localeCompare(b.name) : (a, b) => GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, a.lat, a.lon) - GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, b.lat, b.lon);
  let tempPoints = points.slice();
  tempPoints.forEach((p, i) => p.id = i);
  tempPoints.sort(sortFunc);
  waypointSelect.innerHTML = '';
  tempPoints.forEach(function (p) {
    var opt = document.createElement('option');
    opt.innerHTML = p.name;
    opt.value = p.id;
    waypointSelect.appendChild(opt);
  });
  waypointSelect.value = wpid;
}

function formatNumber(n) {
  return Math.round(n * 100) / 100;
}

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
  if (currentWaypointId === null || currentCoords === null) return;
  var waypoint = points[currentWaypointId];
  var bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, waypoint.lat, waypoint.lon) - (currentCoords.heading || 0);
  var distance = km2mile(GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, waypoint.lat, waypoint.lon));
  document.getElementById('bearing').innerHTML = Math.round(bearing) + '&deg;';
  document.getElementById('distance').innerHTML = formatNumber(distance) + ' m';
  newAngle(bearing);
  sortWaypoints();
}

waypointSelect.addEventListener('change', function() {
  currentWaypointId = this.value;
  updateNavData();
});

navigator.geolocation.watchPosition(
  position => {
    currentCoords = position.coords;
    console.log(currentCoords.latitude, currentCoords.longitude, currentCoords.speed, currentCoords.heading);
    document.getElementById('location').innerHTML = currentCoords.latitude.toFixed(6) + ',' + currentCoords.longitude.toFixed(6);
    document.getElementById('speed').innerHTML = formatNumber(km2mile(currentCoords.speed || 0)) + ' mph';
    document.getElementById('heading').innerHTML = Math.round(currentCoords.heading || 0) + '&deg;';
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
