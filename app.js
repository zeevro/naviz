window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});

var currentCoords = null;
var currentAngle = 0;
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

function etaStr(distance, speed) {
  if (!distance || !speed) return '--';
  speed /= 3600; // Speed is given in mph but we need seconds
  let eta = Math.round(distance / speed);
  let ret = (eta < 3600) ? (eta % 60) + '<span class="unit">s</span>' : '';
  if (eta = Math.floor(eta / 60)) {
    ret = (eta % 60) + '<span class="unit">m</span>' + '<wbr>' + ret;
    if (eta = Math.floor(eta / 60)) {
      ret = (eta % 60) + '<span class="unit">h</span>' + '<wbr>' + ret;
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

function newAngle(deg) {
  console.log('newAngle(' + deg + ') currentAngle=' + currentAngle);
  // let arrow = document.getElementById('arrow');
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
  let speed =  km2mile(mps2kmph(currentCoords.speed));
  document.getElementById('speed').innerHTML = currentCoords.speed === null ? '--' : formatNumber(speed, 1) + '<wbr><span class="unit">mph</span>';
  document.getElementById('heading').innerHTML = currentCoords.heading === null ? '--' : Math.round(currentCoords.heading) + '<wbr>&deg;';
  document.getElementById('altitude').innerHTML = currentCoords.altitude === null ? '--' : Math.round(currentCoords.heading) + '<wbr><span class="unit">ft</span>';

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
    document.getElementById('distance').innerHTML = formatNumber(distance) + '<wbr><span class="unit">mi</span>';
    document.getElementById('eta').innerHTML = etaStr(distance, speed);
    newAngle(bearing);
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
        speed: position.coords.speed >= 1 ? position.coords.speed : null,
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
