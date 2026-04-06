import DataCollectionForm from "@/src/components/DataCollectionForm";
import GlobalLoading from "@/src/components/GlobalLoading";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DataCollectionScreen() {
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1);

        return () => clearTimeout(timer);
    }, []);

    const params = useLocalSearchParams();

    const stationId = Array.isArray(params.stationId) ? params.stationId[0] : params.stationId ?? "";
    const stationName = Array.isArray(params.stationName) ? params.stationName[0] : params.stationName ?? "";
    const mslCor = Array.isArray(params.mslCor) ? params.mslCor[0] : params.mslCor ?? "";
    const altCor = Array.isArray(params.altCor) ? params.altCor[0] : params.altCor ?? "";
    const date = Array.isArray(params.date) ? params.date[0] : params.date ?? "";
    const time = Array.isArray(params.time) ? params.time[0] : params.time ?? "";
    const status = Array.isArray(params.status) ? params.status[0] : params.status ?? "view";

    const dataParams = { stationId, stationName, mslCor, altCor, date, time, status }

    const [formData, setFormData] = useState({
        visibility: {
            heightLL: "",
            VV: "",
            SummTotal: "",
        },
        wind: {
            wDir: "",
            wSpd: "",
        },
        temperature: {
            dBulb: "",
            wBulb: "",
            dPoiint: "",
            RH: "",
            vaporP: "",
            maxTemp: "",
            minTemp: "",
        },
        pressure: {
            stnP: "",
            mslP: "",
            altP: "",
            tendency: "",
            net3hr: "",
            pres24: "",
            pAttachTherm: "",
            pObsBaro: "",
            pCorrection: "",
            pBarograph: "",
            pBaroCorrection: "",
        },
        clouds: {
            amtLC: "",
            firstLayer: { amt: "", type: "", height: "" },
            secondLayer: { amt: "", type: "", height: "" },
            thirdLayer: { amt: "", type: "", height: "" },
            fourthLayer: { amt: "", type: "", height: "" },
            ceiling: "",
            dirLow: "ND",
            dirMid: "ND",
            dirHigh: "ND",
        },
        atmosphericPhenomena: {
            RR: "",
            tR: "",
            presW: "",
            pastW: "",
        },
        observer: {
            remark: "",
            obsINT: "",
        }
    });

    const setField = (path: string[], value: string) => {
        setFormData((prev) => {
            const updated = { ...prev };
            let current: any = updated;

            // Traverse until last key
            for (let i = 0; i < path.length - 1; i++) {
                current[path[i]] = { ...current[path[i]] };
                current = current[path[i]];
            }

            current[path[path.length - 1]] = value;

            return updated;
        });
    };


    // Holds error message for each data inputs 
    const [errors, setErrors] = useState({
        visibility: {
            heightLL: "",
            VV: "",
            SummTotal: "",
        },
        wind: {
            wDir: "",
            wSpd: "",
        },
        temperature: {
            dBulb: "",
            wBulb: "",
            dPoiint: "",
            RH: "",
            vaporP: "",
            maxTemp: "",
            minTemp: "",
        },
        pressure: {
            stnP: "",
            mslP: "",
            altP: "",
            tendency: "",
            net3hr: "",
            pres24: "",
            pAttachTherm: "",
            pObsBaro: "",
            pCorrection: "",
            pBarograph: "",
            pBaroCorrection: "",
        },
        clouds: {
            amtLC: "",
            firstLayer: { amt: "", type: "", height: "" },
            secondLayer: { amt: "", type: "", height: "" },
            thirdLayer: { amt: "", type: "", height: "" },
            fourthLayer: { amt: "", type: "", height: "" },
            ceiling: "",
            dirLow: "",
            dirMid: "",
            dirHigh: "",
        },
        atmosphericPhenomena: {
            RR: "",
            tR: "",
            presW: "",
            pastW: "",
        },
        observer: {
            remark: "",
            obsINT: "",
        },
    });

    const setError = (path: string[], value: string) => {
        setErrors((prev) => {
            const updated = { ...prev };
            let current: any = updated;

            for (let i = 0; i < path.length - 1; i++) {
                current[path[i]] = { ...current[path[i]] };
                current = current[path[i]];
            }

            current[path[path.length - 1]] = value;

            return updated;
        });
    };

    if (isLoading) {
        return <GlobalLoading />;
    }

    return (
        <SafeAreaView className="flex-1" edges={{ bottom: "additive" }}>
            <DataCollectionForm dataParams={dataParams} formData={formData} setField={setField} errors={errors} setError={setError} />
        </SafeAreaView>
    )
}