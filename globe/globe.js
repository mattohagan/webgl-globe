/**
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};

DAT.Globe = function(container, opts) {
  opts = opts || {};

  var colorFn = opts.colorFn || function(x) {
    var c = new THREE.Color();
    //c.setHSL( ( 0.6 - ( x * 0.5 ) ), 1.0, 0.5 );
    c.setHex(0xFF9900);
    return c;
  };
  var imgDir = opts.imgDir || '';


  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null },
        'transparent': true
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };
  var newsPoints = [];
  var ptNum = 0;
  var INTERSECTED;

  var spin = true;

  var camera, scene, renderer, w, h;
  var mesh, atmosphere, point;

  var overRenderer;

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 100000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  function init() {

    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    var geometry = new THREE.SphereGeometry(200, 40, 30);

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['texture'].value = THREE.ImageUtils.loadTexture(imgDir+'worldtest.jpg');

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader

        });

    console.log("creating mesh");
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    shader = Shaders['atmosphere'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide,
          //blending: THREE.AdditiveBlending,
          transparent: true
        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set( 1.1, 1.1, 1.1 );
    scene.add(mesh);

    geometry = new THREE.SphereGeometry(2,0.75, 0.75);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-15));

    var ptMaterial = new THREE.MeshBasicMaterial({color: 0xFF9900});
    point = new THREE.Mesh(geometry, material);

    renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize(w, h);

    projector = new THREE.Projector();

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);

    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
      // was true
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);
  }

  addData = function(data, opts) {
    var lat, lng, size, color, i, step, colorFnWrapper;

    //opts.animated = opts.animated || false;
    //this.is_animated = opts.animated;
    //opts.format = opts.format || 'magnitude'; // other option is 'legend'
    //console.log(opts.format);
    /*if (opts.format === 'magnitude') {
      step = 3;
      colorFnWrapper = function(data, i) { return colorFn(data[i+2]); }
    } else if (opts.format === 'legend') {
      step = 4;
      colorFnWrapper = function(data, i) { return colorFn(data[i+3]); }
    } else {
      throw('error: format not supported: '+opts.format);
    }*/

    /*
    if (opts.animated) {
      if (this._baseGeometry === undefined) {
        this._baseGeometry = new THREE.Geometry();
        for (i = 0; i < data.length; i++) {
          lat = data[i];
          lng = data[i + 1];
//        size = data[i + 2];
          color = colorFnWrapper(data,i);
          size = 0;
          //if(i === 0)
            color.setHex(0xFF9900);

          // THIS IS THE DAMN VISIBLE GEOMETRY
          //addPoint(lat, lng, size, color, this._baseGeometry);
        }
      }
      if(this._morphTargetId === undefined) {
        this._morphTargetId = 0;
      } else {
        this._morphTargetId += 1;
      }
      opts.name = opts.name || 'morphTarget'+this._morphTargetId;
    }*/
    var subgeo = new THREE.Geometry();
    var c = new THREE.Color();
    console.log(data.length);

    for (var i = 0; i < data.length; i++) {
      lat = data[i][0];
      lng = data[i][1];
      color = c.setHex(0xFF9900);
      size = 0.005;
      size = size*200;
      addPoint(lat, lng, size, color, subgeo);
    }
    /*if (opts.animated) {
      this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    } else {
      this._baseGeometry = subgeo;
    }*/

  };
/*
  function update() {
    var vector = new THREE.Vector3( mouseX, mouseY, 1);
    projector.unprojectVector(vector, camera);

    var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
    var intersects = ray.intersectObjects(scene.children);

    if(intersects.length > 0){
      if(intersects[0].object != INTERSECTED){
        if(INTERSECTED){
          INTERSECTED.material.color.setHex(0xF0000D);

          INTERSECTED = intersects[0].object;

          INTERSECTED.material.color.setHex(0xFF9900);
        }
      }
      else{
        if(INTERSECTED){
          INTERSECTED.material.color.setHex(0xFFFFFF);
          INTERSECTED = null;
        }
      }
    }
  }*/

  function createPoints() {
    /*if (this._baseGeometry !== undefined) {
      if (this.is_animated === false) {
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: false
            }));
      } else {
        if (this._baseGeometry.morphTargets.length < 8) {
          console.log('t l',this._baseGeometry.morphTargets.length);
          var padding = 8-this._baseGeometry.morphTargets.length;
          console.log('padding', padding);
          for(var i=0; i<=padding; i++) {
            console.log('padding',i);
            this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
          }
        }
        //shader = Shaders['earth'];
        //console.log(shader);
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: false
            }));
      }
      // only runs once, this.points is a mesh
      //scene.add(this.points);
      //console.log('added this.points');
      //console.log(this.points);
    }*/
  }

  function addPoint(lat, lng, size, color, subgeo) {
    console.log('------------------------------');
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    //point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    //point.position.y = 200 * Math.cos(phi);
    //point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

    //point.lookAt(mesh.position);
    //console.log(mesh.position);

    //point.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
    //point.updateMatrix();

    for (var i = 0; i < point.geometry.faces.length; i++) {

      point.geometry.faces[i].color = color;

    }

    var ptMaterial = new THREE.MeshBasicMaterial({color: 0xFF9900});

    var dot = new THREE.Mesh(point.geometry, ptMaterial);
    //dot.position = point.position;
    dot.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    dot.position.y = 200 * Math.cos(phi);
    dot.position.z = 200 * Math.sin(phi) * Math.sin(theta);
    dot.lookAt(mesh.position);
    dot.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
    dot.updateMatrix();

    
    newsPoints.push(dot);
    scene.add(dot);
    console.log('added dot ' + ptNum);
    ptNum++;
    //THREE.GeometryUtils.merge(subgeo, point);
  }

  function onMouseDown(event) {
    resetTimeout();
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';

    /*var vector = new THREE.Vector3((event.clientX / window.innderWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 +1, 0.5);
    projector.unprojectVector(vector, camera);

    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObjects(newsPoints);

    var particleMaterial = new THREE.SpriteCanvasMaterial({
        
        color:0x00000,
        program: function (context){
          
          context.beginPath();
          context.arc(0,0,0.5,0,PI_HALF, true);
          context.fill();
        }
    });

    if(intersects.length > 0){
      intersects[ 0 ].object.material.color.setHex(0xF0000D);
      
      var particle = new THREE.Sprite(particleMaterial);
      particle.position = intersects[0].point;
      particle.scale.x = particle.scale.y = 16;
      scene.add(particle);
    }*/




  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    resetTimeout();
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 38:
        zoom(100);
        event.preventDefault();
        break;
      case 40:
        zoom(-100);
        event.preventDefault();
        break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(mesh.position);
    //console.log(mesh.position);
    //console.log(rotation.x + ' ' + rotation.y);
    renderer.render(scene, camera);
  }

  function spinGlobe(){
    if(spin === true)
      {
        if(target.y > 0.6)
          target.y = target.y - .02;
        else if(target.y < 0.4)
          target.y = target.y + .02;

        target.x = target.x + .04;

      }
    else
      abortTimer();
  }

  function abortTimer(){
    clearInterval(tid);
    stid = setTimeout(listenToSpin, 3000);
    //newsPoints[1].material.color.setRGB(0, 0, 0);
    for(var i=0;i<newsPoints.length;i++)
    {
      newsPoints[0].material.color.setHex(0xF0000D);
      //console.log(newsPoints[0]);
     // console.log(newsPoints[1]);
    }


  }

  function resetTimeout(){
    spin = false;
    clearTimeout(stid);
    stid = setTimeout(listenToSpin, 3000);
  }

  function listenToSpin(){
    spin = true;
    tid = setInterval(spinGlobe, 100);
    clearTimeout(stid);
  }


  init();
  this.animate = animate;

  var stid;
  var tid = setInterval(spinGlobe, 100);



  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
   /* var validMorphs = [];
    var morphDict = this.points.morphTargetDictionary;
    for(var k in morphDict) {
      if(k.indexOf('morphPadding') < 0) {
        validMorphs.push(morphDict[k]);
      }
    }
    validMorphs.sort();
    var l = validMorphs.length-1;
    var scaledt = t*l+1;
    var index = Math.floor(scaledt);
    for (i=0;i<validMorphs.length;i++) {
      this.points.morphTargetInfluences[validMorphs[i]] = 0;
    }
    var lastIndex = index - 1;
    var leftover = scaledt - index;
    if (lastIndex >= 0) {
      this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
    }
    this.points.morphTargetInfluences[index] = leftover;
    this._time = t;*/
  });

  this.addData = addData;
  this.createPoints = createPoints;
  this.renderer = renderer;
  this.scene = scene;

  //for(var i = 0; i< newsPoints.length; i++)
   // console.log(newsPoints[i]);
  return this;

};
