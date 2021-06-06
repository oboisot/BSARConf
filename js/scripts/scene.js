import * as THREE from "../three/three.module.js";
import { OrbitControls } from "../three/OrbitControls.js";
import { Carrier, Axes, IsoRangeSurface } from "./objects.js";

import { BSARConfig, Elements } from "./config.js";
import { drawIsoRangeDop, drawGAFAmp } from "./plots.js";
import * as bsar from "./bsarfun.js";
// ***** Configurator Parameters *****

// ***** THREE parameters *****
// const planeSize = 25000; // m
const planeSize = 30000; // m
const worldPlane = new THREE.Mesh();
// Global objects
let renderer, camera, scene, controls,
    TxCarrier, RxCarrier,
    BSARisoRangeSurface,
    renderRequested = false;

// ***** CANVAS ELEMENT *****
const sceneCanvas      = document.getElementById('sceneCanvas');
// ***** PLOTS ELEMENTS *****
const plotIsoRangeDop  = document.getElementById('plotIsoRangeDop'),
      plotGAFAmp       = document.getElementById('plotGAFAmp');
// ***** LOADING ELEMENTS *****
const loadingContainer = document.getElementById('loadingContainer');

// ***** Initialization functions *****
initValues();
initScene();
onEventBindings();
updateSelector( [true, true, true, true, true] );

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
    worldPlane.material = new THREE.MeshPhongMaterial({ color: 0x006400 });
    worldPlane.translateZ( -0.1 ); // For better rendering
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
        BSARConfig.Tx.siteBeamWidth.value,
        BSARConfig.Tx.aziBeamWidth.value
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
        BSARConfig.Rx.siteBeamWidth.value,
        BSARConfig.Rx.aziBeamWidth.value
    );

    // Add carriers to scene
    RxCarrier.addToScene( scene );
    TxCarrier.addToScene( scene );

    // ***** Iso-Range Surface *****
    BSARisoRangeSurface = new IsoRangeSurface( TxCarrier, RxCarrier );
    // Add iso-Range surface to scene
    BSARisoRangeSurface.addToScene( scene );

    // ***** Axes Helper *****
    const axes = new Axes( 500 );
    axes.origin.translateZ( 0.1 ); // For better rendering
    axes.addToScene( scene );

    const gridHelper = new THREE.GridHelper( planeSize, 150 );
    gridHelper.rotateX( 0.5 * Math.PI );
    scene.add( gridHelper );

    // ***** Envent Listeners *****
    controls.update();
    controls.addEventListener( 'change', requestRenderIfNotRequested ); // call this only in static scenes (i.e., if there is no animation loop)
    window.addEventListener( 'resize', requestRenderIfNotRequested, false );
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
function initValues() {
    // Tx
    for ( const key in BSARConfig.Tx ) {
        if ( BSARConfig.Tx.hasOwnProperty(key) ) {
            if ( key === 'sight') {
                Elements.Tx.sight.element.checked = BSARConfig.Tx[key].value;
            } else {
                Elements.Tx[key].element.value = BSARConfig.Tx[key].value;
            }
        }
    }
    // Rx
    for ( const key in BSARConfig.Rx ) {
        if ( BSARConfig.Rx.hasOwnProperty(key) ) {
            if ( key === 'sight') {
                Elements.Rx.sight.element.checked = BSARConfig.Rx[key].value;
            } else {
                Elements.Rx[key].element.value = BSARConfig.Rx[key].value;
            }
        }
    }
}

// ***** Interactive functions *****
function onEventBindings() {
    const tx_conf = BSARConfig.Tx,
          tx_elmts = Elements.Tx,
          rx_conf = BSARConfig.Rx,
          rx_elmts = Elements.Rx;
    // Tx events binding
    for ( const key in tx_conf ) {
        if ( key === 'sight' ) {
            tx_elmts.sight.element.onchange = () => {
                const newvalue = tx_elmts.sight.element.checked;
                tx_conf.sight.value = newvalue;
                TxCarrier.setAntennaSight( newvalue );
                computeIsoRangeSurface( tx_elmts.sight.isoRangeSurfaceUpdate );                
                updateSelector( tx_elmts.sight.needUpdate );                
            }
        } else {
            const elmt = tx_elmts[key];
            elmt.element.onchange = () => {
                const newvalue = Number( elmt.element.value );
                if ( (newvalue >= elmt.element.min) && (newvalue <= elmt.element.max) ) {
                    tx_conf[key].value = newvalue;
                    TxCarrier.setValueSelector( key, newvalue ); // Ignore keys which are not defined in Carrier
                    computeIsoRangeSurface( tx_elmts[key].isoRangeSurfaceUpdate );  
                    updateSelector( elmt.needUpdate );
                }
            }
        }
    }
    // Rx events binding
    for ( const key in rx_conf ) {
        if ( key === 'sight' ) {
            rx_elmts.sight.element.onchange = () => {
                const newvalue = rx_elmts.sight.element.checked;
                rx_conf.sight.value = newvalue;
                RxCarrier.setAntennaSight( newvalue );
                computeIsoRangeSurface( rx_elmts.sight.isoRangeSurfaceUpdate );                    
                updateSelector( rx_elmts.sight.needUpdate );
            }
        } else if ( key === 'integrationTime' ){
            rx_elmts.integrationTime.element.onchange = () => {
                const newvalue = rx_elmts.integrationTime.element.value;
                if ( (newvalue === 'auto-ground') || (newvalue === 'auto-slant') ) { // if value is 'auto-ground' or 'auto-slant'
                    rx_conf.integrationTime.value = newvalue;
                } else {
                    rx_conf.integrationTime.value = Number( newvalue );
                }
                updateSelector( rx_elmts.integrationTime.needUpdate );
            }
        } else {
            const elmt = rx_elmts[key];
            elmt.element.onchange = () => {
                const newvalue = Number( elmt.element.value );
                if ( (newvalue >= elmt.element.min) && (newvalue <= elmt.element.max) ) {
                    rx_conf[key].value = newvalue;
                    RxCarrier.setValueSelector( key, newvalue ); // Ignore keys which are not defined in Carrier
                    computeIsoRangeSurface( rx_elmts[key].isoRangeSurfaceUpdate );
                    updateSelector( elmt.needUpdate );
                }
            }
        }
    }
    // Input checking for integration time
    rx_elmts.integrationTime.element.oninput = () => {
        const newvalue = rx_elmts.integrationTime.element.value;
        if ( (newvalue === 'auto-ground') || (newvalue === 'auto-slant') ) { // if value is 'auto-ground' or 'auto-slant'
            rx_elmts.integrationTime.element.setCustomValidity('');
        } else if ( !isNaN( newvalue ) ){ // if value is a numeric value, we proceed
            const newvaluenum = Number( newvalue );
            if ( (newvaluenum > 0) && (newvaluenum <= 3600) ) { // if value is positiv or smaller than a given value
                rx_elmts.integrationTime.element.setCustomValidity('');
            } else {
                rx_elmts.integrationTime.element.setCustomValidity("'auto-ground', 'auto-slant' or 0 - 3600 s");
            }
        } else {
            rx_elmts.integrationTime.element.setCustomValidity("'auto-ground', 'auto-slant' or 0 - 3600 s");
        }
    }
}

function computeIsoRangeSurface( isoRangeSurfaceUpdate ) {
    if ( isoRangeSurfaceUpdate ) {
        BSARisoRangeSurface.updateIsoRangeSurface( TxCarrier, RxCarrier );
    }
}

function updateSelector( needUpdate ) {
    if ( needUpdate[0] ) {
        requestRenderIfNotRequested();
    }
    if ( needUpdate[1] ) {
        updateInfos( TxCarrier, Elements.Tx );
    }
    if ( needUpdate[2] ) {
        updateInfos( RxCarrier, Elements.Rx );
    }
    if ( needUpdate[3] ) {
        updateBSARinfos();
    }
    if ( needUpdate[4] ) {
        updatePlots();
    }
}

function updateInfos( system, elmts ) {
    /*
        system : TxCarrier or RxCarrier
        infoElements : 
    */
    elmts.infos.localIncidenceMin.innerHTML = `${system.getLocalIncidenceMin().toFixed(3)} °`;
    elmts.infos.localIncidenceCenter.innerHTML = `${system.getLocalIncidence().toFixed(3)} °`;
    elmts.infos.localIncidenceMax.innerHTML = `${system.getLocalIncidenceMax().toFixed(3)} °`;
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
    // Ground range swath
    const groudRangeSwath = system.getGroundRangeSwath();
    if (groudRangeSwath > 1000.0) {
        elmts.infos.groundRangeSwath.innerHTML = `${(groudRangeSwath/1000.0).toFixed(3)} km`;
    } else {
        elmts.infos.groundRangeSwath.innerHTML = `${groudRangeSwath.toFixed(3)} m`;
    }
    // Footprint area
    const footprintArea = system.getFootprintArea();
    if (footprintArea > 100000.0) {
        elmts.infos.footprintArea.innerHTML = `${(footprintArea/1000000.0).toFixed(3)} km&sup2;`;
    } else {
        elmts.infos.footprintArea.innerHTML = `${footprintArea.toFixed(3)} m&sup2;`;
    }
    // Illumination time
    const illuminationTime = system.getIlluminationTime();
    if ( illuminationTime ) {
        elmts.infos.illuminationTime.innerHTML = `${illuminationTime.toFixed(3)} s`;
    } else {
        elmts.infos.illuminationTime.innerHTML = '+Inf s';
    }
}

function updateBSARinfos() {
    const TP = TxCarrier.getAntennaPosition().negate(),
          RP = RxCarrier.getAntennaPosition().negate(),
          VT = TxCarrier.getCarrierVelocityVector(),
          VR = RxCarrier.getCarrierVelocityVector();
    const lem = bsar.C0/ BSARConfig.Tx.centerFrequency.value * 1e-9,
          bandwidth = BSARConfig.Tx.bandwidth.value * 1e6,
          tint = BSARConfig.Rx.integrationTime.value,
          tx_peak_power = BSARConfig.Tx.peakPower.value,
          tx_duty_cycle = BSARConfig.Tx.dutyCycle.value * 0.01,
          tx_loss_factor = BSARConfig.Tx.lossFactor.value,
          tx_gain = BSARConfig.Tx.gain.value,
          rx_temp = BSARConfig.Rx.noiseTemperature.value,
          rx_noise_factor = BSARConfig.Rx.noiseFactor.value,
          rx_gain = BSARConfig.Rx.gain.value;
    const bsar_resolutions = bsar.bistatic_sar_resolution( lem, bandwidth, TP, VT, RP, VR, tint ),
          bistatic_angle = THREE.MathUtils.radToDeg( bsar.bistatic_angle( TP, RP ) ),
          nesz = bsar.compute_nesz( tx_peak_power, tx_duty_cycle, tx_loss_factor, tx_gain,
                                    rx_temp, rx_noise_factor, rx_gain,
                                    TP, RP, lem,
                                    bsar_resolutions.tint,
                                    bsar_resolutions.resolution_area ),
          dopplerFrequency = bsar.doppler_frequency( lem, TP, VT, RP, VR ),
          dopplerRate = bsar.doppler_rate( lem, TP, VT, RP, VR ),
          dopplerBandwidth = bsar.doppler_bandwidth( dopplerRate, bsar_resolutions.tint );
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
    // Doppler frequency
    Elements.bsarInfos.dopplerFrequency.innerHTML = `${dopplerFrequency.toFixed(3)} Hz`;
    // Doppler rate
    Elements.bsarInfos.dopplerRate.innerHTML = `${dopplerRate.toFixed(3)} Hz/s`;
    // Integration time
    Elements.bsarInfos.integrationTime.innerHTML = `${bsar_resolutions.tint.toFixed(3)} s`;
    // Doppler bandwidth
    Elements.bsarInfos.processedDopplerBandwidth.innerHTML = `${dopplerBandwidth.toFixed(3)} Hz`;
    // NESZ
    Elements.bsarInfos.nesz.innerHTML = `${(10*Math.log10(nesz)).toFixed(3)} dBm&sup2/m&sup2`;
}

function updatePlots() {
    drawIsoRangeDop( TxCarrier, RxCarrier,
                     BSARConfig.Tx.centerFrequency.value * 1e9,
                     plotIsoRangeDop );
    drawGAFAmp( TxCarrier, RxCarrier,
                BSARConfig.Tx.centerFrequency.value * 1e9,
                BSARConfig.Tx.bandwidth.value * 1e6,
                BSARConfig.Rx.integrationTime.value, plotGAFAmp );
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

// ***** Save Button *****
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
      FileInput = document.getElementById('FileInput'),
      DropZone = document.getElementById('DropZone');
LoadButton.onclick = () => {
    if ( FileInput ) {
        FileInput.click();
    }
}
FileInput.onchange = () => {
    const file = FileInput.files[0];
    if ( file ) {
        loadingContainer.style['display'] = 'flex';
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            parseLoadConfig( JSON.parse( reader.result ) );
            loadingContainer.style['display'] = 'none';
        }
    }
}

window.ondrop = (ev) => {
    ev.preventDefault();
    DropZone.style['display'] = 'none';
    let file;
    if (ev.dataTransfer.items) {
        if (ev.dataTransfer.items[0].kind === 'file') {
            file = ev.dataTransfer.items[0].getAsFile();
        }
    } else {
        file = ev.dataTransfer.files[0];
    }
    if ( file ) {
        loadingContainer.style['display'] = 'flex';
        if ( (file.type === 'application/json') && (file.name.split('.').pop() === 'json') ) {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                parseLoadConfig( JSON.parse( reader.result ) );
                loadingContainer.style['display'] = 'none';
            }
        } else {
            loadingContainer.style['display'] = 'none';
            alert("The configuration file must be a json file.")
        }
    }
}

window.ondragover = (ev) => {
    ev.preventDefault();
    DropZone.style['display'] = 'flex';
    DropZone.style['background'] = 'rgba(0,0,0,0.75)';
}

window.ondragenter = (ev) => {
    ev.preventDefault();
    DropZone.style['display'] = 'flex';
    DropZone.style['background'] = 'rgba(0,0,0,0.75)';
}

window.ondragleave = (ev) => {
    ev.preventDefault();
    DropZone.style['display'] = 'none';
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
                        const oldvalue = tx_elmts.sight.element.checked;
                        if ( newvalue != oldvalue ) { // /!\ IMPORTANT: avoid reaplying the same looking direction, giving weird behaviour
                            tx_elmts.sight.element.checked = newvalue;
                            tx_conf.sight.value = newvalue;                        
                            TxCarrier.setAntennaSight( newvalue );
                        }
                    } else {
                        alert( "Tx.sight must be a boolean !\nConfiguration partially loaded." );
                    }
                } else {
                    const oldvalue = tx_elmts[key].element.value,
                          newvalue = config.Tx[key].value;
                    if ( newvalue != oldvalue ) {
                        if ( (newvalue >= tx_elmts[key].element.min) && (newvalue <= tx_elmts[key].element.max) ) {
                            tx_elmts[key].element.value = newvalue;
                            tx_conf[key].value = newvalue;
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
                        const oldvalue = rx_elmts.sight.element.checked;
                        if ( newvalue != oldvalue ){
                            rx_elmts.sight.element.checked = newvalue;
                            rx_conf.sight.value = newvalue;                        
                            RxCarrier.setAntennaSight( newvalue );
                        }
                    } else {
                        alert( "Rx.sight must be a boolean !\nConfiguration partially loaded." );
                    }              
                } else {
                    const oldvalue = rx_elmts[key].element.value,
                          newvalue = config.Rx[key].value;
                    if ( newvalue != oldvalue ) {
                        if ( (newvalue >= rx_elmts[key].element.min) && (newvalue <= rx_elmts[key].element.max) ) {
                            rx_elmts[key].element.value = newvalue;
                            rx_conf[key].value = newvalue;
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
        const oldvalue = rx_elmts.integrationTime.element.value,
              newvalue = config.Rx.integrationTime.value;
        if ( newvalue != oldvalue ) {
            if ( (newvalue === 'auto-ground') || (newvalue === 'auto-slant') ) { // if value is 'auto-ground' or 'auto-slant'
                rx_elmts.integrationTime.element.value = newvalue;
                rx_conf.integrationTime.value = newvalue;
            } else if ( !isNaN( newvalue ) ){ // if value is a numeric value, we proceed
                const newvaluenum = Number( newvalue );
                if ( (newvaluenum > 0) && (newvaluenum <= 3600) ) { // if value is positiv or smaller than a given value
                    rx_elmts.integrationTime.element.value = newvaluenum;
                    rx_conf.integrationTime.value = newvaluenum;
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
    computeIsoRangeSurface( true );
    updateSelector( [true, true, true, true, true] );    
}

// ***** Process Button *****
const ProcessButton = document.getElementById('ProcessButton');
ProcessButton.onclick = () => {
    loadingContainer.innerHTML = "Processing<br>report...";
    loadingContainer.style['display'] = 'flex';
    setTimeout(()=>{
        loadingContainer.style['display'] = 'none';
        loadingContainer.innerHTML = "Loading...";
    }, 2000 );
}
