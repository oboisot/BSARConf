import * as ct from "./constants.js";
export {
    bistatic_angle,
    bistatic_range, bistatic_range_minmax, doppler_frequency, doppler_rate, doppler_bandwidth,
    bisector_vector, bisector_vector_derivative,
    ground_bisector_vector,  ground_bisector_vector_derivative,
    bisector_vectors, bistatic_sar_resolution,
    compute_nesz,
    linspaced_array,
    sinc,
};

// ***** BSAR functions *****
/*
    tx_vec is the Transmitter - target vector
    rx_vec is the Receiver - target vector
*/
function bistatic_angle( tx_vec, rx_vec ) {
    return 2.0 * Math.acos(
               0.5 * tx_vec.clone().normalize().add(
                   rx_vec.clone().normalize() ).length() );
}

/*

*/
function bistatic_range( tx_vec, rx_vec ) {
    return tx_vec.length() + rx_vec.length();
}

/* Compute min and max range of bistatic SAR system.
   Range is computed from transmitter antenna to receiver footprint.
*/
function bistatic_range_minmax( tx_vec, rx_vec, rx_footprint ) {
    let dist = 0,
        minDist = Number.MAX_VALUE,
        maxDist = 0;
    for ( let i = 0 ; i < rx_footprint.length ; ++i ){
        const point = rx_footprint[i];
        dist = tx_vec.distanceTo( point ) + rx_vec.distanceTo( point );
        if ( dist < minDist ) {
            minDist = dist;
        }
        if ( dist > maxDist ) {
            maxDist = dist;
        }
    }
    return {
        range_min: minDist,
        range_max: maxDist
    }
}

/*

*/
function doppler_frequency( lem, tx_vec, tx_vel, rx_vec, rx_vel ) {
    return (tx_vel.dot( tx_vec.clone().normalize() ) +
            rx_vel.dot( rx_vec.clone().normalize() )) / lem;
}

/* */
function doppler_rate( lem, tx_vec, tx_vel, rx_vec, rx_vel ) {
    const singamma_tx = tx_vel.clone().normalize().dot( tx_vec.clone().normalize() ),
          singamma_rx = rx_vel.clone().normalize().dot( rx_vec.clone().normalize() );
    return -(tx_vel.lengthSq() * (1 - singamma_tx * singamma_tx) / tx_vec.length() +
             rx_vel.lengthSq() * (1 - singamma_rx * singamma_rx) / rx_vec.length()) / lem;
}

function doppler_bandwidth( doppler_rate, tint ) {
    return tint * Math.abs( doppler_rate );
}

/* Slant BSAR bisector vector */
function bisector_vector( tx_vec, rx_vec ) {
    return tx_vec.clone().normalize().add( rx_vec.clone().normalize() );
}

/* Projection onto x-y plane of the slant BSAR bisector vector */
function ground_bisector_vector( tx_vec, rx_vec ) {
    return bisector_vector( tx_vec, rx_vec ).setZ( 0 );
}

/* Slant derivative of the BSAR bisector vector */
function bisector_vector_derivative( tx_vec, tx_vel, rx_vec, rx_vel ) {
    const utx = tx_vec.clone().normalize(),
          urx = rx_vec.clone().normalize();
    return tx_vel.clone().sub( utx.clone().multiplyScalar( utx.dot( tx_vel ) ) )
           .divideScalar( tx_vec.length() )
           .add(
           rx_vel.clone().sub( urx.clone().multiplyScalar( urx.dot( rx_vel ) ) )
           .divideScalar( rx_vec.length() ))
           .negate();
}

/* Projection onto x-y plane of the slant derivative of the BSAR bisector vector */
function ground_bisector_vector_derivative( tx_vec, tx_vel, rx_vec, rx_vel ) {
    return bisector_vector_derivative( tx_vec, tx_vel, rx_vec, rx_vel ).setZ( 0 );
}

function bisector_vectors( tx_vec, tx_vel, rx_vec, rx_vel )
{
    const utx = tx_vec.clone().normalize(),
          urx = rx_vec.clone().normalize();
    const beta = utx.clone().add( urx ),
          dbeta = tx_vel.clone().sub( utx.clone().multiplyScalar( utx.dot( tx_vel ) ) )
                  .divideScalar( tx_vec.length() )
                  .add(
                  rx_vel.clone().sub( urx.clone().multiplyScalar( urx.dot( rx_vel ) ) )
                  .divideScalar( rx_vec.length() ))
                  .negate();
    return {
        beta:   beta,
        betag:  beta.clone().setZ( 0 ),
        dbeta:  dbeta,
        dbetag: dbeta.clone().setZ( 0 )
    };
}

/* Compute the half-power bistatic SAR resolutions */
function bistatic_sar_resolution( lem, bandwidth, tx_vec, tx_vel, rx_vec, rx_vel, tint='auto-ground' )
{
    const bisectors = bisector_vectors( tx_vec, tx_vel, rx_vec, rx_vel );
    const beta_norm = bisectors.beta.length(),
          betag_norm = bisectors.betag.length(),
          dbeta_norm = bisectors.dbeta.length(),
          dbetag_norm = bisectors.dbetag.length();
    let slant_range_resolution, slant_lateral_resolution,
        ground_range_resolution, ground_lateral_resolution,
        resolution_area;
    if (tint === 'auto-ground') { // estimate tint for ground 'squared' resolutions
        tint = bandwidth * lem / ct.C0 * betag_norm / dbetag_norm;
    } else if (tint === 'auto-slant') { // estimate tint for slant 'squared' resolutions
        tint = bandwidth * lem / ct.C0 * beta_norm / dbeta_norm;
    }
    slant_range_resolution    = ct.RES_FACTOR * ct.C0 / (bandwidth * beta_norm);
    slant_lateral_resolution  = ct.RES_FACTOR * lem / (tint * dbeta_norm);
    ground_range_resolution   = ct.RES_FACTOR * ct.C0 / (bandwidth * betag_norm);
    ground_lateral_resolution = ct.RES_FACTOR * lem / (tint * dbetag_norm);
    resolution_area           = ct.RES_AREA_FACTOR * lem * ct.C0 / (
        bandwidth * tint * bisectors.betag.clone().cross( bisectors.dbetag.clone() ).length());
    return {
        slant_range_resolution:    slant_range_resolution,
        slant_lateral_resolution:  slant_lateral_resolution,
        ground_range_resolution:   ground_range_resolution,
        ground_lateral_resolution: ground_lateral_resolution,
        resolution_area:           resolution_area,
        tint:                      tint,
        bisector_vectors:          bisectors
    };
}


/*
 * tx_peak_power: transmitter peak power [W]
 * tx_duty_cycle: transmitter duty cycle [%]
 * tx_loss_factor: transmitter total loss factor [dB]
 * tx_gain: transmission antenna power gain (one-way at transmission) [dB]
 * rx_temp: receiver temperature [k]
 * rx_noise_factor: receiver noise factor [dB]
 * rx_gain: reception antenna power gain (one-way at reception) [dB]
 * tx_vec: transmitter-target vector [m]
 * rx_vec: receiver-target vector [m]
 * lem: electromagnetic wavelength [m]
 * tint: integration time [s]
 * res_area: resolution cell area [m2]
 */
function compute_nesz( tx_peak_power, tx_duty_cycle, tx_loss_factor, tx_gain,
                       rx_temp, rx_noise_factor, rx_gain,
                       tx_vec, rx_vec, lem, tint, res_area ) {
    return (
        64 * ct.PI * ct.PI * ct.PI *
        tx_vec.lengthSq() * rx_vec.lengthSq() *
        ct.K * Math.pow(10, 0.1 * (tx_loss_factor + rx_noise_factor - tx_gain - rx_gain)) * rx_temp / // noise dsp + Rx and Rx gains
        (lem * lem *
         tx_peak_power * tx_duty_cycle * // mean transmitted power
         tint * res_area)
    )
}


/***************************
 ****** Array utility ******
 **************************/
function linspaced_array(start, stop, size) {
    const delta = (stop - start) / (size - 1);
    let x = [];
    x.length = size;
    for (let i = 0 ; i < size ; ++i)
    {
        x[i] = start + i * delta;
    }
    return x;
}


/*******************************
 ****** Special functions ******
 ******************************/
function sinc(x) {
    const arg = ct.PI * x;
    if ( Math.abs(x) < 1e-6 ) { // for double precision
        return 1.0 - arg * arg / 6;
    }
    return Math.sin( arg ) / arg;
}
