import * as THREE from "../three/three.module.js";
import * as bsar from "./bsarfun.js";

export { drawIsoRangeDop, drawGAFAmp };

// *******************************************
// ***** ISO-RANGE and ISO-DOPPLER PLOTS *****
// *******************************************
function drawIsoRangeDop( TxCarrier, RxCarrier, fem, plot_div ) {
    const size = 101;
    const lem = bsar.C0 / fem;
    // bistatic range and doppler frequency calculation
    const xmax = 1.5 * RxCarrier.getFootprintAbsMaxCoord();    
    const xaxis = bsar.linspaced_array(-xmax, xmax, size);
    const OT = TxCarrier.getAntennaPosition(),
          OR = RxCarrier.getAntennaPosition(),
          VT = TxCarrier.getCarrierVelocityVector(),
          VR = RxCarrier.getCarrierVelocityVector();
    let OP = new THREE.Vector3(),
        TP = new THREE.Vector3(),
        RP = new THREE.Vector3();
    let bistatic_range = [],
        doppler_freq = [];
    bistatic_range.length = size;
    doppler_freq.length = size;
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
    const vertices = RxCarrier.footprint.geometry.vertices;
    let footprintx = [], footprinty = [];
    footprintx.length = vertices.length;
    footprinty.length = vertices.length;
    for (let i = 0 ; i < vertices.length ; ++i) {
        footprintx[i] = vertices[i].x;
        footprinty[i] = vertices[i].y;
    }

    let data = [
        { // iso-Range
            x: xaxis,
            y: xaxis,
            z: bistatic_range,
            type: 'contour',
            name: 'iso-Range',
            line: {
                width: 2,
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
            x: xaxis,
            y: xaxis,
            z: doppler_freq,
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
            x: footprintx,
            y: footprinty,
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

    let layout = {
        title: {
            text: "Ground iso-Range [m] and iso-Doppler [Hz] contours",
            font: {
                size: 12
            }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(255, 255, 255, 0.75)",
        font: {
            size: 12,
            color: "#fff"
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
    }

    let config = {
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
            click: () => {
                Plotly.relayout(plot_div,
                    {
                        paper_bgcolor: "rgba(255,255,255,1)",
                        plot_bgcolor: "rgba(255,255,255,1)",
                        'font.color': "#000"
                    });
                Plotly.downloadImage(plot_div,
                    {
                        format: 'svg', // one of png, svg, jpeg, webp
                        filename: 'ground_iso_range_dop',
                        height: 500,
                        width: 500,
                        scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
                    });
                Plotly.relayout(plot_div,
                    {
                        paper_bgcolor: "rgba(0,0,0,0)",
                        plot_bgcolor: "rgba(255,255,255,0.75)",
                        'font.color': "#fff"
                    });
            }
        },
        {
            name: 'export as png',
            icon: Plotly.Icons['camera-retro'],
            direction: 'up',
            click: () => {
                Plotly.relayout(plot_div,
                    {
                        paper_bgcolor: "rgba(255,255,255,1)",
                        plot_bgcolor: "rgba(255,255,255,1)",
                        'font.color': "#000"
                    });
                Plotly.downloadImage(plot_div,
                    {
                        format: 'png', // one of png, svg, jpeg, webp
                        filename: 'ground_iso_range_dop',
                        height: 500,
                        width: 500,
                        scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
                    });
                Plotly.relayout(plot_div,
                    {
                        paper_bgcolor: "rgba(0,0,0,0)",
                        plot_bgcolor: "rgba(255,255,255,0.75)",
                        'font.color': "#fff"
                    });
            }
        }
        ],
        displaylogo: false,
        scrollZoom: true,
        showLink: false
    }
    Plotly.newPlot( plot_div, data, layout, config );
}


// *******************************
// ***** GAF AMPLITUDE PLOTS *****
// *******************************
function drawGAFAmp( TxCarrier, RxCarrier, fem, bandwidth, tint, plot_div ) {
    const size = 151;
    const lem = bsar.C0 / fem;
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
    const B_C0 = bandwidth / bsar.C0,
          tint_lem = bsar_resolutions.tint / lem,
          betag = bsar_resolutions.bisector_vectors.betag.clone(),
          dbetag = bsar_resolutions.bisector_vectors.dbetag.clone();

    let r = new THREE.Vector3(); // Vector PP', here = OP
    let gaf_db = [];
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

    let data = [
        { // GAF amplitude
            x: xaxis,
            y: xaxis,
            z: gaf_db,
            type: 'contour',
            name: 'GAF amplitude',
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
            x: xaxis,
            y: xaxis,
            z: gaf_db,
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

    let layout = {
        title: {
            text: "Generalized Ambiguity Function amplitude",
            font: {
                size: 12
            }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(255,255,255,1)",
        font: {
            size: 12,
            color: "#fff"
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
    }

    let config = {
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
            click: () => {
                Plotly.relayout('plotGAFAmp',
                    {
                        paper_bgcolor: "rgba(255,255,255,1)",
                        plot_bgcolor: "rgba(255,255,255,1)",
                        'font.color': "#000"
                    });
                Plotly.downloadImage(plot_div,
                    {
                        format: 'svg', // one of png, svg, jpeg, webp
                        filename: 'gaf_amplitude',
                        height: 500,
                        width: 563.75,
                        scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
                    });
                Plotly.relayout(plot_div,
                    {
                        paper_bgcolor: "rgba(0,0,0,0)",
                        plot_bgcolor: "rgba(0,0,0,1)",
                        'font.color': "#fff"
                    });
            }
        },
        {
            name: 'export as png',
            icon: Plotly.Icons['camera-retro'],
            direction: 'up',
            click: () => {
                Plotly.relayout(plot_div,
                    {
                        paper_bgcolor: "rgba(255,255,255,1)",
                        plot_bgcolor: "rgba(255,255,255,1)",
                        'font.color': "#000"
                    });
                Plotly.downloadImage(plot_div,
                    {
                        format: 'png', // one of png, svg, jpeg, webp
                        filename: 'gaf_amplitude',
                        height: 500,
                        width: 563.75,
                        scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
                    });
                Plotly.relayout(plot_div,
                    {
                        paper_bgcolor: "rgba(0,0,0,0)",
                        plot_bgcolor: "rgba(0,0,0,1)",
                        'font.color': "#fff"
                    });
            }
        }
        ],
        displaylogo: false,
        scrollZoom: true,
        showLink: false
    }
    Plotly.newPlot( plot_div, data, layout, config );
}

