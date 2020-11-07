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
  // if (wpid === null && currentCoords !== null) {
  //   wpid = waypointSelect.firstChild.value;
  //   currentWaypointId = wpid;
  // }
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
  document.getElementById('location').innerHTML = currentCoords.latitude.toFixed(6) + ',' + currentCoords.longitude.toFixed(6);
  document.getElementById('speed').innerHTML = formatNumber(km2mile(currentCoords.speed)) + ' mph';
  document.getElementById('heading').innerHTML = Math.round(currentCoords.heading) + '&deg;';
  if (currentWaypointId === null || currentCoords === null) return;
  var waypoint = points[currentWaypointId];
  var bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, waypoint.lat, waypoint.lon) - currentCoords.heading;
  var distance = km2mile(GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, waypoint.lat, waypoint.lon));
  document.getElementById('bearing').innerHTML = Math.round(bearing + 360) % 360 + '&deg;';
  document.getElementById('distance').innerHTML = formatNumber(distance) + ' m';
  newAngle(bearing);
}

waypointSelect.addEventListener('change', function() {
  currentWaypointId = this.value;
  updateNavData();
});

waypointSelect.addEventListener('click', sortWaypoints);

navigator.geolocation.watchPosition(
  position => {
    currentCoords = position.coords;
    console.log(currentCoords.latitude, currentCoords.longitude, currentCoords.speed, currentCoords.heading);
    if (currentWaypointId === null) {
      sortWaypoints();
      currentWaypointId = waypointSelect.value = waypointSelect.firstChild.value;
    }
    updateNavData();
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
