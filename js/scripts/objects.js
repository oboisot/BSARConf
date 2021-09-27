import * as THREE from "../three/three.module.js";
import * as ct from "./constants.js";

export { Carrier, IsoRangeSurface, Axes };

class Carrier {
    /* */
    constructor(altitude=3000, velocity=120,
                heading=0, roll=0, pitch=0,
                incidence=45, ant_squint=0, ground_squint=0,
                sight=true,
                leverx=0, levery=0, leverz=0,
                elvBeamWidth=16, aziBeamWidth=16,                
                coneLength=1e7, helpers=true) {
        // *****
        this.carrier               = new THREE.Mesh(); // Carrier referential (relative to World)
        this.antenna               = new THREE.Mesh(); // Antenna referential (relative to carrier)
        this.beam                  = new THREE.Mesh(); // Antenna beam (relative to antenna referential)
        this.footprint             = new THREE.Line(); // For plotting beam footprint
        this.elevationAngleLine    = new THREE.Line(); // Antenna elevation angle line plot
        this.azimuthAngleLine      = new THREE.Line(); // Antenna azimut angle line plot
        this.carrierVelocityVector = new THREE.ArrowHelper();  // Velocity vector orientated along y-axis of carrier
        this.footprintPoints = []; // keep footprint points for later computations
        // "private" properties
            // Basic vectors
        this._zero  = new THREE.Vector3( 0, 0, 0 );
        this._xAxis = new THREE.Vector3( 1, 0, 0 );
        this._yAxis = new THREE.Vector3( 0, 1, 0 );
        this._zAxis = new THREE.Vector3( 0, 0, 1 );
            // Antenna beam parameters
        this._beamRadiusY     = 0.0;
        this._beamRadiusZ     = 0.0;
        this._beamOriginWorld = new THREE.Vector3(); // The antenna position in World coordinates
        this._beamAxisWorld   = new THREE.Vector3(); // In local referential at beginning
            // Footprint constants parameters
        this._footprint_size             = 2501; // must be a multiple of 4 for antenna angle lines computation (see 'this._antenna_angles_lines_index')
        this._antenna_angles_lines_index = 625;
        // ***** Create a new carrier *****
        this._altitude      = altitude;
        this._velocity      = velocity;
        this._roll          = roll * ct.DEG_TO_RAD;
        this._pitch         = pitch * ct.DEG_TO_RAD;
        this._heading       = -heading * ct.DEG_TO_RAD;
        this._incidence     = incidence * ct.DEG_TO_RAD;
        this._ant_squint    = ant_squint * ct.DEG_TO_RAD;
        this._ground_squint = ground_squint * ct.DEG_TO_RAD;
        this._sight         = sight;
        this._lever         = new THREE.Vector3( leverx, levery, leverz );
        this._elvBeamWidth  = elvBeamWidth * ct.DEG_TO_RAD;
        this._aziBeamWidth  = aziBeamWidth * ct.DEG_TO_RAD;
        this._coneLength    = coneLength;
        this._helpers       = helpers;
        // ***** Infos Parameters *****
        this._loc_incidence_center    = 0;
        this._loc_incidence_min       = 0;
        this._loc_incidence_max       = 0;
        this._computed_squint         = 0;
        this._range_at_swath_center   = 0;
        this._range_min               = 0;
        this._range_max               = 0;
        this._ground_range_swath      = 0;
        this._footprint_area          = 0;
        this._illumination_time       = 0;
        this._footprint_abs_max_coord = 0; // max absolute footprint coordinates in plane

        // ***** Carrier referential *****
        this.carrier.visible = true;
        this.carrier.position.set( 0, 0, this._altitude );
        this.carrier.rotateZ( this._heading ) // Cap
                    .rotateY( this._roll )    // Roll
                    .rotateX( this._pitch );  // Pitch
        // Carrier AxesHelper
        if ( helpers ) {
            this.carrier.add( new THREE.AxesHelper( 100 ) );
        }
        this.carrier.name = "carrier"; // For getting getObjectByName

        // ***** Carrier velocity vector *****
        this.carrierVelocityVector = new THREE.ArrowHelper(
            this._yAxis,
            this._zero,
            5 * this._velocity,
            0xffff00,
            0.5 * this._velocity,
            0.5 * this._velocity
        );
        this.carrier.add( this.carrierVelocityVector );

        // ***** Antenna referential *****
        this.antenna.visible = true;
        this.antenna.position.copy( this._lever ); // Relative to carrier position
        if ( this._sight ) {// if true => left-looking
            this.antenna.rotateZ( -this._ground_squint )  // Ground squint first
                        .rotateY( ct.HALF_PI + this._incidence );
        } else {
            this.antenna.rotateZ( this._ground_squint )  // Ground squint first
                        .rotateY( ct.HALF_PI - this._incidence );
        }
        this.antenna.rotateZ( this._ant_squint ); // antenna squint last
        // Antenna AxesHelper
        if ( helpers ) {
            this.antenna.add( new THREE.AxesHelper( 100 ) );
        }
        this.antenna.name = "antenna"; // For getObjectByName

        // ***** Antenna beam *****
        this._beamRadiusY = this._coneLength * Math.tan( 0.5 * this._aziBeamWidth );
        this._beamRadiusZ = this._coneLength * Math.tan( 0.5 * this._elvBeamWidth );
        const coneGeometry = new THREE.ConeGeometry( 1, this._coneLength, 128, 16, true );
        coneGeometry.translate( 0, -0.5 * this._coneLength, 0);         // Define Cone Vertex as origin
        coneGeometry.rotateZ( ct.HALF_PI );                                // Define x-axis as cone axis
        coneGeometry.scale( 1, this._beamRadiusY , this._beamRadiusZ ); // In case of elliptic cone
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.1,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.beam.geometry = coneGeometry;
        this.beam.material = coneMaterial;
        this.beam.visible = true;
        this.beam.name = "beam"; // For getObjectByName

        // Adding beam to antenna to carrier
        this.carrier.add( this.antenna.add( this.beam ) );

        // Position carrier to have swath center at World origin
        this.carrierPosForSwathCenterAtWorldOrigin();

        // ***** Footprint *****
        // Footprint (NOTE : Footprint is added to the World referential)
        this.footprint.geometry = new THREE.BufferGeometry();
        this.footprint.material = new THREE.LineBasicMaterial();
        this.footprint.visible = true;
        this.footprint.name = "footprint";       
        
        // ***** Elevation angle line plot *****
        this.elevationAngleLine.geometry = new THREE.BufferGeometry();
        this.elevationAngleLine.material = new THREE.LineBasicMaterial({ color: 0x0000ff });
        this.elevationAngleLine.visible = true;
        this.elevationAngleLine.name = "elevationAngleLine";

        // ***** Elevation angle line plot *****
        this.azimuthAngleLine.geometry = new THREE.BufferGeometry();
        this.azimuthAngleLine.material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        this.azimuthAngleLine.visible = true;
        this.azimuthAngleLine.name = "azimuthAngleLine";
        
        // Footprint update
        this.updateFootprint();
    }

    // Getter
    getCarrier() {
        return this.carrier;
    }

    getAntenna() {
        return this.antenna;
    }

    getBeam() {
        return this.beam;
    }

    getCarrierPosition() {
        return this.carrier.position;
    }

    getCarrierAltitude() {
        return this._altitude;
    }

    getCarrierVelocity() {
        return this._velocity;
    }

    getCarrierVelocityVector() {
        const vel = new THREE.Vector3( 0, this._velocity, 0 ); // Velocity vector of carrier at beginning
        const quat = new THREE.Quaternion();
        this.carrier.getWorldQuaternion( quat ); // Get rotation of carrier relative to world
        return vel.applyQuaternion( quat );
    }

    getCarrierHeading() {
        return -this._heading * ct.RAD_TO_DEG;
    }

    getCarrierRoll() {
        return this._roll * ct.RAD_TO_DEG;
    }

    getCarrierPitch() {
        return this._pitch * ct.RAD_TO_DEG;
    }

    getAntennaPosition() {
        const pos = new THREE.Vector3();
        this.antenna.getWorldPosition( pos );
        return pos;
    }

    getAntennaLeverArm() {
        return this._lever;
    }

    getAntennaNominalIncidence() {
        return this._incidence * ct.RAD_TO_DEG;
    }

    getNominalAntennaSquint() {
        return this._ant_squint * ct.RAD_TO_DEG;
    }

    // Parameters infos
    getLocalIncidence() {
        return this._loc_incidence_center;
    }

    getLocalIncidenceMin() {
        return this._loc_incidence_min;
    }

    getLocalIncidenceMax() {
        return this._loc_incidence_max;
    }

    getComputedAntennaSquint() {
        return this._computed_squint;
    }

    getRangeAtSwathCenter() {
        return this._range_at_swath_center;
    }

    getRangeMin() {
        return this._range_min;
    }

    getRangeMax() {
        return this._range_max;
    }

    getGroundRangeSwath() {
        return this._ground_range_swath;
    }

    getFootprintArea() {
        return this._footprint_area;
    }

    getFootprintAbsMaxCoord() {
        return this._footprint_abs_max_coord;
    }

    getIlluminationTime() {
        return this._illumination_time;
    }

    // Setter
    setBeamColor(color) {
        this.beam.material.color.set( color );
        this.footprint.material.color.set( color );
    }
    
    setBeamOpacity(opacity) {
        this.beam.material.opacity = opacity;
    }
    
    setCarrierAltitude(altitude) {
        this._altitude = altitude;
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setCarrierVelocity(velocity) {
        this._velocity = velocity;
        this.carrierVelocityVector.setLength( 5 * this._velocity, 0.5 * this._velocity, 0.5 * this._velocity );
        this.illuminationTime(); // Update illumination time
    }

    setCarrierHeading(heading) {
        const _heading = this._heading; // Get old heading value
        this._heading = -heading * ct.DEG_TO_RAD;
        // We remove X and Y rotation thus apply new Z rotation and reapply back X and Y rotations.
        this.carrier.rotateX( -this._pitch )
                    .rotateY( -this._roll )
                    .rotateZ( this._heading - _heading )
                    .rotateY( this._roll )
                    .rotateX( this._pitch );
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setCarrierRoll(roll) {
        const _roll = this._roll; // Get old roll value
        this._roll = roll * ct.DEG_TO_RAD;
        // We remove X rotation thus apply new Y rotation and reapply back X rotation.
        this.carrier.rotateX( -this._pitch )
                    .rotateY( this._roll - _roll )
                    .rotateX( this._pitch );
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setCarrierPitch(pitch) {
        const _pitch = this._pitch; // Get old pitch value
        this._pitch = pitch * ct.DEG_TO_RAD;
        // We apply new pitch rotation
        this.carrier.rotateX( this._pitch - _pitch );
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setAntennaNominalIncidence(incidence) {
        const _incidence = this._incidence; // Get old incidence value
        this._incidence = incidence * ct.DEG_TO_RAD;
        // We remove squint rotaton first (Z rotation)
        this.antenna.rotateZ( -this._ant_squint );
        // We thus apply new incidence
        if ( this._sight ) {// if true => left-looking
            this.antenna.rotateY( this._incidence - _incidence );
        } else {
            this.antenna.rotateY( _incidence - this._incidence );
        }
        // Adding back squint
        this.antenna.rotateZ( this._ant_squint);
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setAntennaSquint( ant_squint ) {
        const _ant_squint = this._ant_squint; // Get old incidence value
        this._ant_squint = ant_squint * ct.DEG_TO_RAD;
        this.antenna.rotateZ( this._ant_squint - _ant_squint ); // Removing then adding new squint
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setGroundSquint( ground_squint ) {
        const _ground_squint = this._ground_squint; // Get old ground squint value
        this._ground_squint = ground_squint * ct.DEG_TO_RAD;
        this.antenna.rotateZ( -this._ant_squint ); // We remove squint first
        if ( this._sight ) { // if true => left-looking
            this.antenna.rotateY( -ct.HALF_PI - this._incidence )           // We remove incidence angle
                        .rotateZ( _ground_squint - this._ground_squint ) // Removing then adding new ground squint
                        .rotateY( ct.HALF_PI + this._incidence );           // We apply back incidence
        } else {
            this.antenna.rotateY( this._incidence - ct.HALF_PI )            // We remove incidence angle
                        .rotateZ( this._ground_squint - _ground_squint ) // Removing then adding new ground squint
                        .rotateY( ct.HALF_PI - this._incidence );           // We apply back incidence
        }
        this.antenna.rotateZ( this._ant_squint ); // Adding back squint
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setAntennaSight( sight ) {
        if ( sight != this._sight ) { // For stability
            this._sight = sight;
            this.antenna.rotateZ( -this._ant_squint ); // We remove squint first
            if ( this._sight ) { // if true => right-looking to left-looking
                this.antenna.rotateY( -ct.HALF_PI + this._incidence ) // We remove incidence angle from right-looking
                            .rotateZ( -2 * this._ground_squint )   // Removing ground squint from right-looking then adding for left-looking
                            .rotateY( ct.HALF_PI + this._incidence ); // We apply incidence for left-looking
            } else { // if false => left-looking to right-looking
                this.antenna.rotateY( -ct.HALF_PI - this._incidence ) // We remove incidence angle from left-looking
                            .rotateZ( 2 * this._ground_squint )    // Removing ground squint from left-looking then adding for right-looking
                            .rotateY( ct.HALF_PI - this._incidence ); // We apply incidence for right-looking
            }
            this.antenna.rotateZ( this._ant_squint ); // Adding back squint
            this.carrierPosForSwathCenterAtWorldOrigin();
            this.updateFootprint();
        }
    }

    setAntennaLeverX(leverx) {
        this._lever.setX( leverx );
        this.antenna.position.setX( leverx ); // Relative to carrier position, could be used to add "bras de levier"
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setAntennaLeverY(levery) {
        this._lever.setY( levery );
        this.antenna.position.setY( levery ); // Relative to carrier position, could be used to add "bras de levier"
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setAntennaLeverZ(leverz) {
        this._lever.setZ( leverz );
        this.antenna.position.setZ( leverz ); // Relative to carrier position, could be used to add "bras de levier"
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setElevationBeamWidth(elv) {
        this._elvBeamWidth = elv * ct.DEG_TO_RAD;
        const _beamRadiusZ = this._beamRadiusZ; // Get old Z radius
        this._beamRadiusZ = this._coneLength * Math.tan( 0.5 * this._elvBeamWidth ); // Compute new Z radius
        // inverse scale factor thus apply new scale factor
        this.beam.geometry.scale(1, 1, this._beamRadiusZ / _beamRadiusZ);
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setAzimuthBeamWidth(azimut) {
        this._aziBeamWidth = azimut * ct.DEG_TO_RAD;
        const _beamRadiusY = this._beamRadiusY; // Get old Y radius
        this._beamRadiusY = this._coneLength * Math.tan( 0.5 * this._aziBeamWidth ); // Compute new Y radius
        // inverse scale factor thus apply new scale factor
        this.beam.geometry.scale(1, this._beamRadiusY / _beamRadiusY, 1);
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setAntennaLeverArm(x, y, z) { // Relative to Carrier
        this._lever.set( x, y, z );
        this.antenna.position.copy( this._lever ); // in carrier referential
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
    }

    setValueSelector( str_value, value ) { // For onchange bindings
        if ( str_value === 'altitude' ) {
            this.setCarrierAltitude( value );
        }
        if ( str_value === 'velocity' ) {
            this.setCarrierVelocity( value );
        }
        if ( str_value === 'heading' ) {
            this.setCarrierHeading( value );
        }
        if ( str_value === 'roll' ) {
            this.setCarrierRoll( value );
        }
        if ( str_value === 'pitch' ) {
            this.setCarrierPitch( value );
        }
        if ( str_value === 'incidence' ) {
            this.setAntennaNominalIncidence( value );
        }
        if ( str_value === 'antennaSquint' ) {
            this.setAntennaSquint( value );
        }
        if ( str_value === 'groundSquint' ) {
            this.setGroundSquint( value );
        }
        // if ( str_value === 'sight') { // Particular case, must be treated independently
        //     this.setAntennaSight( value );
        // }
        if ( str_value === 'leverX' ) {
            this.setAntennaLeverX( value );
        }
        if ( str_value === 'leverY' ) {
            this.setAntennaLeverY( value );
        }
        if ( str_value === 'leverZ' ) {
            this.setAntennaLeverZ( value );
        }
        if ( str_value === 'elvBeamWidth' ) {
            this.setElevationBeamWidth( value );
        }
        if ( str_value === 'aziBeamWidth' ) {
            this.setAzimuthBeamWidth( value );
        }
    }

    // Methods
    addToScene(scene) {
        scene.add( this.carrier );
        scene.add( this.footprint );
        scene.add( this.elevationAngleLine );
        scene.add( this.azimuthAngleLine );
    }

    removeFromScene(scene) {
        scene.remove( this.carrier );
        scene.remove( this.footprint );
        scene.remove( this.elevationAngleLine );
        scene.remove( this.azimuthAngleLine );
    }

    carrierPosForSwathCenterAtWorldOrigin() {
        // Translate Carrier position to have Antenna beam center at center of referential:
        // -> compute line-plane intersection of Antenna beam considering Carrier at position
        // (0, 0, altitude) then apply opposite translation (taking into account Antenna position
        // in Carrier referential)
        this.carrier.updateMatrixWorld( true ); // Update Carrier and its children World Matrix
        this._beamAxisWorld.copy( this._xAxis ).applyMatrix3( this.antenna.matrixWorld ); // Get beam axis in World referential
        if ( Math.abs( this._beamAxisWorld.z ) > 0 ) { // if dz != 0
            const OC = new THREE.Vector3(),      // carrier position in World referential
                  CA = new THREE.Vector3();      // Antenna position in World referential
            this.carrier.getWorldPosition( OC );
            this.antenna.getWorldPosition( CA ); // get antenna World position (OA)
            CA.sub( OC );                        // Carrier -> Antenna vector in World referential: CA = OA - OC           
            this.carrier.position.set( ( this._altitude + CA.z) * this._beamAxisWorld.x / this._beamAxisWorld.z - CA.x,
                                       ( this._altitude + CA.z) * this._beamAxisWorld.y / this._beamAxisWorld.z - CA.y,
                                       this._altitude );
        }
    }

    updateFootprint() {
        // Update World Matrix
        this.antenna.updateMatrixWorld();
        const m = new THREE.Matrix3().setFromMatrix4( this.antenna.matrixWorld ),
              minv = m.clone().transpose(),
              ty = Math.tan( 0.5 * this._aziBeamWidth ),
              tz = Math.tan( 0.5 * this._elvBeamWidth );
        // Get plane parameters in Cone referential:
        // Point of plane: AP = OP - OA
        // normal of plane: n = minv * z (here z is the plane normal)
        const OA = new THREE.Vector3();
        this.antenna.getWorldPosition( OA ); // Antenna world position
        const AP = OA.clone().negate().applyMatrix3( minv ), // Point of plane in cone referential
              n = this._zAxis.clone().applyMatrix3( minv ),  // normal of plane in cone referential
              dvec = n.clone().multiply( AP ),
              d = dvec.x + dvec.y + dvec.z;                  // plane constant
        //
        const dt = 2 * Math.PI / (this._footprint_size - 1);
        this.footprintPoints = [];
        this.footprintPoints.length = this._footprint_size;
        //
        let xmax = 0;
        // Compute range min and range max and find their corresponding points index
        let dist = 0,
            minDist = Number.MAX_VALUE,
            maxDist = 0,
            indexMinDist = 0,
            indexMaxDist = 0;
        for ( let i = 0 ; i < this._footprint_size ; ++i ){
            const t = i * dt,
                  c = Math.cos( t ),
                  s = Math.sin( t ),
                  f = d / (n.x + n.y * ty * c + n.z * tz * s);
            const point  = new THREE.Vector3( f, ty * c * f, tz * s * f )
                               .applyMatrix3( m )
                               .add( OA )
                               .setZ( 0 ); // ensure to have a real zero
            this.footprintPoints[i] = point;
            //
            xmax = Math.max( xmax, Math.abs( point.x ), Math.abs( point.y ) );
            //
            dist = OA.distanceTo( point );
            if ( dist < minDist ) {
                minDist = dist;
                indexMinDist = i;
            }
            if ( dist > maxDist ) {
                maxDist = dist;
                indexMaxDist = i;
            }
        }
        /* Calcul des points au sol des ouvertures antennes 
           Ils correspondent au 4 quadrants dans l'intersection cone/plan dans le repère
           du cone.
        */
        this.elevationAngleLine.geometry.setFromPoints( [this.footprintPoints[this._antenna_angles_lines_index], // footprintPoints at pi/2
                                                         this.footprintPoints[3*this._antenna_angles_lines_index]] ); // footprintPoints at 3pi/2
        this.elevationAngleLine.geometry.verticesNeedUpdate = true;
        this.azimuthAngleLine.geometry.setFromPoints( [this.footprintPoints[0],                                     // footprintPoints at 0
                                                       this.footprintPoints[2*this._antenna_angles_lines_index]] ); // footprintPoints at pi
        this.azimuthAngleLine.geometry.verticesNeedUpdate = true;
        /* ================================================ */
        // Set new geometry points of the footprint
        this.footprint.geometry.setFromPoints( this.footprintPoints );
        this.footprint.geometry.verticesNeedUpdate = true;
        // max absolute footprint coordinates in plane
        this._footprint_abs_max_coord = xmax;
        // Range min and max
        this._range_min = minDist;
        this._range_max = maxDist;
        // Ground range swath
        const pointMin = this.footprintPoints[indexMinDist],
              pointMax = this.footprintPoints[indexMaxDist];
        this._ground_range_swath = pointMin.distanceTo( pointMax );
        // Compute the antenna 3dB footprint area of this Carrier using the "Shoelace" formula.
        let area = 0;
        const cross = new THREE.Vector3();
        for (let i = 0 ; i < this._footprint_size - 1 ; ++i) {
            area += cross.crossVectors(this.footprintPoints[i], this.footprintPoints[i+1]).z; // Note: vertices are in the x0y plane, so the cross-product is only in z-axis. This allows to simplify calculations
        }
        this._footprint_area = 0.5 * Math.abs( area );
        // Local incidence
        const axis = this._beamAxisWorld.clone();
        this._loc_incidence_center = Math.acos( axis.clone().negate().dot( this._zAxis ) ) * ct.RAD_TO_DEG;
            // Min
        const axisMin = OA.clone().sub( pointMin ).normalize(),
              axisMax = OA.clone().sub( pointMax ).normalize();
        this._loc_incidence_min = Math.acos( axisMin.dot( this._zAxis ) ) * ct.RAD_TO_DEG;
        this._loc_incidence_max = Math.acos( axisMax.dot( this._zAxis ) ) * ct.RAD_TO_DEG;
        // Computed squint
        const vel = this.getCarrierVelocityVector().normalize();
        this._computed_squint = Math.asin( axis.dot( vel ) ) * ct.RAD_TO_DEG;
        // Slant range at swath center
        this._range_at_swath_center = OA.length();
        // Compute illumination time
        this.illuminationTime();
    }

    illuminationTime() {
        // Compute the illumination time from the intersection of the footprint with
        // the velocity vector projection on the world plane (uses line/segment intersection)
        const velocity = this.getCarrierVelocity();
        const intersections = [new THREE.Vector3(), new THREE.Vector3()];
        if ( velocity > 0 ) {
            const velocityVector = this.getCarrierVelocityVector(),                  
                  vx = velocityVector.x,
                  vy = velocityVector.y;
            let count = 0; // Number of intersection points
            for (let i = 0 ; i < this._footprint_size - 1 ; ++i) {
                const e1x = this.footprintPoints[i].x,   // first footprint point
                      e1y = this.footprintPoints[i].y,
                      e2x = this.footprintPoints[i+1].x, // second footprint point
                      e2y = this.footprintPoints[i+1].y,
                      v = (vy * e1x - vx * e1y) / (vx * (e2y - e1y) - vy * (e2x - e1x));
                if ( (v >= 0) && (v < 1) ) {
                    intersections[count].set( e1x + v * (e2x - e1x), e1y + v * (e2y - e1y), 0 );
                    count += 1;
                    if ( count > 1 ) { break; } // Only two intersection points
                }
            }
            this._illumination_time = intersections[0].distanceTo( intersections[1] ) / velocity;
        } else { // velocity = 0, illmination time is infinite
            this._illumination_time = null;
        }
    }

    groundAngularVelocity() {
        // Compute the angular velocity of this carrier relative to the referential normal (here z axis)
        const r = this.carrier.position.clone().setZ(0),   // the rejection of the position vector in the referential plane
              v = this.getCarrierVelocityVector().setZ(0), // rejection of velocity vector in the referential plane 
              r2 = r.lengthSq();
        // returns the norm of the ground angular velocity
        return r.cross( v ).divideScalar(r2).length();
    }
}

class IsoRangeSurface {
    constructor ( TxCarrier, RxCarrier ) { // Tx and Rx antennas in world coordinate
        // "private" properties
        this._xAxis = new THREE.Vector3( 1, 0, 0 );
        this._yAxis = new THREE.Vector3( 0, 1, 0 );
        this._zAxis = new THREE.Vector3( 0, 0, 1 );
        this._m = new THREE.Matrix3();  // Rotation matrix only -> for ground iso-Range contours
        // ***** Iso-Range Mesh object
        this.isoRangeSurface       = new THREE.Mesh(); // Relative to World
        this.groundIsoRangeContour = new THREE.Line(); // For plotting ground iso-Range contour
        this.matrixWorld = new THREE.Matrix4(); // set the transformation matrix : rotation: from (u, v, w) ; translation: from OE (centerPosition) ; scale: from a, b
        // Adding Geometry and Material
        this.isoRangeSurface.geometry = new THREE.SphereBufferGeometry( 1, 128, 128 );
        this.isoRangeSurface.material = new THREE.MeshBasicMaterial({
            color: 0xd62728,
            opacity: 0.15,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.isoRangeSurface.name = "isoRangeSurface"; // For getting getObjectByName
        // groud iso-Range Contour geometry and material
        this.groundIsoRangeContour.geometry = new THREE.BufferGeometry();
        this.groundIsoRangeContour.material = new THREE.LineBasicMaterial({ color: 0xd62728 });
        this.updateIsoRangeSurface( TxCarrier, RxCarrier );
    }

    updateIsoRangeSurface( TxCarrier, RxCarrier ) {
        const OT = TxCarrier.getAntennaPosition(),
              OR = RxCarrier.getAntennaPosition(),
              TP = OT.clone().negate(), // here point P is the origin of the "World"
              RP = OR.clone().negate(),
              TR = OR.clone().sub( OT.clone() ),
              TPnorm = TP.length(),
              RPnorm = RP.length();
        // Ellipsoid center
        this.centerPosition = TR.clone().multiplyScalar( 0.5 ).add( OT );
        // Ellipsoid referential axes
        if ( TR.length() < 1e-10 ) { // Monostatic case
            this.u = this._xAxis.clone();
            this.v = this._yAxis.clone();
            this.w = this._zAxis.clone();
        } else {
            this.u = TR.clone().normalize();
            this.v = this._zAxis.clone().cross( this.u );
            if ( this.v.lengthSq() > 0 ) { // if u and z are not colinear
                this.v.normalize();
            } else {
                this.v = new THREE.Vector3( 1, 0, 0 );
            }
            this.w = this.u.clone().cross( this.v ).normalize();
        }
        // Ellipsoid radii
        this.xRadius = 0.5 * ( TPnorm + RPnorm  );
        this.yRadius = Math.sqrt( 0.5 * (TPnorm * RPnorm + TP.dot( RP )) );
        // Update Position and Rotation
            // Apply inverse transform
        this.isoRangeSurface.geometry.applyMatrix4( this.matrixWorld.invert() );
        // set the transformation matrix :
        // - rotation: from (u, v, w)
        // - translation: from OE
        // - scale: from a, b
        this.matrixWorld.set( 
            this.u.x * this.xRadius, this.v.x * this.yRadius, this.w.x * this.yRadius, this.centerPosition.x,
            this.u.y * this.xRadius, this.v.y * this.yRadius, this.w.y * this.yRadius, this.centerPosition.y,
            this.u.z * this.xRadius, this.v.z * this.yRadius, this.w.z * this.yRadius, this.centerPosition.z,
                                  0,                       0,                       0,                     1
        );
           // ...then new transform
        this.isoRangeSurface.geometry.applyMatrix4( this.matrixWorld );
        // Ground iso-Range contour
            // Update rotation matrix only
        this._m.set(
            this.u.x, this.v.x, this.w.x,
            this.u.y, this.v.y, this.w.y,
            this.u.z, this.v.z, this.w.z
        );
        this.intersectWorldPlane();
    }

    intersectWorldPlane() {
        const size = 100, points = [],
              scale = new THREE.Vector3( this.xRadius, this.yRadius, this.yRadius ),
              minv = this._m.clone().transpose();
        // See : https://en.wikipedia.org/wiki/Ellipsoid#Plane_sections for computation principle
        // Get plane parameters in Ellipsoid referential:
        // Point of plane: EP = OP - OE
        // normal of plane: n = minv * z (here z is the plane normal)
        const EP = this.centerPosition.clone().negate().applyMatrix3( minv ),
              n = this._zAxis.clone().applyMatrix3( minv );
        // Plane constant (plane of the form: nx*(x-xp)+ny*(y-yp)+nz*(z-zp)=0 => nx*x+ny*y+nz*z = nx*xp+ny*yp+nz*zp = d)
        const dvec = n.clone().multiply( EP ),
              d = dvec.x + dvec.y + dvec.z;
        // Scale transform applied to plane: (Ellipsoid -> unit Sphere)
        // plane equation becomes : nx*a*u + ny*b*v + nz*c*w = d
        const m = n.clone().multiply( scale );
        // Expression of plane in its Hessian normal form (see : https://mathworld.wolfram.com/HessianNormalForm.html)
        // Plane becomes : mu*u + mv*v + mw*w = delta
        const delta = d / m.length();
        m.normalize(); // (mu, mv, mw)
        // Computation of intersection ellipse axes
        const f0 = new THREE.Vector3(),
              f1 = new THREE.Vector3(),
              f2 = new THREE.Vector3();
        if ( Math.abs( delta ) <= 1 ) { // Intersection is an ellipse (delta is the algebraic distance from the unit sphere to the plane)
            const rho = Math.sqrt( 1 - delta * delta );
            f0.copy( m.clone().multiplyScalar( delta ) );
            if ( Math.abs( Math.abs( m.z ) - 1 ) <= 1e-14 ) { // In case of m.z is +-1 (for numerical stability)
                f1.set( rho, 0, 0 ),
                f2.set( 0, rho, 0 );
            } else {
                const f = rho / Math.sqrt( m.x * m.x + m.y * m.y );
                f1.set( f * m.y, -f * m.x, 0 );
                f2.copy( m.clone().cross( f1 ) );
            }
            // Inverse scale transform . inverse rotation transform . inverse translation (for f0 only, which is the center of the ellipse)
            f0.multiply( scale ).applyMatrix3( this._m ).add( this.centerPosition );
            f1.multiply( scale ).applyMatrix3( this._m );
            f2.multiply( scale ).applyMatrix3( this._m );
            const dt = 2 * Math.PI / (size - 1);
            points.length = size;
            for ( let i = 0 ; i < size ; ++i ){
                const t = i * dt;
                points[i] = f0.clone()
                                .add( f1.clone().multiplyScalar( Math.cos( t ) ) )
                                .add( f2.clone().multiplyScalar( Math.sin( t ) ) )
                                .setZ( 0 ); // ensure to have a real zero
            }
        } // else: No intersection
        // Set new geometry points of the footprint
        this.groundIsoRangeContour.geometry.setFromPoints( points );
        this.groundIsoRangeContour.geometry.verticesNeedUpdate = true;
    }

    // Methods
    addToScene(scene) {
        scene.add( this.isoRangeSurface );
        scene.add( this.groundIsoRangeContour );
    }

    removeFromScene(scene) {
        scene.remove( this.isoRangeSurface );
        scene.remove( this.groundIsoRangeContour );
    }
}

class Axes {
    // // ***** Construct cartesian axes with arrows *****
    // origin = new THREE.Mesh();
    // xAxis  = new THREE.ArrowHelper();
    // yAxis  = new THREE.ArrowHelper();
    // zAxis  = new THREE.ArrowHelper();
    constructor ( size ) {
        // ***** Construct cartesian axes with arrows *****
        this.origin = new THREE.Mesh();
        this.xAxis  = new THREE.ArrowHelper();
        this.yAxis  = new THREE.ArrowHelper();
        this.zAxis  = new THREE.ArrowHelper();

        // Origin
        this.origin.geometry = new THREE.SphereBufferGeometry( 0.01 * size, 6, 6 );
        this.origin.material.color.set( 0xffa500 );

        const headLength = 0.1 * size,
              headWidth  = 0.1 * size;
        // X Axis
        this.xAxis.position.set( 0, 0, 0 );
        this.xAxis.setDirection( new THREE.Vector3( 1, 0, 0 ) );
        this.xAxis.setLength( size, headLength, headWidth );
        this.xAxis.setColor( new THREE.Color( 0xff0000 ) );
        // Y Axis
        this.yAxis.position.set( 0, 0, 0 );
        this.yAxis.setDirection( new THREE.Vector3( 0, 1, 0 ) );
        this.yAxis.setLength( size, headLength, headWidth );
        this.yAxis.setColor( new THREE.Color( 0x00ff00 ) );
        // Z Axis
        this.zAxis.position.set( 0, 0, 0 );
        this.zAxis.setDirection( new THREE.Vector3( 0, 0, 1 ) );
        this.zAxis.setLength( size, headLength, headWidth );
        this.zAxis.setColor( new THREE.Color( 0x0000ff ) );

        // Adding axes to origin
        this.origin.add( this.xAxis );
        this.origin.add( this.yAxis );
        this.origin.add( this.zAxis );
    }
    // Methods
    addToScene(scene) {
        scene.add( this.origin );
    }
}
