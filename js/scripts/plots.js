import * as THREE from "../three/three.module.js";
import * as bsar from "./bsarfun.js";
import { C0 } from "./constants.js";

export { drawIsoRangeDop, drawGAFIntensity };

// *******************************************
// ***** ISO-RANGE and ISO-DOPPLER PLOTS *****
// *******************************************
const isoRangeDopData = [
    { // iso-Range
        x: null,
        y: null,
        z: null,
        type: 'contour',
        name: 'iso-Range',
        line: {
            width: 4,
            color: '#d62728'
        },
        contours: {
            coloring: 'none',
            showlabels: true,
        },
        autocontour: true,
        ncontours: 50,
        showscale: false
    },
    { // iso-Doppler
        x: null,
        y: null,
        z: null,
        type: 'contour',
        name: 'iso-Doppler',
        line: {
            width: 2,
            color: '#1f77b4'
        },
        contours: {
            coloring: 'none',
            showlabels: true,
        },
        autocontour: true,
        ncontours: 50,
        showscale: false
    },
    { // RX footprint
        x: null,
        y: null,
        type: 'scatter',
        name: 'RX footprint',
        fill: 'tonexty',
        line: {
            width: 2,
            color: "#000"
        },
        showscale: false
    }
];

const isoRangeDopLayout = {
    title: {
        text: "Ground iso-Range [m] and iso-Doppler [Hz] contours",
        font: {
            size: 12
        }
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgb(255,255,255)",
    font: {
        size: 12,
        color: "#ffffff"
    },
    margin: {l: 50, r: 50, t: 50, b: 50},
    xaxis: {
        title: 'Easting [m]',
    },
    yaxis: {
        title: 'Northing [m]',
        scaleanchor: 'x',
        scaleratio: 1
    },
    showlegend: false,
    hovermode: false
};

const isoRangeDopConfig = {
    modeBarButtonsToRemove: [
        'hoverClosestCartesian',
        'hoverCompareCartesian',
        'toggleSpikelines',
        'autoScale2d',
        'zoom2d',
        'zoomIn2d',
        'zoomOut2d',
        'toImage'
    ],
    modeBarButtonsToAdd: [
    {
        name: 'export as svg',
        icon: Plotly.Icons['camera'],
        direction: 'up',
        click: ( plot_div ) => {
            Plotly.relayout(plot_div,
                {
                    paper_bgcolor: "rgb(255,255,255)",
                    'font.color': "#000000"
                });
            Plotly.downloadImage(plot_div,
                {
                    format: 'svg', // one of png, svg, jpeg, webp
                    filename: 'ground_iso_range_dop',
                    height: 500,
                    width: 563.75,
                    scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
                });
            Plotly.relayout(plot_div,
                {
                    paper_bgcolor: "rgba(0,0,0,0)",
                    'font.color': "#ffffff"
                });
        }
    },
    {
        name: 'export as png',
        icon: Plotly.Icons['camera-retro'],
        direction: 'up',
        click: ( plot_div ) => {
            Plotly.relayout(plot_div,
                {
                    paper_bgcolor: "rgb(255,255,255)",
                    'font.color': "#000000"
                });
            Plotly.downloadImage(plot_div,
                {
                    format: 'png', // one of png, svg, jpeg, webp
                    filename: 'ground_iso_range_dop',
                    height: 500,
                    width: 563.75,
                    scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
                });
            Plotly.relayout(plot_div,
                {
                    paper_bgcolor: "rgba(0,0,0,0)",
                    'font.color': "#ffffff"
                });
        }
    }
    ],
    displaylogo: false,
    scrollZoom: true,
    showLink: false
};

const isoRangeDopTextureLayout = {
    paper_bgcolor: "#8b8989",
    plot_bgcolor: "#8b8989",
    margin: {l: 0, r: 0, t: 0, b: 0},
    xaxis: {
        showgrid: false,
        zeroline: false,
        showline: false
    },
    yaxis: {
        scaleanchor: 'x',
        scaleratio: 1,
        showgrid: false,
        zeroline: false,
        showline: false
    },
    showlegend: false,
    hovermode: false
};

const isoRangeDopTextureConfig = {
    displayModeBar: false,
    displaylogo: false,
    scrollZoom: false,
    showLink: false
};

function drawIsoRangeDop( TxCarrier, RxCarrier, fem, plot_div, texture_div, size=51 ) {
    const lem = C0 / fem;
    // bistatic range and doppler frequency calculation
    const xmax = 2.0 * RxCarrier.getFootprintAbsMaxCoord();    
    const xaxis = bsar.linspaced_array(-xmax, xmax, size);
    const OT = TxCarrier.getAntennaPosition(),
          OR = RxCarrier.getAntennaPosition(),
          VT = TxCarrier.getCarrierVelocityVector(),
          VR = RxCarrier.getCarrierVelocityVector();
    const OP = new THREE.Vector3(),
          TP = new THREE.Vector3(),
          RP = new THREE.Vector3();
    const bistatic_range = isoRangeDopData[0].z = [],
          doppler_freq = isoRangeDopData[1].z = [];
    bistatic_range.length = doppler_freq.length = size;
    for (let i = 0; i < size; i++) {
        bistatic_range[i] = [];
        bistatic_range[i].length = size;
        doppler_freq[i] = [];
        doppler_freq[i].length = size;
        for(let j = 0; j < size; j++) {
            OP.set( xaxis[j], xaxis[i], 0 ); // note i <-> y ;  j <-> x
            TP.copy( OP.clone().sub( OT ) );
            RP.copy( OP.clone().sub( OR ) );
            bistatic_range[i][j] = bsar.bistatic_range( TP, RP );
            doppler_freq[i][j] = bsar.doppler_frequency( lem, TP, VT, RP, VR );
        }
    }
    // Rx footprint plane coordinates retrieval
    const footprint = RxCarrier.footprintPoints,
          footprintx = isoRangeDopData[2].x = [],
          footprinty = isoRangeDopData[2].y = [];
    for (let i = 0 ; i < footprint.length ; i+=25) { // we decimate the number of points
        footprintx.push( footprint[i].x );
        footprinty.push( footprint[i].y );
    }
    // **********************************
    // ***** PLOTTING ISO-RANGE/DOP *****
    // **********************************
    // Filling x and y data data for iso-range and iso-Doppler plot
    isoRangeDopData[0].x = isoRangeDopData[0].y = isoRangeDopData[1].x = isoRangeDopData[1].y = xaxis;
    isoRangeDopData[0].line.width = isoRangeDopData[1].line.width = 2; // ensure to have line width of 2 for iso-range and iso-doppler
    Plotly.react( plot_div, isoRangeDopData, isoRangeDopLayout, isoRangeDopConfig );
    Plotly.relayout( plot_div, isoRangeDopLayout ); // note : Plotly.react does some weird displaying sometimes here so we force relayout
    // **************************************************
    // ***** COMPUTING TEXTURE FOR isoRangeDopPlane *****
    // **************************************************
    isoRangeDopData[0].line.width = isoRangeDopData[1].line.width = 6; // larger line width for ground texture
    Plotly.react( texture_div,
                  isoRangeDopData.slice(0, 2), // only iso-range and iso-contours
                  isoRangeDopTextureLayout,
                  isoRangeDopTextureConfig );
    // return a Promise with planeSize and texture as dataURL
    return Plotly.toImage( texture_div, {format: 'png', width: 1080, height: 1080, scale: 3 } ).then(
        ( dataURL ) => {
            isoRangeDopData[0].line.width = isoRangeDopData[1].line.width = 2; // this prevent using line width of 6 when zooming and panning in the 'plot_div' plot
            return {
                planeSize: 2.0 * xmax,
                dataURL: dataURL
            }
        });
}


// *******************************
// ***** GAF INTENSITY PLOTS *****
// *******************************
const gafIntensityData = [
    { // GAF intensity
        x: null,
        y: null,
        z: null,
        type: 'contour',
        name: 'GAF intensity',
        colorscale: 'Greys',
        reversescale: false,
        zmin: -30,
        zmax: 0,
        autocontour: false,
        contours: {
            type: 'levels',                
            start: -30,
            end: 0,
            size: 0.25,
            coloring: 'fill',
            showlines: false,      
            showlabels: false,
        },
        colorbar: {
            title: {
                text: "RCS [dBm²]",
                side: 'right'
            },
            thickness: 20
        }
    },
    { // GAF amplitude
        x: null,
        y: null,
        z: null,
        type: 'contour',
        name: 'GAF contour',
        colorscale: 'Hot',
        reversescale: true,
        zmin: -21,
        zmax: 0,
        line: {
            width: 1,
        },
        autocontour: false,
        contours: {
            type: 'levels',                
            start: -21,
            end: -3,
            size: 3,
            coloring: 'lines',
            showlines: false,      
            showlabels: false,
        },
        showscale: false
    }
];

const gafIntensityLayout = {
    title: {
        text: "Generalized Ambiguity Function intensity",
        font: {
            size: 12
        }
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgb(0,0,0)",
    font: {
        size: 12,
        color: "#ffffff"
    },
    margin: {l: 50, r: 50, t: 50, b: 50},
    xaxis: {
        title: 'Easting [m]',
    },
    yaxis: {
        title: 'Northing [m]',
        scaleanchor: 'x',
        scaleratio: 1
    },
    hovermode: false
}

const gafIntensityConfig = {
    modeBarButtonsToRemove: [
        'hoverClosestCartesian',
        'hoverCompareCartesian',
        'toggleSpikelines',
        'autoScale2d',
        'zoom2d',
        'zoomIn2d',
        'zoomOut2d',
        'toImage'
    ],
    modeBarButtonsToAdd: [
    {
        name: 'export as svg',
        icon: Plotly.Icons['camera'],
        direction: 'up',
        click: ( plot_div ) => {
            Plotly.relayout('plotGAFAmp',
                {
                    paper_bgcolor: "rgb(255,255,255)",
                    plot_bgcolor: "rgb(255,255,255)",
                    'font.color': "#000000"
                });
            Plotly.downloadImage(plot_div,
                {
                    format: 'svg', // one of png, svg, jpeg, webp
                    filename: 'gaf_intensity',
                    height: 500,
                    width: 563.75,
                    scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
                });
            Plotly.relayout(plot_div,
                {
                    paper_bgcolor: "rgba(0,0,0,0)",
                    plot_bgcolor: "rgb(0,0,0)",
                    'font.color': "#fff"
                });
        }
    },
    {
        name: 'export as png',
        icon: Plotly.Icons['camera-retro'],
        direction: 'up',
        click: ( plot_div ) => {
            Plotly.relayout(plot_div,
                {
                    paper_bgcolor: "rgb(255,255,255)",
                    plot_bgcolor: "rgb(255,255,255)",
                    'font.color': "#000000"
                });
            Plotly.downloadImage(plot_div,
                {
                    format: 'png', // one of png, svg, jpeg, webp
                    filename: 'gaf_intensity',
                    height: 500,
                    width: 563.75,
                    scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
                });
            Plotly.relayout(plot_div,
                {
                    paper_bgcolor: "rgba(0,0,0,0)",
                    plot_bgcolor: "rgb(0,0,0)",
                    'font.color': "#fff"
                });
        }
    }
    ],
    displaylogo: false,
    scrollZoom: true,
    showLink: false
}

function drawGAFIntensity( TxCarrier, RxCarrier, fem, bandwidth, tint, plot_div, size=151 ) {
    const lem = C0 / fem;
    const TP = TxCarrier.getAntennaPosition().negate(),
          RP = RxCarrier.getAntennaPosition().negate(),
          VT = TxCarrier.getCarrierVelocityVector(),
          VR = RxCarrier.getCarrierVelocityVector();
    const bsar_resolutions = bsar.bistatic_sar_resolution(
        lem, bandwidth, TP, VT, RP, VR, tint );
    // Determining axis of the plane to compute the GAF
    let xmax;
    if ( (bsar_resolutions.ground_range_resolution > 1e6) || (bsar_resolutions.ground_lateral_resolution > 1e6) )
    {
        xmax = 1000.0;
    } else {
        xmax = 5.0 * Math.max( bsar_resolutions.ground_range_resolution,
                               bsar_resolutions.ground_lateral_resolution );
    }
    const xaxis = bsar.linspaced_array( -xmax, xmax, size );
    const B_C0 = bandwidth / C0,
          tint_lem = bsar_resolutions.tint / lem,
          betag = bsar_resolutions.bisector_vectors.betag.clone(),
          dbetag = bsar_resolutions.bisector_vectors.dbetag.clone();
    const r = new THREE.Vector3(); // Vector PP', here = OP
    const gaf_db = gafIntensityData[0].z = gafIntensityData[1].z = [];
    gaf_db.length = size;
    for (let i = 0; i < size; i++) {
        gaf_db[i] = [];
        gaf_db[i].length = size;
        for(let j = 0; j < size; j++) {
            r.set( xaxis[j], xaxis[i], 0 ); // note i <-> y ;  j <-> x
            gaf_db[i][j] = 20.0 * Math.log10( Math.abs (
                bsar.sinc( B_C0 * betag.dot( r ) ) *
                bsar.sinc( tint_lem * dbetag.dot( r ) )
            ) );
        }
    }
    // Filling x and y data data for gaf intensity plot
    gafIntensityData[0].x = gafIntensityData[0].y = gafIntensityData[1].x = gafIntensityData[1].y = xaxis;
    Plotly.react( plot_div, gafIntensityData, gafIntensityLayout, gafIntensityConfig );
}
