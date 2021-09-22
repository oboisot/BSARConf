import { Vector3, Matrix3, MathUtils } from "../three/three.module.js";

export {GeoCoords, WGS84, LocalCartesianENU,
        dd_to_dms, dms_to_dd};

/***** A simple container for geodetic coords *****/
class GeoCoords {
    constructor ( lon=0.0, lat=0.0, alt=0.0, degrees=true ) {
        this.set( lon, lat, alt, degrees );
    }
    /***** SETTER *****/
    set( lon, lat, alt, degrees=true ) {
        if ( degrees ) {
            this._lon_rad = MathUtils.degToRad( lon );
            this._lat_rad = MathUtils.degToRad( lat );
        } else {
            this._lon_rad = lon;
            this._lat_rad = lat;
        }
        this._alt = alt;
    }
    setLon( lon, degrees=true ) {
        if ( degrees ) {
            this._lon_rad = MathUtils.degToRad( lon );
        } else {
            this._lon_rad = lon;
        }
    }
    setLat( lat, degrees=true ) {
        if ( degrees ) {
            this._lat_rad = MathUtils.degToRad( lat );
        } else {
            this._lat_rad = lat;
        }
    }
    setAlt( alt ) {
        this._alt = alt;
    }
    clone() {
        return new GeoCoords( this._lon_rad, this._lat_rad, this._alt, false );
    }
    /***** GETTER *****/
    get lon_rad() { return this._lon_rad; }
    get lat_rad() { return this._lat_rad; }
    get lon_deg() { return MathUtils.radToDeg( this._lon_rad ); }
    get lat_deg() { return MathUtils.radToDeg( this._lat_rad ) ; }
    get alt() { return this._alt; }
}


/***** WGS84 Ellipsoid class *****/
/* see : https://epsg.org/datum_1156/World-Geodetic-System-1984-G1762.html
 * for constants definition.
 */
class WGS84 {
    constructor () {
        this._a  = 6378137.0;                 // Equatorial radius (semi-major axis)
        this._f  = 1.0 / 298.257223563;       // Flattening
        this._b  = (1.0 - this._f) * this._a; // Polar radius (semi-minor axis)
        this._e2 = this._f * (2.0 - this._f); // Excentricity squared
        // Convenient values, used multiple times
        this._1_e2 = 1.0 - this._e2;          // 1 - e²
        this._1_f  = 1.0 - this._f;           // 1 - f
    }

    /***** GETTER *****/
    getEquatorialRadius() { return this._a };
    getPolarRadius() { return this._b };
    getFirstFlattening() { return this._f };
    getExcentricitySquared() { return this._e2 };
    
    /* Compute the prime vertical radius at a given latitude lat (radians) */
    _primeVerticalCurvatureRadius( lat_rad ) {
        const slat = Math.sin( lat_rad );
        return this._a / (Math.sqrt( 1.0 - this._e2 * slat * slat ));
    }

    /* */
    geodeticToECEF( geocoords ) {
        const lon_rad = geocoords.lon_rad,
              lat_rad = geocoords.lat_rad,
              alt = geocoords.alt,
              nu = this._primeVerticalCurvatureRadius( lat_rad ),
              nuhcosphi = (nu + alt) * Math.cos( lat_rad );
        return new Vector3(
            nuhcosphi * Math.cos( lon_rad ),
            nuhcosphi * Math.sin( lon_rad ),
            (this._1_e2 * nu + alt) * Math.sin( lat_rad )
        );
    }

    /* Position accuracy of this conversion stays in double precision,
    that is about 1 nm */
    ECEFtoGeodetic( pos, maxiter=10 ) {
        const x = pos.x,
              y = pos.y,
              z = pos.z;
        // Computing phi with approximated Bowring formula, 1985
        const ae2 = this._a * this._e2,
              Rxy = Math.hypot( x, y ), // Distance from the Ellipsoid center in the equatorial plane
              invRxy = 1.0 / Rxy,
              u = Math.atan( z * (this._1_f + ae2 / Math.hypot( x, y, z )) * invRxy ),
              su = Math.sin( u ),
              cu = Math.cos( u );
        let lat_n = Math.atan( (z * this._1_f + ae2 * su * su * su) /     // Bowring formula
                               (this._1_f * (Rxy - ae2 * cu * cu * cu)));
        // Fixed point iterations [Note: at least one iteration is made]
        // Initialization with first iteration
        let nu = this._primeVerticalCurvatureRadius( lat_n ),
            lat_np1 = Math.atan( (z + this._e2 * Math.sin( lat_n ) * nu) * invRxy ), // lat(n+1) : n+1 th iteration
            err = Math.abs( lat_np1 - lat_n ); // absolute error between successive iterations (for convergence test)
        let it = 1; // Note: initialization count for 1 iteration
        while ( err >= Number.EPSILON && it < maxiter ) {
            lat_n = lat_np1;
            nu = this._primeVerticalCurvatureRadius( lat_n );
            lat_np1 = Math.atan( (z + this._e2 * Math.sin( lat_n ) * nu) * invRxy );
            err = Math.abs( lat_np1 - lat_n );
            ++it;
        }
        // Computing altitude [Bowring formula, 1985]
        const slat = Math.sin( lat_np1 );
        return new GeoCoords(
            Math.atan2( y, x ),  // Computing longitude
            lat_np1,
            Rxy * Math.cos( lat_np1 ) + z * slat - this._a * Math.sqrt( 1.0 - this._e2 * slat * slat ),
            false
        );
    }
}

class LocalCartesianENU extends WGS84 {
    constructor( point ) {
        super(); // Initialize WGS84 class
        this.setOrigin( point );
    }
    setOrigin( point ) {
        if ( point instanceof GeoCoords ) { // initialisation from geodetic coordinates
            this._origin_ecef = this.geodeticToECEF( point );
            this._origin_geodetic = point.clone();
        } else if ( point instanceof Vector3 ) { // initialisation from geocentric coordinates
            this._origin_ecef = point.clone();
            this._origin_geodetic = this.ECEFtoGeodetic( point );
        } else {
            console.log("Initialization must come from 'GeoCoords' or 'Vector3' origin point.");
        }
        const clon = Math.cos( this._origin_geodetic.lon_rad ),
              slon = Math.sin( this._origin_geodetic.lon_rad ),
              clat = Math.cos( this._origin_geodetic.lat_rad ),
              slat = Math.sin( this._origin_geodetic.lat_rad );
        // Axes of the ENU frame expressed in the ECEF frame
        this._e = new Vector3(-slon, clon, 0.0);
        this._n = new Vector3(-clon*slat, -slon*slat, clat);
        this._u = new Vector3(clon*clat, slon*clat, slat);
        // Rotation matrix from ENU to ECEF
        this._r_enu_to_ecef = new Matrix3();
        this._r_enu_to_ecef.set(
            this._e.x, this._n.x, this._u.x,
            this._e.y, this._n.y, this._u.y,
            this._e.z, this._n.z, this._u.z
        )
        // Rotation matrix from ECEF to ENU
        this._r_ecef_to_enu = this._r_enu_to_ecef.clone().transpose();
    }
    /***** GETTER *****/
    get originCartesianECEF() { return this._origin_ecef; }
    get originGeodetic() { return this._origin_geodetic; }
    get rotationFromENUtoECEF() { return this._r_enu_to_ecef; }
    get rotationFromECEFtoENU() { return this._r_ecef_to_enu; }
    getENUbasis( e, n, u ) {
        this._r_enu_to_ecef.extractBasis( e, n, u );
    }
    /***** Class methods *****/
    // Conversion for point coordinates
    convertPointFromENUtoECEF( point_enu ) {
        return point_enu.clone().applyMatrix3( this._r_enu_to_ecef ).add( this._origin_ecef );
    }
    convertPointFromECEFtoENU( point_ecef ) {
        return point_ecef.clone().sub( this._origin_ecef ).applyMatrix3( this._r_ecef_to_enu );
    }
    convertPointFromENUtoGeodetic( point_enu ) {
        return this.ECEFtoGeodetic( this.convertPointFromENUtoECEF( point_enu ) );
    }
    convertPointFromGeodeticToENU( geocoords ) {
        return this.convertPointFromECEFtoENU( this.geodeticToECEF( geocoords ) );
    }
    // Conversion for vector directions
    convertVectorFromENUtoECEF( vector ) {
        return vector.clone().applyMatrix3( this._r_enu_to_ecef );
    }
    converVectorFromECEFtoENU( vector ) {
        return vector.clone().applyMatrix3( this._r_ecef_to_enu );
    }
}

function dd_to_dms( dd ) {
    let d, m, s, tmp;
    if ( dd < 0 ) {
        d = -Math.floor( -dd );
        tmp = 60.0 * (d - dd);
        m = Math.floor( tmp );
        s = 60.0 * (tmp - m);
    } else {
        d = Math.floor( dd );
        tmp = 60.0 * (dd - d);
        m = Math.floor( tmp );
        s = 60.0 * (tmp - m);
    }
    return { d: d, m: m, s: s }
}

function dms_to_dd( d, m, s ) {
    if ( d < 0 ) {
        return -(-d + m * 60.0 + s * 3600.0);
    } else {
        return d + m * 60.0 + s * 3600.0;
    }
}
