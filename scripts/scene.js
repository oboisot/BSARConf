import * as THREE from "../three/three.module.js";
import { OrbitControls } from "../three/OrbitControls.js";
import { Carrier, Axes } from "./objects.js";

import { BSARConfig } from "./default.js";
import { drawIsoRangeDop, drawGAFAmp } from "./plots.js";
import * as bsar from "./bsarfun.js";
// ***** Configurator Parameters *****

// ***** THREE parameters *****
const sceneCanvas = document.getElementById("sceneCanvas");
const planeSize = 25000; // m
const worldPlane = new THREE.Mesh();
let renderer, camera, scene, controls;
let renderRequested = false;

//
let TxCarrier, RxCarrier;

// Keys to allow looping
const carrierKeys = ["altitude", "velocity", "heading", "roll", "pitch", "incidence", 
                     "antennaSquint", "groundSquint", "leverX", "leverY", "leverZ",
                     "siteAperture", "aziAperture"];

const Elements = {
    "Tx": {
        "altitude":        document.getElementById('TxAltitude'),
        "velocity":        document.getElementById('TxVelocity'),
        "heading":         document.getElementById('TxHeading'),
        "roll":            document.getElementById('TxRoll'),
        "pitch":           document.getElementById('TxPitch'),
        "incidence":       document.getElementById('TxIncidence'),
        "antennaSquint":   document.getElementById('TxAntennaSquint'),
        "groundSquint":    document.getElementById('TxGroundSquint'),
        "sight":           document.getElementById('TxSight'),
        "leverX":          document.getElementById('TxLeverX'),
        "leverY":          document.getElementById('TxLeverY'),
        "leverZ":          document.getElementById('TxLeverZ'),
        "siteAperture":    document.getElementById('TxSiteAperture'),
        "aziAperture":     document.getElementById('TxAziAperture'),
        "gain":            document.getElementById('TxGainTx'),
        "centerFrequency": document.getElementById('TxCenterFrequency'),
        "bandwidth":       document.getElementById('TxBandwidth'),
        "prf":             document.getElementById('TxPRF'),
        "peakPower":       document.getElementById('TxPeakPower'),
        "dutyCycle":       document.getElementById('TxDutyCycle'),
        "lossFactor":      document.getElementById('TxLossFactor'),
        "infos": {
            "localIncidence":     document.getElementById('TxInfosLocalIncidence'),
            "antennaSquint":      document.getElementById('TxInfosAntennaSquint'),
            "rangeAtSwathCenter": document.getElementById('TxInfosRangeAtSwathCenter'),
            "rangeMin":           document.getElementById('TxInfosRangeMin'),
            "rangeMax":           document.getElementById('TxInfosRangeMax'),
            "footprintArea":      document.getElementById('TxInfosFootprintArea')
        }
    },
    "Rx": {
        "altitude":         document.getElementById('RxAltitude'),
        "velocity":         document.getElementById('RxVelocity'),
        "heading":          document.getElementById('RxHeading'),
        "roll":             document.getElementById('RxRoll'),
        "pitch":            document.getElementById('RxPitch'),
        "incidence":        document.getElementById('RxIncidence'),
        "antennaSquint":    document.getElementById('RxAntennaSquint'),
        "groundSquint":     document.getElementById('RxGroundSquint'),
        "sight":            document.getElementById('RxSight'),
        "leverX":           document.getElementById('RxLeverX'),
        "leverY":           document.getElementById('RxLeverY'),
        "leverZ":           document.getElementById('RxLeverZ'),
        "siteAperture":     document.getElementById('RxSiteAperture'),
        "aziAperture":      document.getElementById('RxAziAperture'),
        "gain":             document.getElementById('RxGainRx'),
        "noiseTemperature": document.getElementById('RxNoiseTemperature'),
        "lossFactor":       document.getElementById('RxLossFactor'),
        "integrationTime":  document.getElementById('RxIntegrationTime'),
        "infos": {
            "localIncidence":     document.getElementById('RxInfosLocalIncidence'),
            "antennaSquint":      document.getElementById('RxInfosAntennaSquint'),
            "rangeAtSwathCenter": document.getElementById('RxInfosRangeAtSwathCenter'),
            "rangeMin":           document.getElementById('RxInfosRangeMin'),
            "rangeMax":           document.getElementById('RxInfosRangeMax'),
            "footprintArea":      document.getElementById('RxInfosFootprintArea')
        }
    },
    "bsarInfos": {
        "bistaticAngle":    document.getElementById('BSARInfosBistaticAngle'),
        "slantRangeRes":    document.getElementById('BSARInfosSlantRangeRes'),
        "slantLateralRes":  document.getElementById('BSARInfosSlantLateralRes'),
        "groundRangeRes":   document.getElementById('BSARInfosGroundRangeRes'),
        "groundLateralRes": document.getElementById('BSARInfosGroundLateralRes'),
        "resolutionArea":   document.getElementById('BSARInfosResArea'),
        "integrationTime":  document.getElementById('BSARInfosIntegrationTime'),
        "nesz":             document.getElementById('BSARInfosNESZ')
    }
}

// ***** PLOTS ELEMENTS *****
const PlotIsoRangeDop = document.getElementById('plotIsoRangeDop'),
      PlotGAFAmp      = document.getElementById('plotGAFAmp');


// ***** Initialization functions *****
initValues( 'Tx' );
initValues( 'Rx' );
initScene();
TxOnEventBindings();
RxOnEventBindings();
updateInfos( TxCarrier, Elements.Tx );
updateInfos( RxCarrier, Elements.Rx );
updateBSARinfosPlots();

// ***********************
// ***** THREE scene *****
// ***********************
function initScene() {
    // ***** renderer *****
    renderer = new THREE.WebGLRenderer({
        canvas: sceneCanvas,
        antialias: true,
        logarithmicDepthBuffer: true,
    });
    renderer.localClippingEnabled = true;
    renderer.clippingPlanes = [new THREE.Plane( new THREE.Vector3(0, 0, 1), 1.1 ), ];
    renderer.sortObjects = false;
    
    // ***** Camera *****
    const fov = 50;
    const aspect = sceneCanvas.clientWidth / sceneCanvas.clientHeight;
    const near = 0.1;
    const far = 1e9;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0.5*planeSize, -0.5*planeSize, 0.5*planeSize);
    camera.up = new THREE.Vector3( 0, 0, 1 ); // Define the 'up' axis of the camera to be z-axis (default to y-axis)
    camera.lookAt(0, 0, 0);

    // ***** Controls *****
    controls = new OrbitControls( camera, renderer.domElement );
    controls.screenSpacePanning = false;
    controls.enablePan = true;
    controls.panSpeed = 1;
    controls.enableDamping = true;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 0; // Equatorial Radius + 10 meters
    controls.maxDistance = 1e7;
    controls.maxPolarAngle = 0.6 * Math.PI; //0.49 * Math.PI;

    // ***** Scene *****
    scene = new THREE.Scene();
    // scene.background = new THREE.Color( 0x00bfff );

    // ***** Light *****
    scene.add( new THREE.AmbientLight( 0xffffff ) );

    // ***** Reference plane *****
    worldPlane.geometry = new THREE.PlaneGeometry( planeSize, planeSize, 1, 1 ); // new THREE.PlaneBufferGeometry( planeSize, planeSize, 1, 1 );
    worldPlane.material = new THREE.MeshPhongMaterial({
        // wireframe: true,
        color: 0x006400,
        // side: THREE.DoubleSide
    });
    worldPlane.translateZ( -0.5 ); // For better rendering
    scene.add( worldPlane );

    // ***** Initialisation of TX and RX Carriers *****
    // ***** TX *****
    TxCarrier = new Carrier(
        BSARConfig.Tx.altitude.value,
        BSARConfig.Tx.velocity.value,
        BSARConfig.Tx.heading.value,
        BSARConfig.Tx.roll.value,
        BSARConfig.Tx.pitch.value,
        BSARConfig.Tx.incidence.value,
        BSARConfig.Tx.antennaSquint.value,
        // BSARConfig.Tx.groundSquint.value, TO BE ADDED
        BSARConfig.Tx.sight.value,
        BSARConfig.Tx.leverX.value,
        BSARConfig.Tx.leverY.value,
        BSARConfig.Tx.leverZ.value,
        BSARConfig.Tx.siteAperture.value,
        BSARConfig.Tx.aziAperture.value
    );
    TxCarrier.setBeamColor(0xffffff);

    // ***** RX *****
    RxCarrier = new Carrier(
        BSARConfig.Rx.altitude.value,
        BSARConfig.Rx.velocity.value,
        BSARConfig.Rx.heading.value,
        BSARConfig.Rx.roll.value,
        BSARConfig.Rx.pitch.value,
        BSARConfig.Rx.incidence.value,
        BSARConfig.Rx.antennaSquint.value,
        // BSARConfig.Rx.groundSquint.value, TO BE ADDED
        BSARConfig.Rx.sight.value,
        BSARConfig.Rx.leverX.value,
        BSARConfig.Rx.leverY.value,
        BSARConfig.Rx.leverZ.value,
        BSARConfig.Rx.siteAperture.value,
        BSARConfig.Rx.aziAperture.value
    );

    // Add carriers to scene
    RxCarrier.addToScene( scene );
    TxCarrier.addToScene( scene );

    // ***** Axes Helper *****
    const axes = new Axes( 500 );
    axes.origin.translateZ( 0.1 ); // For better rendering
    axes.addToScene( scene );

    const gridHelper = new THREE.GridHelper( planeSize, 100 );
    gridHelper.rotateX( 0.5 * Math.PI );
    scene.add( gridHelper );

    // ***** Envent Listeners *****
    controls.update();
    controls.addEventListener( 'change', requestRenderIfNotRequested ); // call this only in static scenes (i.e., if there is no animation loop)
    window.addEventListener( 'resize', requestRenderIfNotRequested, false );
    
    document.onload = requestRenderIfNotRequested();
    window.onload = requestRenderIfNotRequested();
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width  = canvas.clientWidth  * pixelRatio | 0;
    const height = canvas.clientHeight * pixelRatio | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function render() {
    // renderRequested = undefined;
    renderRequested = false;
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    controls.update();
    renderer.render( scene, camera );
}

function requestRenderIfNotRequested() {
    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(render);
    }
}

// ***** Inputs initialization from default configuration *****
function initValues( elmt_str ) {
    const conf = BSARConfig[elmt_str],
          elmt = Elements[elmt_str];
    for ( const key in conf ) {
        if ( conf.hasOwnProperty(key) ) {
            elmt[key].value = conf[key].value;
        }
    }
}

// ***** Interactive functions *****
function TxOnEventBindings() {
    for ( const key of carrierKeys ) {
        const elmt = Elements.Tx[key];
        elmt.onchange = () => {
            const newvalue = Number( elmt.value );
            if ( (newvalue >= elmt.min) && (newvalue <= elmt.max) ) {
                TxCarrier.setValueSelector( key, newvalue );
                BSARConfig.Tx[key].value = newvalue;
                requestRenderIfNotRequested();
                updateInfos( TxCarrier, Elements.Tx );
                updateBSARinfosPlots();
            }  
        }
    } 
    Elements.Tx.sight.onchange = () => {
        const newvalue = Elements.Tx.sight.checked;
        TxCarrier.setAntennaSight( newvalue );
        BSARConfig.Tx.sight.value = newvalue;
        requestRenderIfNotRequested();
        updateInfos( TxCarrier, Elements.Tx );
        updateBSARinfosPlots();
    }
    // Change BSAR infos and plots on,ly
    Elements.Tx.centerFrequency.onchange = () => {
        const newvalue = Number( Elements.Tx.centerFrequency.value );
        if ( (newvalue >= Elements.Tx.centerFrequency.min) && (newvalue <= Elements.Tx.centerFrequency.max) ) {
            BSARConfig.Tx.centerFrequency.value = newvalue;
            updateBSARinfosPlots();
        }
    }
    Elements.Tx.bandwidth.onchange = () => {
        const newvalue = Number( Elements.Tx.bandwidth.value );
        if ( (newvalue >= Elements.Tx.bandwidth.min) && (newvalue <= Elements.Tx.bandwidth.max) ) {
            BSARConfig.Tx.bandwidth.value = newvalue;
            updateBSARinfosPlots();
        }
    }
    // Change BSAR infos (NESZ)
    Elements.Tx.gain.onchange = () => {
        const newvalue = Number( Elements.Tx.gain.value );
        if ( (newvalue >= Elements.Tx.gain.min) && (newvalue <= Elements.Tx.gain.max) ) {
            BSARConfig.Tx.gain.value = newvalue;
            updateBSARinfos();
        }
    }
    Elements.Tx.peakPower.onchange = () => {
        const newvalue = Number( Elements.Tx.peakPower.value );
        if ( (newvalue >= Elements.Tx.peakPower.min) && (newvalue <= Elements.Tx.peakPower.max) ) {
            BSARConfig.Tx.peakPower.value = newvalue;
            updateBSARinfos();
        }
    }
    Elements.Tx.dutyCycle.onchange = () => {
        const newvalue = Number( Elements.Tx.dutyCycle.value );
        if ( (newvalue >= Elements.Tx.dutyCycle.min) && (newvalue <= Elements.Tx.dutyCycle.max) ) {
            BSARConfig.Tx.dutyCycle.value = newvalue;
            updateBSARinfos();
        }
    }
    Elements.Tx.lossFactor.onchange = () => {
        const newvalue = Number( Elements.Tx.lossFactor.value );
        if ( (newvalue >= Elements.Tx.lossFactor.min) && (newvalue <= Elements.Tx.lossFactor.max) ) {
            BSARConfig.Tx.lossFactor.value = newvalue;
            updateBSARinfos();
        }
    }
    // Change nothing (for now)
    Elements.Tx.prf.onchange = () => {
        const newvalue = Number( Elements.Tx.prf.value );
        if ( (newvalue >= Elements.Tx.prf.min) && (newvalue <= Elements.Tx.prf.max) ) {
            BSARConfig.Tx.prf.value = newvalue;
        }
    }
}

function RxOnEventBindings() {
    for ( const key of carrierKeys ) {
        const elmt = Elements.Rx[key];
        elmt.onchange = () => {
            const newvalue = Number( elmt.value );
            if ( (newvalue >= elmt.min) && (newvalue <= elmt.max) ) {
                RxCarrier.setValueSelector( key, newvalue );
                BSARConfig.Rx[key].value = newvalue;
                requestRenderIfNotRequested();
                updateInfos( RxCarrier, Elements.Rx );
                updateBSARinfosPlots();
            }           
        }
    } 
    Elements.Rx.sight.onchange = () => {
        const newvalue = Elements.Rx.sight.checked;
        RxCarrier.setAntennaSight( newvalue );
        BSARConfig.Rx.sight.value = newvalue;
        requestRenderIfNotRequested();
        updateInfos( RxCarrier, Elements.Rx );
        updateBSARinfosPlots();
    }
    Elements.Rx.integrationTime.oninput = () => { // Input checking for integration time
        const newvalue = Elements.Rx.integrationTime.value;
        if ( (newvalue === 'auto-ground') || (newvalue === 'auto-slant') ) { // if value is 'auto-ground' or 'auto-slant'
            Elements.Rx.integrationTime.setCustomValidity('');
        } else if ( !isNaN( newvalue ) ){ // if value is a numeric value, we proceed
            const newvaluenum = Number( newvalue );
            if ( (newvaluenum > 0) && (newvaluenum <= 3600) ) { // if value is positiv or smaller than a given value
                Elements.Rx.integrationTime.setCustomValidity('');
            } else {
                Elements.Rx.integrationTime.setCustomValidity("'auto-ground', 'auto-slant' or 0 - 3600 s");
            }
        } else {
            Elements.Rx.integrationTime.setCustomValidity("'auto-ground', 'auto-slant' or 0 - 3600 s");
        }
    }
    // Change BSAR infos and plots
    Elements.Rx.integrationTime.onchange = () => { // Note: validation made with oninput event
        const newvalue = Elements.Rx.integrationTime.value;
        if ( (newvalue === 'auto-ground') || (newvalue === 'auto-slant') ) { // if value is 'auto-ground' or 'auto-slant'
            BSARConfig.Rx.integrationTime.value = newvalue;
        } else {
            BSARConfig.Rx.integrationTime.value = Number( newvalue );
        }
        updateBSARinfosPlots();
    }
    // Change BSAR infos (NESZ)
    Elements.Rx.gain.onchange = () => {
        const newvalue = Number( Elements.Rx.gain.value );
        if ( (newvalue >= Elements.Rx.gain.min) && (newvalue <= Elements.Rx.gain.max) ) {
            BSARConfig.Rx.gain.value = newvalue;
            updateBSARinfos();
        }
    }
    Elements.Rx.noiseTemperature.onchange = () => {
        const newvalue = Number( Elements.Rx.noiseTemperature.value );
        if ( (newvalue >= Elements.Rx.noiseTemperature.min) && (newvalue <= Elements.Rx.noiseTemperature.max) ) {
            BSARConfig.Rx.noiseTemperature.value = newvalue;
            updateBSARinfos();
        }
    }
    Elements.Rx.lossFactor.onchange = () => {
        const newvalue = Number( Elements.Rx.lossFactor.value );
        if ( (newvalue >= Elements.Rx.lossFactor.min) && (newvalue <= Elements.Rx.lossFactor.max) ) {
            BSARConfig.Rx.lossFactor.value = newvalue;
            updateBSARinfos();
        }
    }
}

function updateBSARinfosPlots() {
    updateBSARinfos();
    drawIsoRangeDop( TxCarrier, RxCarrier,
                     BSARConfig.Tx.centerFrequency.value * 1e9,
                     PlotIsoRangeDop );
    drawGAFAmp( TxCarrier, RxCarrier,
                BSARConfig.Tx.centerFrequency.value * 1e9,
                BSARConfig.Tx.bandwidth.value * 1e6,
                BSARConfig.Rx.integrationTime.value, PlotGAFAmp );
}

function updateInfos( system, elmts ) {
    /*
        system : TxCarrier or RxCarrier
        infoElements : 
    */
    elmts.infos.localIncidence.innerHTML = `${system.getLocalIncidence().toFixed(3)} °`;
    elmts.infos.antennaSquint.innerHTML = `${system.getComputedAntennaSquint().toFixed(3)} °`;
    // Range at Swath center
    const rangeAtSwathCenter = system.getRangeAtSwathCenter();
    if (rangeAtSwathCenter > 1000.0) {
        elmts.infos.rangeAtSwathCenter.innerHTML = `${(rangeAtSwathCenter/1000.0).toFixed(3)} km`;
    } else {
        elmts.infos.rangeAtSwathCenter.innerHTML = `${rangeAtSwathCenter.toFixed(3)} m`;
    }
    // Range min
    const rangeMin = system.getRangeMin();
    if (rangeMin > 1000.0) {
        elmts.infos.rangeMin.innerHTML = `${(rangeMin/1000.0).toFixed(3)} km`;
    } else  {
        elmts.infos.rangeMin.innerHTML = `${rangeMin.toFixed(3)} m`;
    }
    // Range max
    const rangeMax = system.getRangeMax();
    if (rangeMax > 1000.0) {
        elmts.infos.rangeMax.innerHTML = `${(rangeMax/1000.0).toFixed(3)} km`;
    } else  {
        elmts.infos.rangeMax.innerHTML = `${rangeMax.toFixed(3)} m`;
    }
    // Footprint area
    const footprintArea = system.getFootprintArea();
    if (footprintArea > 1000000.0) {
        elmts.infos.footprintArea.innerHTML = `${(footprintArea/1000000.0).toFixed(3)} km&sup2;`;
    } else {
        elmts.infos.footprintArea.innerHTML = `${footprintArea.toFixed(3)} m&sup2;`;
    }
}

function updateBSARinfos() {
    const TP = TxCarrier.getAntennaPosition().negate(),
          RP = RxCarrier.getAntennaPosition().negate(),
          VT = TxCarrier.getCarrierVelocityVector(),
          VR = RxCarrier.getCarrierVelocityVector();
    const bsar_resolutions = bsar.bistatic_sar_resolution( bsar.C0 * 1e-9 / BSARConfig.Tx.centerFrequency.value,
                                                           BSARConfig.Tx.bandwidth.value * 1e6,
                                                           TP, VT, RP, VR,
                                                           BSARConfig.Rx.integrationTime.value );
    const bistatic_angle = THREE.MathUtils.radToDeg( bsar.bistatic_angle( TP, RP ) );
    // Bistatic angle
    Elements.bsarInfos.bistaticAngle.innerHTML = `${bistatic_angle.toFixed(3)} °`;
    // Slant range resolution
    Elements.bsarInfos.slantRangeRes.innerHTML = `${bsar_resolutions.slant_range_resolution.toFixed(3)} m`;
    // Slant lateral resolution
    if (bsar_resolutions.slant_lateral_resolution > 1e6) {
        Elements.bsarInfos.slantLateralRes.innerHTML = '+Inf';
    } else if (bsar_resolutions.slant_lateral_resolution > 1000.0) {
        Elements.bsarInfos.slantLateralRes.innerHTML = `${(bsar_resolutions.slant_lateral_resolution/1000.0).toFixed(3)} km`;
    } else {
        Elements.bsarInfos.slantLateralRes.innerHTML = `${bsar_resolutions.slant_lateral_resolution.toFixed(3)} m`;
    }
    // Ground range resolution
    if (bsar_resolutions.ground_range_resolution > 1e6) {
        Elements.bsarInfos.groundRangeRes.innerHTML = '+Inf';
    } else if (bsar_resolutions.ground_range_resolution > 1000.0) {
        Elements.bsarInfos.groundRangeRes.innerHTML = `${(bsar_resolutions.ground_range_resolution/1000.0).toFixed(3)} km`;
    } else {
        Elements.bsarInfos.groundRangeRes.innerHTML = `${bsar_resolutions.ground_range_resolution.toFixed(3)} m`;
    }
    // Ground lateral resolution
    if (bsar_resolutions.ground_lateral_resolution > 1e6) {
        Elements.bsarInfos.groundLateralRes.innerHTML = '+Inf';
    } else if (bsar_resolutions.ground_lateral_resolution > 1000.0) {
        Elements.bsarInfos.groundLateralRes.innerHTML = `${(bsar_resolutions.ground_lateral_resolution/1000.0).toFixed(3)} km`;
    } else {
        Elements.bsarInfos.groundLateralRes.innerHTML = `${bsar_resolutions.ground_lateral_resolution.toFixed(3)} m`;
    }
    // Resolution area
    if (bsar_resolutions.resolution_area > 1e6) {
        Elements.bsarInfos.resolutionArea.innerHTML = '+Inf';
    } else if (bsar_resolutions.resolution_area > 1000000.0) {
        Elements.bsarInfos.resolutionArea.innerHTML = `${(bsar_resolutions.resolution_area/1000000.0).toFixed(3)} km&sup2;`;
    } else {
        Elements.bsarInfos.resolutionArea.innerHTML = `${bsar_resolutions.resolution_area.toFixed(3)} m&sup2`;
    }
    // Integration time
    Elements.bsarInfos.integrationTime.innerHTML = `${bsar_resolutions.tint.toFixed(3)} s`;
    // NESZ
    Elements.bsarInfos.nesz.innerHTML = 'TO DO';
}

// *******************
// ***** BUTTONS *****
// *******************
// ***** Screenshot Button *****
const ScreenshotButton = document.getElementById('ScreenshotButton');
ScreenshotButton.onclick = () => {
    const canvas = renderer.domElement;
    render();
    canvas.toBlob(
        (blob) => {saveBlob(blob, 'BSAR_scene_screenshot.png')},
        'image/png');
}

const SaveButton = document.getElementById('SaveButton');
SaveButton.onclick = () => {
    const blob = new Blob([JSON.stringify(BSARConfig, null, 4)],
                          {type : 'application/json'});
    saveBlob(blob, 'bsar_config.json');
}

function saveBlob(blob, fileName) {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
}

// ***** Load Button *****
const LoadButton = document.getElementById('LoadButton'),
      FileInput = document.getElementById('FileInput');
LoadButton.onclick = () => {
    if ( FileInput ) {
        FileInput.click();
    }
}
FileInput.onchange = () => {
    let file = FileInput.files[0];
    if ( file ) {
        const reader = new FileReader();
        reader.readAsText(file);   
        reader.onload = () => {
            parseLoadConfig( JSON.parse(reader.result) );
        };
    }
}

function parseLoadConfig( config ) {
    const tx_conf = BSARConfig.Tx,
          tx_elmts = Elements.Tx,
          rx_conf = BSARConfig.Rx,
          rx_elmts = Elements.Rx;
    // Tx
    if ( config.hasOwnProperty('Tx') ) {
        for ( const key in tx_conf ) {
            if ( config.Tx.hasOwnProperty(key) ) {
                if ( key === 'sight' ) {
                    const newvalue = config.Tx.sight.value;
                    if ( typeof(newvalue) === 'boolean') {
                        const oldvalue = tx_elmts.sight.checked;
                        if ( newvalue != oldvalue ) { // /!\ IMPORTANT: avoid reaplying the same looking direction, giving weird behaviour
                            tx_elmts.sight.checked = newvalue;
                            tx_conf.sight.value = newvalue;                        
                            TxCarrier.setAntennaSight( newvalue );
                        }
                    } else {
                        alert( "Tx.sight must be a boolean !\nConfiguration partially loaded." );
                    }
                } else {
                    const oldvalue = tx_elmts[key].value,
                          newvalue = config.Tx[key].value;
                    if ( newvalue != oldvalue ) {
                        if ( (newvalue >= tx_elmts[key].min) && (newvalue <= tx_elmts[key].max) ) {
                            tx_conf[key].value = newvalue;
                            tx_elmts[key].value = newvalue;
                            // Note: setValueSelector does nothing if the key is wrong
                            TxCarrier.setValueSelector( key, newvalue );
                        } else {
                            alert( "Tx." + key + " is not a valid value !\nConfiguration partially loaded." );
                        }
                    }
                }
            } else {
                alert( "Tx." + key + " property is not set !\nConfiguration partially loaded." );
            }
        }
    } else {
        alert( "Tx property is not set !\nConfiguration partially loaded.")
    }
    // Rx
    if ( config.hasOwnProperty('Rx') ) {
        for ( const key in rx_conf ) {
            if ( key === 'integrationTime' ) { break; } // Must be handled manually
            if ( config.Rx.hasOwnProperty(key) ) {
                if ( key === 'sight' ) {
                    const newvalue = config.Rx.sight.value;
                    if ( typeof(newvalue) === 'boolean') {
                        const oldvalue = rx_elmts.sight.checked;
                        if ( newvalue != oldvalue ){
                            rx_elmts.sight.checked = newvalue;
                            rx_conf.sight.value = newvalue;                        
                            RxCarrier.setAntennaSight( newvalue );
                        }
                    } else {
                        alert( "Rx.sight must be a boolean !\nConfiguration partially loaded." );
                    }              
                } else {
                    const oldvalue = rx_elmts[key].value,
                          newvalue = config.Rx[key].value;
                    if ( newvalue != oldvalue ) {
                        if ( (newvalue >= rx_elmts[key].min) && (newvalue <= rx_elmts[key].max) ) {
                            rx_conf[key].value = newvalue;
                            rx_elmts[key].value = newvalue;
                            RxCarrier.setValueSelector( key, newvalue );
                        } else {
                            alert( "Rx." + key + " is not a valid value !\nConfiguration partially loaded." );
                        }
                    }
                }
            } else {
                alert( "Rx." + key + " property is not set !\nConfiguration partially loaded." );
            }
        }
    } else {
        alert( "Rx property is not set !\nConfiguration partially loaded." );
    }
    // Rx integration time
    if ( config.Rx.hasOwnProperty('integrationTime') ) {
        const oldvalue = rx_elmts.integrationTime.value,
              newvalue = config.Rx.integrationTime.value;
        if ( newvalue != oldvalue ) {
            if ( (newvalue === 'auto-ground') || (newvalue === 'auto-slant') ) { // if value is 'auto-ground' or 'auto-slant'
                rx_conf.integrationTime.value = newvalue;
                rx_elmts.integrationTime.value = newvalue;
            } else if ( !isNaN( newvalue ) ){ // if value is a numeric value, we proceed
                const newvaluenum = Number( newvalue );
                if ( (newvaluenum > 0) && (newvaluenum <= 3600) ) { // if value is positiv or smaller than a given value
                    rx_conf.integrationTime.value = newvaluenum;
                    rx_elmts.integrationTime.value = newvaluenum;
                } else {
                    alert( "Rx.integrationTime is not a valid value !" );
                }
            } else {
                alert( "Rx.integrationTime is not a valid value !" );
            }
        }
    } else {
        alert( "Rx.integrationTime property is not set !" );
    }
    // Update of all scene, infos and plots
    requestRenderIfNotRequested();
    updateInfos( TxCarrier, tx_elmts );
    updateInfos( RxCarrier, rx_elmts );
    updateBSARinfosPlots();
}
