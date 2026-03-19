export interface SynopData {
    sID?: string;
    uID: string | null;
    stnID: string | null;

    sDate: string | null;               // DATE (YYYY-MM-DD)
    sHour: string | null;
    sActualDateTime: string | null;     // DATETIME (ISO string)

    heightLL: string | null;
    VV: string | null;
    SummTotal: string | null;

    wDir: string | null;
    wSpd: string | null;

    dBulb: string | null;
    wBulb: string | null;
    dPoiint: string | null;
    RH: string | null;

    stnP: string | null;
    mslP: string | null;
    altP: string | null;

    tendency: string | null;
    net3hr: string | null;
    vaporP: string | null;

    RR: string | null;
    tR: string | null;

    presW: string | null;
    pastW1: string | null;
    pastW2: string | null;

    amtLC: string | null;

    amtFirstLayer: string | null;
    typeFirstLayer: string | null;
    heightFirstLayer: string | null;

    amtSecondLayer: string | null;
    typeSecondLayer: string | null;
    heightSecondLayer: string | null;

    amtThirdLayer: string | null;
    typeThirdLayer: string | null;
    heightThirdLayer: string | null;

    amtFourthLayer: string | null;
    typeFourthLayer: string | null;
    heightFourthLayer: string | null;

    ceiling: string | null;

    stateOfSea: string | null;
    seaDir: string | null;
    seaPer: string | null;
    seaHeight: string | null;

    maxTemp: string | null;
    minTemp: string | null;
    pres24: string | null;

    remark: string | null;
    obsINT: string | null;

    pAttachTherm: string | null;
    pObsBaro: string | null;
    pCorrection: string | null;
    pBarograph: string | null;
    pBaroCorrection: string | null;

    summaryDate?: string | null;

    dirLow: string | null;
    dirMid: string | null;
    dirHigh: string | null;
}
