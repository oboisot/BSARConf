import * as THREE from "../three/three.module.js";

export { Carrier, IsoRangeSurface, Axes };

class Carrier {
    /* */
    constructor(altitude=3000, velocity=120,
                heading=0, roll=0, pitch=0,
                incidence=45, squint=0, sight=true,
                leverx=0, levery=0, leverz=0,
                siteAperture=16, aziAperture=16,                
                coneLength=1e9, helpers=true) {
        // *****
        this.carrier     = new THREE.Mesh();      // Carrier referential (relative to World)
        this.antenna     = new THREE.Mesh();      // Antenna referential (relative to carrier)
        this.beam        = new THREE.Mesh();      // Antenna beam (relative to antenna referential)
        this.footprint   = new THREE.Line();      // For plotting beam footprint
        this._beamRadiusY = 0.0;
        this._beamRadiusZ = 0.0;
        this._beamOriginWorld = new THREE.Vector3(); // The antenna position in World coordinates
        this._beamAxisWorld = new THREE.Vector3();   // In local referential at beginning
        this._raycaster   = new THREE.Raycaster();    // For computing swath center
        //
        this.carrierVelocityVector = new THREE.ArrowHelper();  // Velocity vector orientated along y-axis of carrier
        // "private" properties
        this._zero  = new THREE.Vector3( 0, 0, 0 ); // Lever arm
        this._xAxis = new THREE.Vector3( 1, 0, 0 );
        this._yAxis = new THREE.Vector3( 0, 1, 0 );
        this._zAxis = new THREE.Vector3( 0, 0, 1 );
        this._refPlaneMesh = new THREE.Mesh( new THREE.PlaneGeometry( 1e9, 1e9, 1, 1) ); // Mesh representation of World reference plane
        this._refPlaneMath = new THREE.Plane( this._zAxis, 0 ); // Mathematical representation of World reference plane

        // ***** Create a new carrier *****
        this._altitude     = altitude;
        this._velocity     = velocity;
        this._heading      = THREE.MathUtils.degToRad( -heading );
        this._roll         = THREE.MathUtils.degToRad( roll );
        this._pitch        = THREE.MathUtils.degToRad( pitch );
        this._incidence    = THREE.MathUtils.degToRad( incidence );
        this._squint       = THREE.MathUtils.degToRad( squint );
        this._sight        = sight;
        this._lever        = new THREE.Vector3( leverx, levery, leverz );
        this._siteAperture = THREE.MathUtils.degToRad( siteAperture );
        this._aziAperture  = THREE.MathUtils.degToRad( aziAperture );
        this._coneLength   = coneLength;
        this._helpers      = helpers;
        // ***** Infos Parameters *****
        this._loc_incidence           = 0;
        this._computed_squint         = 0;
        this._range_at_swath_center   = 0;
        this._range_min               = 0;
        this._range_max               = 0;
        this._footprint_area          = 0;
        this._footprint_abs_max_coord = 0; // max absolute footprint coordinates in plane

        // ***** Carrier referential *****
        this.carrier.visible = true;
        this.carrier.position.set( 0, 0, this._altitude );
        this.carrier.rotateZ( this._heading ); // Cap
        this.carrier.rotateY( this._roll );    // Roll
        this.carrier.rotateX( this._pitch );   // Pitch
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
            0x5B797E,
            0.5 * this._velocity,
            0.5 * this._velocity
        );
        this.carrier.add( this.carrierVelocityVector );

        //console.log("vector direction : " + this.carrierVelocityVector.line.geometry);

        // ***** Antenna referential *****
        this.antenna.visible = true;
        this.antenna.position.copy( this._lever ); // Relative to carrier position, could be used to add "bras de levier"
        if ( this._sight ) {// if true => left-looking
            this.antenna.rotateY( 0.5 * Math.PI + this._incidence );
        } else {
            this.antenna.rotateY( 0.5 * Math.PI - this._incidence );
        }
        this.antenna.rotateZ( this._squint ); // squint
        // Antenna AxesHelper
        if ( helpers ) {
            this.antenna.add( new THREE.AxesHelper( 100 ) );
        }
        this.antenna.name = "antenna"; // For getting getObjectByName

        // ***** Antenna beam *****
        this._beamRadiusY = this._coneLength * Math.tan( 0.5 * this._aziAperture );
        this._beamRadiusZ = this._coneLength * Math.tan( 0.5 * this._siteAperture );
        const coneGeometry = new THREE.ConeGeometry( 1, this._coneLength, 1024, 1, true );
        coneGeometry.translate( 0, -0.5 * this._coneLength, 0);       // Define Cone Vertex as origin
        coneGeometry.rotateZ( 0.5 * Math.PI );                  // Define x-axis as cone axis
        coneGeometry.scale( 1, this._beamRadiusY , this._beamRadiusZ );  // In case of elliptic cone
        const coneMaterial = new THREE.MeshLambertMaterial({// More efficient than : new THREE.MeshPhongMaterial({
            color: 0x000000,
            opacity: 0.25,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.beam.geometry = coneGeometry;
        this.beam.material = coneMaterial;
        this.beam.name = "beam"; // For getting getObjectByName

        // Adding beam to antenna to carrier
        this.carrier.add( this.antenna.add( this.beam ) );

        // Position carrier to have swath center at World origin
        this.carrierPosForSwathCenterAtWorldOrigin();

        // Footprint (NOTE : Footprint is added to the World referential)
        this.footprint.geometry = new THREE.Geometry();
        this.footprint.material = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.updateFootprint();
        this.updateInfos();
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
        return THREE.MathUtils.radToDeg( -this._heading ) ;
    }

    getCarrierRoll() {
        return THREE.MathUtils.radToDeg( this._roll ) ;
    }

    getCarrierPitch() {
        return THREE.MathUtils.radToDeg( this._pitch ) ;
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
        return THREE.MathUtils.radToDeg( this._incidence );
    }

    getNominalAntennaSquint() {
        return THREE.MathUtils.radToDeg( this._squint );
    }

    // Parameters infos
    getLocalIncidence() {
        return this._loc_incidence;
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

    getFootprintArea() {
        return this._footprint_area;
    }

    getFootprintAbsMaxCoord() {
        return this._footprint_abs_max_coord;
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
        this.updateInfos();
    }

    setCarrierVelocity(velocity) {
        this._velocity = velocity;
        this.carrierVelocityVector.setLength( 5 * this._velocity, 0.5 * this._velocity, 0.5 * this._velocity);
    }

    setCarrierHeading(heading) {
        const _heading = this._heading; // Get old heading value
        this._heading = THREE.MathUtils.degToRad( -heading );
        // We remove X and Y rotation thus apply new Z rotation and reapply back X and Y rotations.
        this.carrier.rotateX( -this._pitch )
                    .rotateY( -this._roll )
                    .rotateZ( this._heading - _heading )
                    .rotateY( this._roll )
                    .rotateX( this._pitch );
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setCarrierRoll(roll) {
        const _roll = this._roll; // Get old roll value
        this._roll = THREE.MathUtils.degToRad( roll );
        // We remove X rotation thus apply new Y rotation and reapply back X rotation.
        this.carrier.rotateX( -this._pitch )
                    .rotateY( this._roll - _roll )
                    .rotateX( this._pitch );
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setCarrierPitch(pitch) {
        const _pitch = this._pitch; // Get old pitch value
        this._pitch = THREE.MathUtils.degToRad( pitch );
        // We apply new pitch rotation
        this.carrier.rotateX( this._pitch - _pitch );
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setAntennaNominalIncidence(incidence) {
        const _incidence = this._incidence; // Get old incidence value
        this._incidence = THREE.MathUtils.degToRad( incidence );
        // We remove squint rotaton first (Z rotation)
        this.antenna.rotateZ( -this._squint );
        // We thus apply new incidence
        if ( this._sight ) {// if true => left-looking
            this.antenna.rotateY( this._incidence - _incidence );
        } else {
            this.antenna.rotateY( _incidence - this._incidence );
        }
        // Adding back squint
        this.antenna.rotateZ( this._squint );
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setAntennaSquint(squint) {
        const _squint = this._squint; // Get old incidence value
        this._squint = THREE.MathUtils.degToRad( squint );
        this.antenna.rotateZ( this._squint - _squint ); // Removing then adding new squint
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setAntennaSight(sight) {
        if ( sight != this._sight ) { // For stability
            this._sight = sight;
            // We remove squint rotaton first (Z rotation)
            this.antenna.rotateZ( -this._squint );
            // We thus apply new incidence
            if ( this._sight ) { // right-looking to left-looking
                this.antenna.rotateY( 2 * this._incidence );
            } else { // left-looking to right-looking
                this.antenna.rotateY( -2 * this._incidence );
            }
            // Adding back squint
            this.antenna.rotateZ( this._squint );
            this.carrierPosForSwathCenterAtWorldOrigin();
            this.updateFootprint();
            this.updateInfos();
        }
    }

    setAntennaLeverX(leverx) {
        this._lever.setX( leverx );
        this.antenna.position.setX( leverx ); // Relative to carrier position, could be used to add "bras de levier"
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setAntennaLeverY(levery) {
        this._lever.setY( levery );
        this.antenna.position.setY( levery ); // Relative to carrier position, could be used to add "bras de levier"
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setAntennaLeverZ(leverz) {
        this._lever.setZ( leverz );
        this.antenna.position.setZ( leverz ); // Relative to carrier position, could be used to add "bras de levier"
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setSiteAperture(site) {
        this._siteAperture = THREE.MathUtils.degToRad( site );
        const _beamRadiusZ = this._beamRadiusZ; // Get old Z radius
        this._beamRadiusZ = this._coneLength * Math.tan( 0.5 * this._siteAperture ); // Compute new Z radius
        // inverse scale factor thus apply new scale factor
        this.beam.geometry.scale(1, 1, this._beamRadiusZ / _beamRadiusZ);
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setAziAperture(azimut) {
        this._aziAperture = THREE.MathUtils.degToRad( azimut );
        const _beamRadiusY = this._beamRadiusY; // Get old Y radius
        this._beamRadiusY = this._coneLength * Math.tan( 0.5 * this._aziAperture ); // Compute new Y radius
        // inverse scale factor thus apply new scale factor
        this.beam.geometry.scale(1, this._beamRadiusY / _beamRadiusY, 1);
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
    }

    setAntennaLeverArm(x, y, z) { // Relative to Carrier
        this._lever.set( x, y, z );
        this.antenna.position.copy( this._lever ); // in carrier referential
        this.carrierPosForSwathCenterAtWorldOrigin();
        this.updateFootprint();
        this.updateInfos();
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
            return;
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
        if ( str_value === 'siteAperture' ) {
            this.setSiteAperture( value );
        }
        if ( str_value === 'aziAperture' ) {
            this.setAziAperture( value );
        }
    }

    // Methods
    addToScene(scene) {
        scene.add( this.carrier );
        scene.add( this.footprint );
    }

    removeFromScene(scene) {
        scene.remove( this.carrier );
        scene.remove( this.footprint );
    }

    carrierPosForSwathCenterAtWorldOrigin() {
        this.carrier.position.set( 0, 0, this._altitude ); // On se replace à l'origine et à la bonne altitude
        this.antenna.getWorldPosition( this._beamOriginWorld ); // Get cone origin position in World referential
        this._beamAxisWorld.copy( this._xAxis ).applyMatrix3( this.antenna.matrixWorld ); // Get beam axis in Wordl referential
        this._raycaster.set( this._beamOriginWorld, this._beamAxisWorld ); // Initialize RayCaster
        const center = this._raycaster.intersectObjects( [this._refPlaneMesh, ] )[0];
        if (center) {
            // Move carrier position to have World origin at Swath center
            this.carrier.position.set( -center.point.x, -center.point.y, this._altitude ); // Better solution when adding carrier orientation
        }
    }

    updateFootprint() {
        // ***** Cone-Plane intersection *****
        const a = new THREE.Vector3(),
              c = new THREE.Vector3();                                                                  // |-> only this one 
        const lineCA = new THREE.Line3(); // Only line from face C and A is needed with a cone : AB - BC - CA
        const point = new THREE.Vector3();
        const points = [];
        // Update World Matrix
        this.carrier.updateMatrixWorld();
        // Search footprint points
        let face;
        for (let i = 0 ; i < this.beam.geometry.faces.length ; ++i) {
            face = this.beam.geometry.faces[i];
            // Get positions of vertex on face A and C
            this.beam.localToWorld( a.copy( this.beam.geometry.vertices[face.a] ) );
            this.beam.localToWorld( c.copy( this.beam.geometry.vertices[face.c] ) );
            // Set the 3D line with this two positions
            lineCA.set( c, a );
            // Get intersection point
            this._refPlaneMath.intersectLine( lineCA, point );
            // Add it to the line
            if (point) {
                points.push( point.clone() );
            };
        }
        // Close the footprint
        points.push( points[0] ); // Close the footprint
        // Set new geometry points of the footprint
        this.footprint.geometry.setFromPoints( points );
        this.footprint.geometry.verticesNeedUpdate = true;
    }

    // Parameters computation
    localIncidence() {
        const axis = this._beamAxisWorld.clone().negate();
        return THREE.MathUtils.radToDeg( Math.acos( axis.dot( this._zAxis ) ) );
    }

    computedSquint() {
        const axis = this._beamAxisWorld.clone(),
              vel  = this.getCarrierVelocityVector().normalize();
        return THREE.MathUtils.radToDeg( Math.asin( axis.dot( vel ) ) );
    }

    rangeAtSwathCenter() {
        const pos = new THREE.Vector3();
        this.antenna.getWorldPosition( pos ); // World antenna position
        return pos.length(); // Norm from origin to antenna position.
    }

    rangeMin() {
        const pos = new THREE.Vector3();
        this.antenna.getWorldPosition( pos ); // World antenna position
        const vertices = this.footprint.geometry.vertices;
        let dist = 0;
        let minDist = pos.distanceTo( vertices[0] );
        for (let i = 1 ; i < vertices.length ; ++i) {
            dist = pos.distanceTo( vertices[i] );
            if ( dist < minDist ) {
                minDist = dist;
            }
        }
        return minDist;
    }

    rangeMax() {
        const pos = new THREE.Vector3();
        this.antenna.getWorldPosition( pos ); // World antenna position
        const vertices = this.footprint.geometry.vertices;
        let dist = 0;
        let maxDist = pos.distanceTo( vertices[0] );
        for (let i = 1 ; i < vertices.length ; ++i) {
            dist = pos.distanceTo( vertices[i] );
            if ( dist > maxDist ) {
                maxDist = dist;
            }
        }
        return maxDist;
    }

    rangeMinMax() {
        const pos = new THREE.Vector3();
        this.antenna.getWorldPosition( pos ); // World antenna position
        const vertices = this.footprint.geometry.vertices;
        let dist = 0;
        let minDist = pos.distanceTo( vertices[0] );
        let maxDist = minDist;
        for (let i = 1 ; i < vertices.length ; ++i) {
            dist = pos.distanceTo( vertices[i] );
            if ( dist < minDist ) {
                minDist = dist;
            }
            if ( dist > maxDist ) {
                maxDist = dist;
            }
        }
        return [minDist, maxDist];
    }

    footprintArea() {
        /**
         * Compute footprint area of this Carrier.
         *
         * Compute the antenna 3dB footprint area of this Carrier
         * using the "Shoelace" formula.
         */
        const vertices = this.footprint.geometry.vertices;
        let area = 0;
        let cross = new THREE.Vector3();
        for (let i = 0 ; i < vertices.length - 1 ; ++i) {
            area += cross.crossVectors(vertices[i], vertices[i+1]).z; // Note: vertices are in the x0y plane, so the cross-product is only in z-axis. This allows to simplify calculations
        }
        return 0.5 * Math.abs( area );
    }

    footprintAbsMaxPlaneCoord() {
        const vertices = this.footprint.geometry.vertices;
        let xmax = 0;
        for (let i = 0 ; i < vertices.length ; ++i) {
            xmax = Math.max( xmax, Math.abs( vertices[i].x ), Math.abs( vertices[i].y ) );
        }
        return xmax
    }

    maxIlluminationTime() {
        /** Compute the maximum illumination time of the illuminated point
         * 
         * 
         */

    }

    updateInfos() {
        this._loc_incidence = this.localIncidence();
        this._computed_squint = this.computedSquint();
        this._range_at_swath_center = this.rangeAtSwathCenter();
        [this._range_min, this._range_max] = this.rangeMinMax();
        this._footprint_area = this.footprintArea();
        this._footprint_abs_max_coord = this.footprintAbsMaxPlaneCoord();
    }
}

class IsoRangeSurface {
    constructor ( TxCarrier, RxCarrier ) { // Tx and Rx antennas in world coordinate
        // ***** Iso-Range Mesh object
        this.isoRangeSurface       = new THREE.Mesh(); // Relative to World
        this.groundIsoRangeContour = new THREE.Line(); // For plotting ground iso-Range contour
        this.matrixWorld = new THREE.Matrix4(); // set the transformation matrix : rotation: from (u, v, w) ; translation: from OE (centerPosition) ; scale: from a, b
        this._m = new THREE.Matrix3();  // Rotation matrix only -> for ground iso-Range contours
        // "private" properties
        this._xAxis = new THREE.Vector3( 1, 0, 0 );
        this._yAxis = new THREE.Vector3( 0, 1, 0 );
        this._zAxis = new THREE.Vector3( 0, 0, 1 );
        // Adding Geometry and Material
        this.isoRangeSurface.geometry = new THREE.SphereGeometry( 1, 64, 64 );
        this.isoRangeSurface.material = new THREE.MeshLambertMaterial({
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
        console.log("m = ", m);
        // Computation of intersection ellipse axes
        const f0 = new THREE.Vector3(),
              f1 = new THREE.Vector3(),
              f2 = new THREE.Vector3();
        if ( Math.abs(delta) <= 1 ) { // Intersection is an ellipse (delta is the distance from the unit sphere to the plane)
            const rho = Math.sqrt( 1 - delta * delta );
            f0.copy( m.clone().multiplyScalar( delta ) );
            if ( Math.abs( m.z - 1 ) <= 1e-14 ) { // In case of m.z is almost one (for numerical stability)
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
            console.log("f0 = ", f0);
            console.log("f1 = ", f1);
            console.log("f2 = ", f2);
            const dt = 2 * Math.PI / (size - 1);
            points.length = size;
            for ( let i = 0 ; i < size ; ++i ){
                const t = i * dt;
                points[i] = f0.clone()
                                .add( f1.clone().multiplyScalar( Math.cos( t ) ) )
                                .add( f2.clone().multiplyScalar( Math.sin( t ) ) )
                                .setZ( 0 ); // ensure to have a real zero
                console.log(points[i]);
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
