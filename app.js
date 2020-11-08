window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js");
  }
});

var currentCoords = null;
var currentAngle = 0;
var currentWaypoint = null;

document.querySelectorAll('.modal .close').forEach(elem => {
  elem.addEventListener('click', e => {
    e.target.closest('.modal').classList.remove('active');
  })
});

document.querySelector('#waypointpickerModal .reset').addEventListener('click', e => {
  currentWaypoint = null;
  updateNavData();
});

document.getElementById('waypointList').addEventListener('click', e => {
  e.target.closest('.modal').classList.remove('active');
  currentWaypoint = e.target.dataset;
  updateNavData();
})

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

function showWaypointpicker() {
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
  document.getElementById('waypointList').scrollTop = 0;
  document.getElementById('waypointpickerModal').classList.add('active');
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
  document.getElementById('speed').innerHTML = currentCoords.speed === null ? '--' : formatNumber(km2mile(currentCoords.speed)) + ' mph';
  document.getElementById('heading').innerHTML = currentCoords.heading === null ? '--' : Math.round(currentCoords.heading) + '&deg;';

  if (currentWaypoint === null) {
    document.getElementById('waypointBtn').innerHTML = 'Waypoint';
  } else {
    document.getElementById('waypointBtn').innerHTML = currentWaypoint.name;
  }

  if (currentWaypoint === null || currentCoords === null) {
    document.getElementById('bearing').innerHTML = '--';
    document.getElementById('distance').innerHTML = '--';
    document.getElementById('eta').innerHTML = '--';
    newAngle(0);
  } else {
    let bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, currentWaypoint.lat, currentWaypoint.lon) - currentCoords.heading;
    let distance = km2mile(GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, currentWaypoint.lat, currentWaypoint.lon));
    document.getElementById('bearing').innerHTML = Math.round(bearing + 360) % 360 + '&deg;';
    document.getElementById('distance').innerHTML = formatNumber(distance) + ' mi';
    document.getElementById('eta').innerHTML = etaStr(currentCoords.speed, distance);
    newAngle(bearing);
  }
}

document.getElementById('waypointBtn').addEventListener('click', showWaypointpicker);

navigator.geolocation.watchPosition(
  position => {
    currentCoords = position.coords;
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
