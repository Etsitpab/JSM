
var readDNG = function (RAW) {
    'use strict';
    var tab2char = function (tab) {
        var str  = '';
        for (var i = 0; i < tab.length; i++) {
            str += String.fromCharCode(tab[i]);
        }
        return str;
    };

    var TYPES = ["BYTE", "ASCII", "SHORT", "LONG", "RATIONAL", "SBYTE", "UNDEFINED", "SSHORT", "SLONG", "SRATIONAL", "FLOAT", "DOUBLE"];
    var readIFDEntry = function (view, byteOrder) {
        var tag = view.getUint16(0, byteOrder),
            type = view.getUint16(2, byteOrder),
            count = view.getUint32(4, byteOrder),
            offset = view.getUint32(8, byteOrder);
        var value;
        if (type === 1 || type === 7) { // BYTE OR UNDEFINED
            if (count === 1) {
                value = view.getUint8(8, byteOrder);
            } else if (count < 5) {
                value = [];
                for (var i = 0; i < count; i++) {
                    value.push(view.getUint8(8 + i, byteOrder));
                }
            } else {
                value = [];
                for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                    value.push(v.getUint8(offset + i, byteOrder));
                }
            }
        } else if (type === 2) { // ASCII
            if (count <= 4) {
                value = [];
                for (var i = 0; i < count; i++) {
                    value.push(view.getUint8(8 + i, byteOrder));
                }
                value = tab2char(value);
            } else if (count > 4) {
                value = [];
                for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                    value.push(v.getUint8(offset + i, byteOrder));
                }
                value = tab2char(value);
            }
        } else if (type === 3) { // SHORT
            if (count === 1) {
                value = view.getUint16(8, byteOrder);
            } else if (count < 3) {
                value = [];
                for (var i = 0; i < count; i++) {
                    value.push(view.getUint16(8 + 2 * i, byteOrder));
                }
            } else {
                value = [];
                for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                    value.push(v.getUint16(offset + 2 * i, byteOrder));
                }
            }
        } else if (type === 4) { // LONG
            if (count === 1) {
                value = view.getUint32(8, byteOrder);
            } else {
                value = [];
                for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                    value.push(v.getUint32(offset + 4 * i, byteOrder));
                }
            }
        } else if (type === 5) { // RATIONAL
            value = {
                "numerator": [],
                "denominator": []
            };
            for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                value.numerator.push(v.getUint32(offset + 8 * i, byteOrder));
                value.denominator.push(v.getUint32(offset + 8 * i + 4, byteOrder));
            }
        } else if (type === 6) { // SBYTE
            if (count === 1) {
                value = view.getInt8(8, byteOrder);
            } else if (count < 5) {
                value = [];
                for (var i = 0; i < count; i++) {
                    value.push(view.getInt8(8 + i, byteOrder));
                }
            } else {
                value = [];
                for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                    value.push(v.getInt8(offset + i, byteOrder));
                }
            }
        } else if (type === 8) { // SSHORT
            if (count === 1) {
                value = view.getInt16(8, byteOrder);
            } else if (count < 3) {
                value = [];
                for (var i = 0; i < count; i++) {
                    value.push(view.getInt16(8 + 2 * i, byteOrder));
                }
            } else {
                value = [];
                for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                    value.push(v.getInt16(offset + 2 * i, byteOrder));
                }
            }
        } else if (type === 9) { // SLONG
            if (count === 1) {
                value = view.getInt32(8, byteOrder);
            } else {
                value = [];
                for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                    value.push(v.getInt32(offset + 4 * i, byteOrder));
                }
            }
        } else if (type === 10) { // SRATIONAL
            value = {
                "numerator": [],
                "denominator": []
            };
            for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                value.numerator.push(v.getInt32(offset + 8 * i, byteOrder));
                value.denominator.push(v.getInt32(offset + 8 * i + 4, byteOrder));
            }
        } else if (type === 11) { // FLOAT
            if (count === 1) {
                value = view.getFloat32(8, byteOrder);
            } else {
                value = [];
                for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                    value.push(v.getFloat32(offset + 4 * i, byteOrder));
                }
            }
        } else if (type === 12) { // DOUBLE
            value = [];
            for (var i = 0, v = new DataView(view.buffer); i < count; i++) {
                value.push(v.getFloat64(offset + 8 * i, byteOrder));
            }
        } else {
            throw new Error("DNG reader: Unknown type " + type + ".");
        }
        return {
            "tag": tag,
            "type": TYPES[type - 1],
            "count": count,
            "value": value,
            // "offset": offset
        };
    };

    var LightSources = [
        "Daylight",
        "Fluorescent",
        "Tungsten (incandescent light)",
        "Flash",
        "Fine weather",
        "Cloudy weather",
        "Shade",
        "Daylight fluorescent (D 5700 – 7100K)",
        "Day white fluorescent (N 4600 – 5400K)",
        "Cool white fluorescent (W 3900 – 4500K)",
        "White fluorescent (WW 3200 – 3700K)",
        "Standard light A",
        "Standard light B",
        "Standard light C",
        "D55",
        "D65",
        "D75",
        "D50",
        "ISO studio tungsten",
        "other light source"
    ];

    var gpsEntries = {
        0: {"tagName": "GPSVersionID", "decimal": 0},
        1: {"tagName": "GPSLatitudeRef", "decimal": 1},
        2: {"tagName": "GPSLatitude", "decimal": 2},
        3: {"tagName": "GPSLongitudeRef", "decimal": 3},
        4: {"tagName": "GPSLongitude", "decimal": 4},
        5: {"tagName": "GPSAltitudeRef", "decimal": 5},
        6: {"tagName": "GPSAltitude", "decimal": 6},
        7: {"tagName": "GPSTimeStamp", "decimal": 7},
        8: {"tagName": "GPSSatellites", "decimal": 8},
        9: {"tagName": "GPSStatus", "decimal": 9},
        10: {"tagName": "GPSMeasureMode", "decimal": 10},
        11: {"tagName": "GPSDOP", "decimal": 11},
        12: {"tagName": "GPSSpeedRef", "decimal": 12},
        13: {"tagName": "GPSSpeed", "decimal": 13},
        14: {"tagName": "GPSTrackRef", "decimal": 14},
        15: {"tagName": "GPSTrack", "decimal": 15},
        16: {"tagName": "GPSImgDirectionRef", "decimal": 16},
        17: {"tagName": "GPSImgDirection", "decimal": 17},
        18: {"tagName": "GPSMapDatum", "decimal": 18},
        19: {"tagName": "GPSDestLatitudeRef", "decimal": 19},
        20: {"tagName": "GPSDestLatitude", "decimal": 20},
        21: {"tagName": "GPSDestLongitudeRef", "decimal": 21},
        22: {"tagName": "GPSDestLongitude", "decimal": 22},
        23: {"tagName": "GPSDestBearingRef", "decimal": 23},
        24: {"tagName": "GPSDestBearing", "decimal": 24},
        25: {"tagName": "GPSDestDistanceRef", "decimal": 25},
        26: {"tagName": "GPSDestDistance", "decimal": 26},
        27: {"tagName": "GPSProcessingMethod", "decimal": 27},
        28: {"tagName": "GPSAreaInformation", "decimal": 28},
        29: {"tagName": "GPSDateStamp", "decimal": 29},
        30: {"tagName": "GPSDifferential", "decimal": 30}
    };
    var exifEntries = {
        33434: {"tagName": "ExposureTime", "decimal": 33434},
        33437: {"tagName": "FNumber", "decimal": 33437},
        34850: {"tagName": "ExposureProgram", "decimal": 34850},
        34852: {"tagName": "SpectralSensitivity", "decimal": 34852},
        34855: {"tagName": "ISOSpeedRatings", "decimal": 34855},
        34856: {"tagName": "OECF", "decimal": 34856},
        34864: {"tagName": "SensitivityType", "decimal": 34864},
        34865: {"tagName": "StandardOutputSensitivity", "decimal": 34865},
        34866: {"tagName": "RecommendedExposureIndex", "decimal": 34866},
        34867: {"tagName": "ISOSpeed", "decimal": 34867},
        34868: {"tagName": "ISOSpeedLatitudeyyy", "decimal": 34868},
        34869: {"tagName": "ISOSpeedLatitudezzz", "decimal": 34869},
        36864: {"tagName": "ExifVersion", "decimal": 36864},
        36867: {"tagName": "DateTimeOriginal", "decimal": 36867},
        36868: {"tagName": "DateTimeDigitized", "decimal": 36868},
        37121: {"tagName": "ComponentsConfiguration", "decimal": 37121},
        37122: {"tagName": "CompressedBitsPerPixel", "decimal": 37122},
        37377: {"tagName": "ShutterSpeedValue", "decimal": 37377},
        37378: {"tagName": "ApertureValue", "decimal": 37378},
        37379: {"tagName": "BrightnessValue", "decimal": 37379},
        37380: {"tagName": "ExposureBiasValue", "decimal": 37380},
        37381: {"tagName": "MaxApertureValue", "decimal": 37381},
        37382: {"tagName": "SubjectDistance", "decimal": 37382},
        37383: {"tagName": "MeteringMode", "decimal": 37383},
        37384: {"tagName": "LightSource", "decimal": 37384},
        37385: {"tagName": "Flash", "decimal": 37385},
        37386: {"tagName": "FocalLength", "decimal": 37386},
        37396: {"tagName": "SubjectArea", "decimal": 37396},
        37500: {"tagName": "MakerNote", "decimal": 37500},
        37510: {"tagName": "UserComment", "decimal": 37510},
        37520: {"tagName": "SubSecTime", "decimal": 37520},
        37521: {"tagName": "SubSecTimeOriginal", "decimal": 37521},
        37522: {"tagName": "SubSecTimeDigitized", "decimal": 37522},
        40960: {"tagName": "FlashpixVersion", "decimal": 40960},
        40961: {"tagName": "ColorSpace", "decimal": 40961},
        40962: {"tagName": "PixelXDimension", "decimal": 40962},
        40963: {"tagName": "PixelYDimension", "decimal": 40963},
        40964: {"tagName": "RelatedSoundFile", "decimal": 40964},
        40965: {"tagName": "InteroperabilityTag", "decimal": 40965},
        41483: {"tagName": "FlashEnergy", "decimal": 41483},
        41484: {"tagName": "SpatialFrequencyResponse", "decimal": 41484},
        41486: {"tagName": "FocalPlaneXResolution", "decimal": 41486},
        41487: {"tagName": "FocalPlaneYResolution", "decimal": 41487},
        41488: {"tagName": "FocalPlaneResolutionUnit", "decimal": 41488},
        41492: {"tagName": "SubjectLocation", "decimal": 41492},
        41493: {"tagName": "ExposureIndex", "decimal": 41493},
        41495: {"tagName": "SensingMethod", "decimal": 41495},
        41728: {"tagName": "FileSource", "decimal": 41728},
        41729: {"tagName": "SceneType", "decimal": 41729},
        41730: {"tagName": "CFAPattern", "decimal": 41730},
        41985: {"tagName": "CustomRendered", "decimal": 41985},
        41986: {"tagName": "ExposureMode", "decimal": 41986},
        41987: {"tagName": "WhiteBalance", "decimal": 41987},
        41988: {"tagName": "DigitalZoomRatio", "decimal": 41988},
        41989: {"tagName": "FocalLengthIn35mmFilm", "decimal": 41989},
        41990: {"tagName": "SceneCaptureType", "decimal": 41990},
        41991: {"tagName": "GainControl", "decimal": 41991},
        41992: {"tagName": "Contrast", "decimal": 41992},
        41993: {"tagName": "Saturation", "decimal": 41993},
        41994: {"tagName": "Sharpness", "decimal": 41994},
        41995: {"tagName": "DeviceSettingDescription", "decimal": 41995},
        41996: {"tagName": "SubjectDistanceRange", "decimal": 41996},
        42016: {"tagName": "ImageUniqueID", "decimal": 42016},
        42032: {"tagName": "CameraOwnerName", "decimal": 42032},
        42033: {"tagName": "BodySerialNumber", "decimal": 42033},
        42034: {"tagName": "LensSpecification", "decimal": 42034},
        42035: {"tagName": "LensMake", "decimal": 42035},
        42036: {"tagName": "LensModel", "decimal": 42036},
        42037: {"tagName": "LensSerialNumber", "decimal": 42037}
    };
    var IFDEntries = {
        11: {"tagName": "ProcessingSoftware", "decimal": 11},
        254: {"tagName": "NewSubfileType", "decimal": 254},
        255: {"tagName": "SubfileType", "decimal": 255},
        256: {"tagName": "ImageWidth", "decimal": 256},
        257: {"tagName": "ImageLength", "decimal": 257},
        258: {"tagName": "BitsPerSample", "decimal": 258},
        259: {"tagName": "Compression", "decimal": 259},
        262: {"tagName": "PhotometricInterpretation", "decimal": 262},
        263: {"tagName": "Thresholding", "decimal": 263},
        264: {"tagName": "CellWidth", "decimal": 264},
        265: {"tagName": "CellLength", "decimal": 265},
        266: {"tagName": "FillOrder", "decimal": 266},
        269: {"tagName": "DocumentName", "decimal": 269},
        270: {"tagName": "ImageDescription", "decimal": 270},
        271: {"tagName": "Make", "decimal": 271},
        272: {"tagName": "Model", "decimal": 272},
        273: {"tagName": "StripOffsets", "decimal": 273},
        274: {"tagName": "Orientation", "decimal": 274},
        277: {"tagName": "SamplesPerPixel", "decimal": 277},
        278: {"tagName": "RowsPerStrip", "decimal": 278},
        279: {"tagName": "StripByteCounts", "decimal": 279},
        282: {"tagName": "XResolution", "decimal": 282},
        283: {"tagName": "YResolution", "decimal": 283},
        284: {"tagName": "PlanarConfiguration", "decimal": 284},
        290: {"tagName": "GrayResponseUnit", "decimal": 290},
        291: {"tagName": "GrayResponseCurve", "decimal": 291},
        292: {"tagName": "T4Options", "decimal": 292},
        293: {"tagName": "T6Options", "decimal": 293},
        296: {"tagName": "ResolutionUnit", "decimal": 296},
        297: {"tagName": "PageNumber", "decimal": 297},
        301: {"tagName": "TransferFunction", "decimal": 301},
        305: {"tagName": "Software", "decimal": 305},
        306: {"tagName": "DateTime", "decimal": 306},
        315: {"tagName": "Artist", "decimal": 315},
        316: {"tagName": "HostComputer", "decimal": 316},
        317: {"tagName": "Predictor", "decimal": 317},
        318: {"tagName": "WhitePoint", "decimal": 318},
        319: {"tagName": "PrimaryChromaticities", "decimal": 319},
        320: {"tagName": "ColorMap", "decimal": 320},
        321: {"tagName": "HalftoneHints", "decimal": 321},
        322: {"tagName": "TileWidth", "decimal": 322},
        323: {"tagName": "TileLength", "decimal": 323},
        324: {"tagName": "TileOffsets", "decimal": 324},
        325: {"tagName": "TileByteCounts", "decimal": 325},
        330: {"tagName": "SubIFDs", "decimal": 330},
        332: {"tagName": "InkSet", "decimal": 332},
        333: {"tagName": "InkNames", "decimal": 333},
        334: {"tagName": "NumberOfInks", "decimal": 334},
        336: {"tagName": "DotRange", "decimal": 336},
        337: {"tagName": "TargetPrinter", "decimal": 337},
        338: {"tagName": "ExtraSamples", "decimal": 338},
        339: {"tagName": "SampleFormat", "decimal": 339},
        340: {"tagName": "SMinSampleValue", "decimal": 340},
        341: {"tagName": "SMaxSampleValue", "decimal": 341},
        342: {"tagName": "TransferRange", "decimal": 342},
        343: {"tagName": "ClipPath", "decimal": 343},
        344: {"tagName": "XClipPathUnits", "decimal": 344},
        345: {"tagName": "YClipPathUnits", "decimal": 345},
        346: {"tagName": "Indexed", "decimal": 346},
        347: {"tagName": "JPEGTables", "decimal": 347},
        351: {"tagName": "OPIProxy", "decimal": 351},
        512: {"tagName": "JPEGProc", "decimal": 512},
        513: {"tagName": "JPEGInterchangeFormat", "decimal": 513},
        514: {"tagName": "JPEGInterchangeFormatLength", "decimal": 514},
        515: {"tagName": "JPEGRestartInterval", "decimal": 515},
        517: {"tagName": "JPEGLosslessPredictors", "decimal": 517},
        518: {"tagName": "JPEGPointTransforms", "decimal": 518},
        519: {"tagName": "JPEGQTables", "decimal": 519},
        520: {"tagName": "JPEGDCTables", "decimal": 520},
        521: {"tagName": "JPEGACTables", "decimal": 521},
        529: {"tagName": "YCbCrCoefficients", "decimal": 529},
        530: {"tagName": "YCbCrSubSampling", "decimal": 530},
        531: {"tagName": "YCbCrPositioning", "decimal": 531},
        532: {"tagName": "ReferenceBlackWhite", "decimal": 532},
        700: {"tagName": "XMLPacket", "decimal": 700},
        18246: {"tagName": "Rating", "decimal": 18246},
        18249: {"tagName": "RatingPercent", "decimal": 18249},
        32781: {"tagName": "ImageID", "decimal": 32781},
        33421: {"tagName": "CFARepeatPatternDim", "decimal": 33421},
        33422: {"tagName": "CFAPattern", "decimal": 33422},
        33423: {"tagName": "BatteryLevel", "decimal": 33423},
        33432: {"tagName": "Copyright", "decimal": 33432},
        33434: {"tagName": "ExposureTime", "decimal": 33434},
        33437: {"tagName": "FNumber", "decimal": 33437},
        33723: {"tagName": "IPTCNAA", "decimal": 33723},
        34377: {"tagName": "ImageResources", "decimal": 34377},
        34665: {"tagName": "ExifTag", "decimal": 34665},
        34675: {"tagName": "InterColorProfile", "decimal": 34675},
        34850: {"tagName": "ExposureProgram", "decimal": 34850},
        34852: {"tagName": "SpectralSensitivity", "decimal": 34852},
        34853: {"tagName": "GPSTag", "decimal": 34853},
        34855: {"tagName": "ISOSpeedRatings", "decimal": 34855},
        34856: {"tagName": "OECF", "decimal": 34856},
        34857: {"tagName": "Interlace", "decimal": 34857},
        34858: {"tagName": "TimeZoneOffset", "decimal": 34858},
        34859: {"tagName": "SelfTimerMode", "decimal": 34859},
        36867: {"tagName": "DateTimeOriginal", "decimal": 36867},
        37122: {"tagName": "CompressedBitsPerPixel", "decimal": 37122},
        37377: {"tagName": "ShutterSpeedValue", "decimal": 37377},
        37378: {"tagName": "ApertureValue", "decimal": 37378},
        37379: {"tagName": "BrightnessValue", "decimal": 37379},
        37380: {"tagName": "ExposureBiasValue", "decimal": 37380},
        37381: {"tagName": "MaxApertureValue", "decimal": 37381},
        37382: {"tagName": "SubjectDistance", "decimal": 37382},
        37383: {"tagName": "MeteringMode", "decimal": 37383},
        37384: {"tagName": "LightSource", "decimal": 37384},
        37385: {"tagName": "Flash", "decimal": 37385},
        37386: {"tagName": "FocalLength", "decimal": 37386},
        37387: {"tagName": "FlashEnergy", "decimal": 37387},
        37388: {"tagName": "SpatialFrequencyResponse", "decimal": 37388},
        37389: {"tagName": "Noise", "decimal": 37389},
        37390: {"tagName": "FocalPlaneXResolution", "decimal": 37390},
        37391: {"tagName": "FocalPlaneYResolution", "decimal": 37391},
        37392: {"tagName": "FocalPlaneResolutionUnit", "decimal": 37392},
        37393: {"tagName": "ImageNumber", "decimal": 37393},
        37394: {"tagName": "SecurityClassification", "decimal": 37394},
        37395: {"tagName": "ImageHistory", "decimal": 37395},
        37396: {"tagName": "SubjectLocation", "decimal": 37396},
        37397: {"tagName": "ExposureIndex", "decimal": 37397},
        37398: {"tagName": "TIFFEPStandardID", "decimal": 37398},
        37399: {"tagName": "SensingMethod", "decimal": 37399},
        40091: {"tagName": "XPTitle", "decimal": 40091},
        40092: {"tagName": "XPComment", "decimal": 40092},
        40093: {"tagName": "XPAuthor", "decimal": 40093},
        40094: {"tagName": "XPKeywords", "decimal": 40094},
        40095: {"tagName": "XPSubject", "decimal": 40095},
        50341: {"tagName": "PrintImageMatching", "decimal": 50341},
        50706: {"tagName": "DNGVersion", "decimal": 50706},
        50707: {"tagName": "DNGBackwardVersion", "decimal": 50707},
        50708: {"tagName": "UniqueCameraModel", "decimal": 50708},
        50709: {"tagName": "LocalizedCameraModel", "decimal": 50709},
        50710: {"tagName": "CFAPlaneColor", "decimal": 50710},
        50711: {"tagName": "CFALayout", "decimal": 50711},
        50712: {"tagName": "LinearizationTable", "decimal": 50712},
        50713: {"tagName": "BlackLevelRepeatDim", "decimal": 50713},
        50714: {"tagName": "BlackLevel", "decimal": 50714},
        50715: {"tagName": "BlackLevelDeltaH", "decimal": 50715},
        50716: {"tagName": "BlackLevelDeltaV", "decimal": 50716},
        50717: {"tagName": "WhiteLevel", "decimal": 50717},
        50718: {"tagName": "DefaultScale", "decimal": 50718},
        50719: {"tagName": "DefaultCropOrigin", "decimal": 50719},
        50720: {"tagName": "DefaultCropSize", "decimal": 50720},
        50721: {"tagName": "ColorMatrix1", "decimal": 50721},
        50722: {"tagName": "ColorMatrix2", "decimal": 50722},
        50723: {"tagName": "CameraCalibration1", "decimal": 50723},
        50724: {"tagName": "CameraCalibration2", "decimal": 50724},
        50725: {"tagName": "ReductionMatrix1", "decimal": 50725},
        50726: {"tagName": "ReductionMatrix2", "decimal": 50726},
        50727: {"tagName": "AnalogBalance", "decimal": 50727},
        50728: {"tagName": "AsShotNeutral", "decimal": 50728},
        50729: {"tagName": "AsShotWhiteXY", "decimal": 50729},
        50730: {"tagName": "BaselineExposure", "decimal": 50730},
        50731: {"tagName": "BaselineNoise", "decimal": 50731},
        50732: {"tagName": "BaselineSharpness", "decimal": 50732},
        50733: {"tagName": "BayerGreenSplit", "decimal": 50733},
        50734: {"tagName": "LinearResponseLimit", "decimal": 50734},
        50735: {"tagName": "CameraSerialNumber", "decimal": 50735},
        50736: {"tagName": "LensInfo", "decimal": 50736},
        50737: {"tagName": "ChromaBlurRadius", "decimal": 50737},
        50738: {"tagName": "AntiAliasStrength", "decimal": 50738},
        50739: {"tagName": "ShadowScale", "decimal": 50739},
        50740: {"tagName": "DNGPrivateData", "decimal": 50740},
        50741: {"tagName": "MakerNoteSafety", "decimal": 50741},
        50778: {"tagName": "CalibrationIlluminant1", "decimal": 50778},
        50779: {"tagName": "CalibrationIlluminant2", "decimal": 50779},
        50780: {"tagName": "BestQualityScale", "decimal": 50780},
        50781: {"tagName": "RawDataUniqueID", "decimal": 50781},
        50827: {"tagName": "OriginalRawFileName", "decimal": 50827},
        50828: {"tagName": "OriginalRawFileData", "decimal": 50828},
        50829: {"tagName": "ActiveArea", "decimal": 50829},
        50830: {"tagName": "MaskedAreas", "decimal": 50830},
        50831: {"tagName": "AsShotICCProfile", "decimal": 50831},
        50832: {"tagName": "AsShotPreProfileMatrix", "decimal": 50832},
        50833: {"tagName": "CurrentICCProfile", "decimal": 50833},
        50834: {"tagName": "CurrentPreProfileMatrix", "decimal": 50834},
        50879: {"tagName": "ColorimetricReference", "decimal": 50879},
        50931: {"tagName": "CameraCalibrationSignature", "decimal": 50931},
        50932: {"tagName": "ProfileCalibrationSignature", "decimal": 50932},
        50934: {"tagName": "AsShotProfileName", "decimal": 50934},
        50935: {"tagName": "NoiseReductionApplied", "decimal": 50935},
        50936: {"tagName": "ProfileName", "decimal": 50936},
        50937: {"tagName": "ProfileHueSatMapDims", "decimal": 50937},
        50938: {"tagName": "ProfileHueSatMapData1", "decimal": 50938},
        50939: {"tagName": "ProfileHueSatMapData2", "decimal": 50939},
        50940: {"tagName": "ProfileToneCurve", "decimal": 50940},
        50941: {"tagName": "ProfileEmbedPolicy", "decimal": 50941},
        50942: {"tagName": "ProfileCopyright", "decimal": 50942},
        50964: {"tagName": "ForwardMatrix1", "decimal": 50964},
        50965: {"tagName": "ForwardMatrix2", "decimal": 50965},
        50966: {"tagName": "PreviewApplicationName", "decimal": 50966},
        50967: {"tagName": "PreviewApplicationVersion", "decimal": 50967},
        50968: {"tagName": "PreviewSettingsName", "decimal": 50968},
        50969: {"tagName": "PreviewSettingsDigest", "decimal": 50969},
        50970: {"tagName": "PreviewColorSpace", "decimal": 50970},
        50971: {"tagName": "PreviewDateTime", "decimal": 50971},
        50972: {"tagName": "RawImageDigest", "decimal": 50972},
        50973: {"tagName": "OriginalRawFileDigest", "decimal": 50973},
        50974: {"tagName": "SubTileBlockSize", "decimal": 50974},
        50975: {"tagName": "RowInterleaveFactor", "decimal": 50975},
        50981: {"tagName": "ProfileLookTableDims", "decimal": 50981},
        50982: {"tagName": "ProfileLookTableData", "decimal": 50982},
        51008: {"tagName": "OpcodeList1", "decimal": 51008},
        51009: {"tagName": "OpcodeList2", "decimal": 51009},
        51022: {"tagName": "OpcodeList3", "decimal": 51022},
        51041: {"tagName": "NoiseProfile", "decimal": 51041}
    };
    var opcodesEntries = {
        1: {"tagName": "WarpRectilinear", "decimal": 1},
        2: {"tagName": "WarpFisheye", "decimal": 2},
        3: {"tagName": "FixVignetteRadial", "decimal": 3},
        4: {"tagName": "FixBadPixelsConstant", "decimal": 4},
        5: {"tagName": "FixBadPixelsList", "decimal": 5},
        6: {"tagName": "TrimBounds", "decimal": 6},
        7: {"tagName": "MapTable", "decimal": 7},
        8: {"tagName": "MapPolynomial", "decimal": 8},
        9: {"tagName": "GainMap", "decimal": 9},
        10: {"tagName": "DeltaPerRow", "decimal": 10},
        11: {"tagName": "DeltaPerColumn", "decimal": 11},
        12: {"tagName": "ScalePerRow", "decimal": 12},
        13: {"tagName": "ScalePerColumn", "decimal": 13}
    };

    var view = new DataView(RAW),
        // Little-endian or big-endian ("II" or "MM");
        byteOrder = tab2char([view.getUint8(0), view.getUint8(1)]) === "II" ? true : false,
        checkNumber = view.getUint16(2, byteOrder), // 42
        offset = view.getUint32(4, byteOrder); // something

    if (checkNumber !== 42) {
        throw new Error("DNG reader: Header check number must be 42 not " + checkNumber + ".");
    }
    /*
    console.log(
        "Byte order:", byteOrder ? "little-endian" : "big-endian",
        "\ncheck number:", checkNumber,
        "\noffset", offset
    );*/

    var readImageData = function (infos) {
        var ImageLength = infos.ImageLength.value,
            ImageWidth = infos.ImageWidth.value,
            BitsPerSample = infos.BitsPerSample.value,
            SamplesPerPixel = infos.SamplesPerPixel.value,
            PhotometricInterpretation = infos.PhotometricInterpretation.value,
            Orientation = infos.Orientation ?  infos.Orientation.value : 1,
            Compression = infos.Compression.value;

        var photometricMeaning = {0: "WhiteIsZero", 1: "BlackIsZero", 2: "RGB", 6: "YCbCr", 32803: "CFA", 34892: "LinearRaw"};
        console.log(
            {0: "Primary image", 1: "Thumbnail"}[infos.NewSubfileType ? infos.NewSubfileType.value : 0],
            photometricMeaning[PhotometricInterpretation],
            ImageLength + "x" + ImageWidth,
            BitsPerSample, "Orientation", Orientation,
            "Compression", Compression,
            "SamplesPerPixel", SamplesPerPixel
        );

        if (infos.Compression.value !== 1) {
            console.warn("DNG reader: No support yet for compressed data ! Image will be ignored.");
            return;
        } else if (infos.StripOffsets.count !== 1) {
            console.warn("DNG reader: No support yet for more than one strip ! Image will be ignored.");
            return;
        } else if (infos.CFALayout && infos.CFALayout.value !== 1) {
            console.warn("DNG reader: No support yet for CFALayout = " + CFALayout + " ! Image will be ignored.");
            return;
        }

        var PlanarConfiguration = infos.PlanarConfiguration.value,
            StripOffsets = infos.StripOffsets.value,
            RowsPerStrip = infos.RowsPerStrip.value,
            StripByteCounts = infos.StripByteCounts.value;

        var CFAData = new Uint8Array(RAW, StripOffsets, StripByteCounts), image;

        // 8b RGB Image
        if (PhotometricInterpretation === 2) {
            image = CFAData.slice();
        // CFA Image
        } else if (PhotometricInterpretation === 32803) {
            if (BitsPerSample === 8) {
                image = CFAData.slice();
            } else if (BitsPerSample === 10) {
                image = new Uint16Array(SamplesPerPixel * ImageWidth * ImageLength);
                for (var i = 0, o = 0, ie = CFAData.length; i < ie; i += 5, o += 4) {
                    image[o]     = (((CFAData[i    ]     ) << 2) | ((CFAData[i + 1] & 192) >> 6));
                    image[o + 1] = (((CFAData[i + 1] & 63) << 4) | ((CFAData[i + 2] & 240) >> 4));
                    image[o + 2] = (((CFAData[i + 2] & 15) << 6) | ((CFAData[i + 3] & 252) >> 2));
                    image[o + 3] = (((CFAData[i + 3] &  3) << 8) | ((CFAData[i + 4]      )     ));
                }
            } else if (BitsPerSample === 12) {
                image = new Uint16Array(SamplesPerPixel * ImageWidth * ImageLength);
                for (var i = 0, o = 0, ie = CFAData.length; i < ie; i += 3, o += 2) {
                    image[o]     = (((CFAData[i    ]     ) << 4) | ((CFAData[i + 1] & 240) >> 6));
                    image[o + 1] = (((CFAData[i + 1] & 15) << 8) | ((CFAData[i + 2]            )));
                }
            } else if (BitsPerSample === 16) {
                image = new Uint16Array(SamplesPerPixel * ImageWidth * ImageLength);
                for (var i = StripOffsets, o = 0, ie = StripOffsets + StripByteCounts; i < ie; i += 2, o++) {
                    image[o] = view.getUint16(i, byteOrder);
                }
            } else {
                console.warn("DNG reader: Unsupported value BitsPerSample = " + BitsPerSample + ". Image will be ignored.");
                return;
            }
        } else {
            console.warn("DNG reader: Unsupported value PhotometricInterpretation = " + photometricMeaning[PhotometricInterpretation] + ". Image will be ignored.");
            return;
        }
        return image;
    };

    var readOpcodes = function (buffer) {
        var data = new DataView(buffer);
        var nDirEntries = data.getUint32(0);
        // console.log("# Opcode", nDirEntries);
        var readGainMap = function (offset) {
            var map = {
                "Top":         data.getUint32(offset + 16),  // - LONG
                "Left":        data.getUint32(offset + 20),  // - LONG
                "Bottom":      data.getUint32(offset + 24),  // - LONG
                "Right":       data.getUint32(offset + 28),  // - LONG
                "Plane":       data.getUint32(offset + 32),  // - LONG
                "Planes":      data.getUint32(offset + 36),  // - LONG
                "RowPitch":    data.getUint32(offset + 40),  // - LONG
                "ColPitch":    data.getUint32(offset + 44),  // - LONG
                "MapPointsV":  data.getUint32(offset + 48),  // - LONG
                "MapPointsH":  data.getUint32(offset + 52),  // - LONG
                "MapSpacingV": data.getFloat64(offset + 56), // - DOUBLE
                "MapSpacingH": data.getFloat64(offset + 64), // - DOUBLE
                "MapOriginV":  data.getFloat64(offset + 72), // - DOUBLE
                "MapOriginH":  data.getFloat64(offset + 80), // - DOUBLE
                "MapPlanes":   data.getUint32(offset + 88)   // - LONG
            }
            var mapLength = map.MapPointsV * map.MapPointsH * map.MapPlanes;
            var mapValues = new Float32Array(mapLength);
            for (var v = 0, ve = mapLength; v < ve; v++) {
                mapValues[v] = data.getFloat32(offset + 92 + v * 4);
            }
            map.mapValues = new Matrix([map.MapPlanes, map.MapPointsH, map.MapPointsV], mapValues);
            return map;
        };

        var offset = 4, opcodes = [];
        for (var o = 0; o < nDirEntries; o++) {
            var id = data.getUint32(offset),
                version = data.getUint32(offset + 4),
                flags = data.getUint32(offset + 8),
                nbytes = data.getUint32(offset + 12);
            if (opcodesEntries[id] === undefined) {
                console.warn("DNG reader: Unknown opcode with " + id + ".");
                continue;
            }
            if (id === 9) { // GAIN MAP
                opcodes.push(readGainMap(offset));
            } else {
                console.warn("DNG reader: Opcode " + opcodesEntries[id].tagName + " is currently ignored.");
            }
            offset += nbytes + 16;
        }
        return opcodes;
    };

    var infos = {};
    var readIFD = function (offset, infos, entries) {
        var nDirEntries = view.getUint16(offset, byteOrder);
        // console.log("Number of entries:", offset, nDirEntries);
        while (offset !== 0) {
            for (var n = 0; n < nDirEntries; n++) {
                var entryView = new DataView(RAW, offset + 2 + n * 12);
                var entryVal = readIFDEntry(entryView, byteOrder);
                var entryDef = entries[entryVal.tag];
                if (entryDef !== undefined) {
                    // IF fields are pointing to another IFD
                    // SubIFDs
                    if (entryVal.tag === 330) {
                        if (entryVal.count === 1) {
                            var newOffset = entryVal.value;
                            entryVal.value = {};
                            readIFD(newOffset, entryVal.value, entries);
                        } else {
                            for (var c = 0, subIFDs = []; c < entryVal.count; c++) {
                                var newOffset = entryVal.value[c];
                                entryVal.value[c] = {};
                                readIFD(newOffset, entryVal.value[c], entries);
                            }
                        }
                    // ExifTag
                    } else if (entryVal.tag === 34665) {
                        var newOffset = entryVal.value;
                        entryVal.value = {};
                        readIFD(newOffset, entryVal.value, exifEntries);
                    // GPSTag
                    } else if (entryVal.tag === 34853) {
                        var newOffset = entryVal.value;
                        entryVal.value = {};
                        readIFD(newOffset, entryVal.value, gpsEntries);
                    // Oppcodes
                    } else if (entryVal.tag === 51008 || entryVal.tag === 51009 || entryVal.tag === 51022) {
                        entryVal.value = readOpcodes(new Uint8Array(entryVal.value).buffer);
                    }
                    infos[entryDef.tagName] = entryVal;
                } else {
                    infos[entryVal.tag + ""] = entryVal;
                    console.warn("DNG reader: Unknown entry with tag number " + entryVal.tag + ".");
                }
            }
            if (infos.PhotometricInterpretation !== undefined) {
                infos.ImageData = readImageData(infos);
            }
            // console.log(view.getUint32(offset + 2 + nDirEntries * 12, ByteOrder));
            offset = 0; // view.getUint32(offset + 2 + nDirEntries * 12, ByteOrder);
        }
        return offset;
    };
    window.infos = infos;
    // console.log(offset);
    readIFD(offset, infos, IFDEntries);
    return infos;
};
