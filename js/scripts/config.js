// ***** BSAR configuration *****
export const BSARConfig =
{
    "Tx": {
        "altitude": {
            "value": 3000,
            "unit": "m"
        },
        "velocity": {
            "value": 120,
            "unit": "m/s"
        },
        "heading": {
            "value": 0,
            "unit": "°"
        },
        "roll": {
            "value": 0,
            "unit": "°"
        },
        "pitch": {
            "value": 0,
            "unit": "°"
        },
        "incidence": {
            "value": 60,
            "unit": "°"
        },
        "antennaSquint": {
            "value": 0,
            "unit": "°"
        },
        "groundSquint": {
            "value": 0,
            "unit": "°"
        },
        "sight": {
            "value": false,
            "unit": "bool (false=right ; true=left)"
        },
        "leverX": {
            "value": 0,
            "unit": "m"
        },
        "leverY": {
            "value": 0,
            "unit": "m"
        },
        "leverZ": {
            "value": 0,
            "unit": "m"
        },
        "elvBeamWidth": {
            "value": 20,
            "unit": "°"
        },
        "aziBeamWidth": {
            "value": 20,
            "unit": "°"
        },
        "gain": {
            "value": 20,
            "unit": "dB"
        },
        "centerFrequency": {
            "value": 9.65,
            "unit": "GHz"
        },
        "bandwidth": {
            "value": 300,
            "unit": "MHz"
        },
        "pulseDuration": {
            "value": 10,
            "unit": "µs"
        },
        "pri": {
            "value": 100,
            "unit": "µs"
        },
        "peakPower": {
            "value": 200,
            "unit": "W"
        },
        "lossFactor": {
            "value": 3,
            "unit": "dB"
        },
    },
    "Rx": {
        "altitude": {
            "value": 1000,
            "unit": "m"
        },
        "velocity": {
            "value": 36,
            "unit": "m/s"
        },
        "heading": {
            "value": 0,
            "unit": "°"
        },
        "roll": {
            "value": 0,
            "unit": "°"
        },
        "pitch": {
            "value": 0,
            "unit": "°"
        },
        "incidence": {
            "value": 45,
            "unit": "°"
        },
        "antennaSquint": {
            "value": 0,
            "unit": "°"
        },
        "groundSquint": {
            "value": 0,
            "unit": "°"
        },
        "sight": {
            "value": false,
            "unit": "bool (false=right ; true=left)"
        },
        "leverX": {
            "value": 0,
            "unit": "m"
        },
        "leverY": {
            "value": 0,
            "unit": "m"
        },
        "leverZ": {
            "value": 0,
            "unit": "m"
        },
        "elvBeamWidth": {
            "value": 16,
            "unit": "°"
        },
        "aziBeamWidth": {
            "value": 16,
            "unit": "°"
        },
        "gain": {
            "value": 20 ,
            "unit": "dB"
        },
        "noiseTemperature": {
            "value": 290,
            "unit": "K"
        },
        "noiseFactor": {
            "value": 3,
            "unit": "dB"
        },
        "integrationTime": {
            "value": "auto-ground",
            "unit": "string or s ('auto-ground', 'auto-slant' or number)"
        }
    }
}

export const Elements = {
    "Tx": {
        "altitude": {
            "element": document.getElementById('TxAltitude'),
            "needUpdate": [true, true, false, true, true], // render, infos Tx, infos Rx, BSAR infos, plots
            "isoRangeSurfaceUpdate": true // For Iso-Range Surface
        },
        "velocity": {
            "element": document.getElementById('TxVelocity'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "heading": {
            "element": document.getElementById('TxHeading'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "roll": {
            "element": document.getElementById('TxRoll'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "pitch": {
            "element": document.getElementById('TxPitch'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "incidence": {
            "element": document.getElementById('TxIncidence'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "antennaSquint": {
            "element": document.getElementById('TxAntennaSquint'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "groundSquint": {
            "element": document.getElementById('TxGroundSquint'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "sight": {
            "element": document.getElementById('TxSight'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "leverX": {
            "element": document.getElementById('TxLeverX'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "leverY": {
            "element": document.getElementById('TxLeverY'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "leverZ": {
            "element": document.getElementById('TxLeverZ'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "elvBeamWidth": {
            "element": document.getElementById('TxElvBeamWidth'), // render, infos Tx, infos Rx, BSAR infos, plots
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "aziBeamWidth": {
            "element": document.getElementById('TxAziBeamWidth'),
            "needUpdate": [true, true, false, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "gain": {
            "element": document.getElementById('TxGainTx'),
            "needUpdate": [false, false, false, true, false],
            "isoRangeSurfaceUpdate": false
        },
        "centerFrequency": {
            "element": document.getElementById('TxCenterFrequency'),
            "needUpdate": [false, false, false, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "bandwidth": {
            "element": document.getElementById('TxBandwidth'),
            "needUpdate": [false, false, false, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "pulseDuration": {
            "element": document.getElementById('TxPulseDuration'),
            "needUpdate": [false, false, false, true, false],
            "isoRangeSurfaceUpdate": false
        },
        "pri": {
            "element": document.getElementById('TxPRI'),
            "needUpdate": [false, false, false, true, false],
            "isoRangeSurfaceUpdate": false
        },
        "peakPower": {
            "element": document.getElementById('TxPeakPower'),
            "needUpdate": [false, false, false, true, false],
            "isoRangeSurfaceUpdate": false
        },
        "lossFactor": {
            "element": document.getElementById('TxLossFactor'),
            "needUpdate": [false, false, false, true, false],
            "isoRangeSurfaceUpdate": false
        },
        "infos": {
            "localIncidenceMin":     document.getElementById('TxInfosLocalIncidenceMin'),
            "localIncidenceCenter":  document.getElementById('TxInfosLocalIncidenceCenter'),
            "localIncidenceMax":     document.getElementById('TxInfosLocalIncidenceMax'),
            "antennaSquint":         document.getElementById('TxInfosAntennaSquint'),
            "rangeAtSwathCenter":    document.getElementById('TxInfosRangeAtSwathCenter'),
            "rangeMin":              document.getElementById('TxInfosRangeMin'),
            "rangeMax":              document.getElementById('TxInfosRangeMax'),
            "groundRangeSwath":      document.getElementById('TxInfosGroundRangeSwath'),
            "footprintArea":         document.getElementById('TxInfosFootprintArea'),
            "illuminationTime":      document.getElementById('TxInfosIlluminationTime'),
            "groundAngularVelocity": document.getElementById('TxInfosGroundAngularVelocity')
        }
    },
    "Rx": {
        "altitude": {
            "element": document.getElementById('RxAltitude'),
            "needUpdate": [true, false, true, true, true], // render, infos Tx, infos Rx, BSAR infos, plots
            "isoRangeSurfaceUpdate": true // For Iso-Range Surface
        },
        "velocity": {
            "element": document.getElementById('RxVelocity'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "heading": {
            "element": document.getElementById('RxHeading'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "roll": {
            "element": document.getElementById('RxRoll'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "pitch": {
            "element": document.getElementById('RxPitch'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "incidence": {
            "element": document.getElementById('RxIncidence'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "antennaSquint": {
            "element": document.getElementById('RxAntennaSquint'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "groundSquint": {
            "element": document.getElementById('RxGroundSquint'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "sight": {
            "element": document.getElementById('RxSight'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "leverX": {
            "element": document.getElementById('RxLeverX'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "leverY": {
            "element": document.getElementById('RxLeverY'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "leverZ": {
            "element": document.getElementById('RxLeverZ'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": true
        },
        "elvBeamWidth": {
            "element": document.getElementById('RxElvBeamWidth'), // render, infos Tx, infos Rx, BSAR infos, plots
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "aziBeamWidth": {
            "element": document.getElementById('RxAziBeamWidth'),
            "needUpdate": [true, false, true, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "gain": {
            "element": document.getElementById('RxGainRx'),
            "needUpdate": [false, false, false, true, false],
            "isoRangeSurfaceUpdate": false
        },
        "noiseTemperature": {
            "element": document.getElementById('RxNoiseTemperature'),
            "needUpdate": [false, false, false, true, false],
            "isoRangeSurfaceUpdate": false
        },
        "noiseFactor": {
            "element": document.getElementById('RxNoiseFactor'),
            "needUpdate": [false, false, false, true, false],
            "isoRangeSurfaceUpdate": false
        },
        "integrationTime": {
            "element": document.getElementById('RxIntegrationTime'),
            "needUpdate": [false, false, false, true, true],
            "isoRangeSurfaceUpdate": false
        },
        "infos": {
            "localIncidenceMin":     document.getElementById('RxInfosLocalIncidenceMin'),
            "localIncidenceCenter":  document.getElementById('RxInfosLocalIncidenceCenter'),
            "localIncidenceMax":     document.getElementById('RxInfosLocalIncidenceMax'),
            "antennaSquint":         document.getElementById('RxInfosAntennaSquint'),
            "rangeAtSwathCenter":    document.getElementById('RxInfosRangeAtSwathCenter'),
            "rangeMin":              document.getElementById('RxInfosRangeMin'),
            "rangeMax":              document.getElementById('RxInfosRangeMax'),
            "groundRangeSwath":      document.getElementById('RxInfosGroundRangeSwath'),
            "footprintArea":         document.getElementById('RxInfosFootprintArea'),
            "illuminationTime":      document.getElementById('RxInfosIlluminationTime'),
            "groundAngularVelocity": document.getElementById('RxInfosGroundAngularVelocity')
        }
    },
    "bsarInfos": {
        "txrxRange":                 document.getElementById('BSARInfosTxRxRange'),
        "bistaticAngle":             document.getElementById('BSARInfosBistaticAngle'),        
        "rangeAtSwathCenter":        document.getElementById('BSARInfosRangeAtSwathCenter'),
        "rangeMin":                  document.getElementById('BSARInfosRangeMin'),
        "rangeMax":                  document.getElementById('BSARInfosRangeMax'),
        "slantRangeRes":             document.getElementById('BSARInfosSlantRangeRes'),
        "slantLateralRes":           document.getElementById('BSARInfosSlantLateralRes'),
        "groundRangeRes":            document.getElementById('BSARInfosGroundRangeRes'),
        "groundLateralRes":          document.getElementById('BSARInfosGroundLateralRes'),
        "resolutionArea":            document.getElementById('BSARInfosResArea'),
        "dopplerFrequency":          document.getElementById('BSARInfosDopplerFrequency'),
        "dopplerRate":               document.getElementById('BSARInfosDopplerRate'),
        "integrationTime":           document.getElementById('BSARInfosIntegrationTime'),
        "processedDopplerBandwidth": document.getElementById('BSARInfosProcessedDopplerBandwidth'),
        "nesz":                      document.getElementById('BSARInfosNESZ'),
        "priMin":                    document.getElementById('BSARInfosPRImin'),
        "priMax":                    document.getElementById('BSARInfosPRImax')
    }
}

export const CoordinatesElements = {
    "ENUorigin": {
        "lon": document.getElementById('ENUorigLonDD'),
        "lat": document.getElementById('ENUorigLatDD'),
        "alt": document.getElementById('ENUorigAltDD')
    },
    "localENU": {
        "Tx": {
            "posx": document.getElementById('coordENUTxPosx'),
            "posy": document.getElementById('coordENUTxPosy'),
            "posz": document.getElementById('coordENUTxPosz'),
            "velx": document.getElementById('coordENUTxVelx'),
            "vely": document.getElementById('coordENUTxVely'),
            "velz": document.getElementById('coordENUTxVelz')
        },
        "Rx": {
            "posx": document.getElementById('coordENURxPosx'),
            "posy": document.getElementById('coordENURxPosy'),
            "posz": document.getElementById('coordENURxPosz'),
            "velx": document.getElementById('coordENURxVelx'),
            "vely": document.getElementById('coordENURxVely'),
            "velz": document.getElementById('coordENURxVelz')
        }
    },
    "ECEF": {
        "Tx": {
            "posx": document.getElementById('coordECEFTxPosx'),
            "posy": document.getElementById('coordECEFTxPosy'),
            "posz": document.getElementById('coordECEFTxPosz'),
            "velx": document.getElementById('coordECEFTxVelx'),
            "vely": document.getElementById('coordECEFTxVely'),
            "velz": document.getElementById('coordECEFTxVelz')
        },
        "Rx": {
            "posx": document.getElementById('coordECEFRxPosx'),
            "posy": document.getElementById('coordECEFRxPosy'),
            "posz": document.getElementById('coordECEFRxPosz'),
            "velx": document.getElementById('coordECEFRxVelx'),
            "vely": document.getElementById('coordECEFRxVely'),
            "velz": document.getElementById('coordECEFRxVelz')
        }
    },
    "geodetic": {
        "Tx": {
            "lon": document.getElementById('coordGeodTxPosLon'),
            "lat": document.getElementById('coordGeodTxPosLat'),
            "alt": document.getElementById('coordGeodTxPosAlt')
        },
        "Rx": {
            "lon": document.getElementById('coordGeodRxPosLon'),
            "lat": document.getElementById('coordGeodRxPosLat'),
            "alt": document.getElementById('coordGeodRxPosAlt')
        }
    }
}
