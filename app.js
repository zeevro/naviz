window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js");
  }
});

document.querySelectorAll('.modal .close').forEach(elem => {
  elem.addEventListener('click', e => {
    e.target.closest('.modal').classList.remove('active');
  })
});

document.getElementById('waypointList').addEventListener('click', e => {
  e.target.closest('.modal').classList.remove('active');
  currentWaypoint = e.target.dataset;
  updateNavData();
})

var currentCoords = null;
var currentAngle = 0;
var currentWaypoint = null;

fetch('points.json')
  .then(response => response.json())
  .then(points => {
    let listContainer = document.getElementById('waypointList');
    points.sort((a, b) => a.name.localeCompare(b.name));
    points.forEach(p => {
      let elem = document.createElement('div');
      elem.classList.add('waypoint')
      Object.assign(elem.dataset, p);
      elem.innerText = p.name;
      let arrow = document.createElement('div');
      arrow.classList.add('arrow');
      arrow.innerHTML = '&uarr;'
      elem.appendChild(arrow);
      // let distance = document.createElement('span');
      // distance.classList.add('distance');
      // elem.appendChild(distance);
      listContainer.appendChild(elem);
    })
  });

function km2mile(x) {
  return x * 0.621371;
}

function pad2(n) {
  return ('0' + n).substr(-2);
}

function etaStr(speed, distance) {
  if (!speed || !distance) return '--';
  let eta = Math.round(speed / distance);
  let ret = pad2(eta % 60) + 's';
  if (eta = Math.floor(eta / 60)) {
    ret = pad2(eta % 60) + 'm' + ret;
    if (eta = Math.floor(eta / 60)) {
      ret = (eta % 60) + 'h' + ret;
    }
  }
  return ret;
}

function showWaypointSelector() {
  if (currentCoords !== null) {
    let waypointElems = document.querySelectorAll('div.waypoint');
    waypointElems.forEach(elem => {
      let distance = GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, elem.dataset.lat, elem.dataset.lon);
      let bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, elem.dataset.lat, elem.dataset.lon) - currentCoords.heading;
      elem.style.order = Math.round(distance * 10000);
      elem.querySelector('.arrow').style.transform = 'rotate(' + bearing + 'deg)';
      // elem.querySelector('.distance').innerHTML = '(' + formatNumber(km2mile(distance)) + '&nbsp;mi)';
    });
  }
  document.getElementById('waypointSelectorModal').classList.add('active');
}

function formatNumber(n) {
  return Math.round(n * 100) / 100;
}

function rotateArrow(deg) {
  document.getElementById('arrow').setAttribute('transform', 'rotate(' + deg + ' 100 100)');
}

function newAngle(deg) {
  console.log('newAngle(' + deg + ') currentAngle=' + currentAngle);
  let arrow = document.getElementById('arrow');
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
  document.getElementById('position').innerHTML = currentCoords.latitude.toFixed(6) + ',' + currentCoords.longitude.toFixed(6);
  document.getElementById('speed').innerHTML = formatNumber(km2mile(currentCoords.speed)) + ' mph';
  document.getElementById('heading').innerHTML = Math.round(currentCoords.heading) + '&deg;';

  if (currentWaypoint === null) return;
  document.getElementById('waypoint').innerHTML = currentWaypoint.name;

  if (currentCoords === null) return;
  let bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, currentWaypoint.lat, currentWaypoint.lon) - currentCoords.heading;
  let distance = km2mile(GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, currentWaypoint.lat, currentWaypoint.lon));
  document.getElementById('bearing').innerHTML = Math.round(bearing + 360) % 360 + '&deg;';
  document.getElementById('distance').innerHTML = formatNumber(distance) + ' mi';
  document.getElementById('eta').innerHTML = etaStr(currentCoords.speed, distance);
  newAngle(bearing);
}

// waypointSelect.addEventListener('change', e => {
//   currentWaypointId = e.target.value;
//   updateNavData();
// });

// waypointSelect.addEventListener('click', sortWaypoints);

document.getElementById('hsiView').addEventListener('click', showWaypointSelector);

navigator.geolocation.watchPosition(
  position => {
    currentCoords = position.coords;
    console.log(currentCoords.latitude, currentCoords.longitude, currentCoords.speed, currentCoords.heading);
    // if (currentWaypointId === null) {
    //   sortWaypoints();
    //   currentWaypointId = waypointSelect.value = waypointSelect.firstChild.value;
    // }
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
