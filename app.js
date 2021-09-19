window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});

var currentCoords = null;
var currentWaypoint = null;

function loadWaypoints() {
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
}

function mps2kmph(x) {
  return x * 3.6;
}

function km2mile(x) {
  return x / 1.60934;
}

function m2ft(x) {
  return x * 3.28084;
}

function unitValue(value, unit, wbr) {
  return value + (wbr ? '<wbr>' : '') + '<span class="unit">' + unit + '</span>';
}

function etaStr(distance, speed) {
  if (!distance || !speed) return '--';
  speed /= 3600; // Speed is given in mph but we need seconds
  let eta = Math.round(distance / speed);
  let ret = (eta < 3600) ? unitValue(eta % 60, 's') : '';
  if (eta = Math.floor(eta / 60)) {
    ret = unitValue(eta % 60, 'm') + '<wbr>' + ret;
    if (eta = Math.floor(eta / 60)) {
      ret = unitValue(eta % 60, 'h') + '<wbr>' + ret;
    }
  }
  return ret;
}

function showWaypointPicker() {
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
  filterWaypoints('');
  document.getElementById('waypointSearch').value = '';
  document.getElementById('waypointList').scrollTop = 0;
  document.getElementById('waypointPickerModal').classList.add('active');
}

function filterWaypoints(text) {
  text = text.trim()
  let waypoints = document.querySelectorAll('.waypoint');
  if (!text.length) {
    waypoints.forEach(elem => elem.classList.remove('hide'));
    return;
  }
  waypoints.forEach(elem => {
    if (elem.dataset.name.match(text)) elem.classList.remove('hide');
    else elem.classList.add('hide');
  });
}

function formatNumber(n, decimals) {
  if (Number(decimals) != decimals) decimals = 2;
  let exp = 10 ** decimals;
  return Math.round(n * exp) / exp;
}

function rotateArrow(deg) {
  document.getElementById('arrow').setAttribute('transform', 'rotate(' + deg + ' 100 100)');
}

function updateNavData() {
  let speed =  km2mile(mps2kmph(currentCoords.speed));
  document.getElementById('speed').innerHTML = currentCoords.speed === null ? '--' : unitValue(formatNumber(speed, 1), 'mph', true);
  document.getElementById('heading').innerHTML = currentCoords.heading === null ? '--' : Math.round(currentCoords.heading) + '&deg;';
  document.getElementById('altitude').innerHTML = currentCoords.altitude === null ? '--' : unitValue(Math.round(m2ft(currentCoords.altitude)), 'ft', true);

  if (currentWaypoint === null) {
    document.getElementById('waypointBtn').innerHTML = 'Waypoint';
  } else {
    document.getElementById('waypointBtn').innerHTML = currentWaypoint.name;
  }

  if (currentWaypoint === null || currentCoords === null) {
    document.getElementById('bearing').innerHTML = '--';
    document.getElementById('distance').innerHTML = '--';
    document.getElementById('eta').innerHTML = '--';
    rotateArrow(0);
  } else {
    let bearing = GreatCircle.bearing(currentCoords.latitude, currentCoords.longitude, currentWaypoint.lat, currentWaypoint.lon) - currentCoords.heading;
    let distance = km2mile(GreatCircle.distance(currentCoords.latitude, currentCoords.longitude, currentWaypoint.lat, currentWaypoint.lon));
    document.getElementById('bearing').innerHTML = Math.round(bearing + 360) % 360 + '&deg;';
    document.getElementById('distance').innerHTML = unitValue(formatNumber(distance), 'mi', true);
    document.getElementById('eta').innerHTML = etaStr(distance, speed);
    rotateArrow(bearing);
  }
}

function startLocationWatcher() {
  navigator.geolocation.watchPosition(
    position => {
      // currentCoords = position.coords;
      currentCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        speed: position.coords.speed >= 1 ? position.coords.speed : 0,
        heading: position.coords.speed >= 1 ? position.coords.heading : 0
      }
      updateNavData();
    },
    console.error,
    {
      enableHighAccuracy: true,
      maximumAge: 0
    }
  );
}

function handleLocationPermission(permissionStatus) {
  if (permissionStatus.state == 'granted') {
    startLocationWatcher();
    return;
  }

  permissionStatus.addEventListener('change', e => handleLocationPermission(e.target));

  if (permissionStatus.state == 'prompt') {
    document.getElementById('locationPermissionBtn').addEventListener('click', e => {
      e.target.closest('.modal').classList.remove('active');
      navigator.geolocation.getCurrentPosition(() => null);
    });
    document.getElementById('locationPermissionModal').classList.add('active');
    return;
  }

  // permissionStatus.state == 'denied'
  document.getElementById('locationPermissionDeniedModal').classList.add('active');

  navigator.geolocation.getCurrentPosition(() => null, () => document.getElementById('locationPermissionModal').classList.add('active'));
}

function initApp() {
  document.querySelectorAll('.modal .close').forEach(elem => {
    elem.addEventListener('click', e => {
      e.target.closest('.modal').classList.remove('active');
    })
  });

  document.querySelector('#waypointPickerModal .reset').addEventListener('click', e => {
    currentWaypoint = null;
    updateNavData();
  });

  document.getElementById('waypointList').addEventListener('click', e => {
    e.target.closest('.modal').classList.remove('active');
    currentWaypoint = e.target.dataset;
    updateNavData();
  })

  document.getElementById('waypointSearch').addEventListener('input', e => {
    filterWaypoints(e.target.value);
  })

  document.getElementById('waypointBtn').addEventListener('click', showWaypointPicker);

  loadWaypoints();

  navigator.permissions.query({name: 'geolocation'}).then(handleLocationPermission);

  if ('wakeLock' in navigator) wakeLock = navigator.wakeLock.request('screen').catch(console.error);
}

initApp();
