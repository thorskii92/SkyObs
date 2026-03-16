export interface Station {
    Id: number;
    wmoID: string;
    stationID: string;
    ICAO?: string | null;
    stnName: string;
    Latitude?: number | null;
    Longitude?: number | null;
    height?: number | null;
    mslCor?: number | null;
    altCor?: number | null;
    Synoptic?: boolean | null;
    UpperAir?: boolean | null;
    Aeromet?: boolean | null;
    Agromet?: boolean | null;
    Hydromet?: boolean | null;
    Radar?: boolean | null;
    isRegionOffice?: boolean | null;
    PRSD?: string | null;
    LatDef?: string | null;
    LonDef?: string | null;
    Station?: string | null;
    Town?: string | null;
    Province?: string | null;
    ElevationFt?: string | null;
}

