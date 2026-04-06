import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useEffect, useRef, useState } from "react";

import { router } from "expo-router";

import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";

import { Heading } from "@/components/ui/heading";
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from "@/components/ui/vstack";
import { getPsychrometric } from "@/src/utils/api";
import { computeObservedPeriod, getDB, getLPsychrometric, getLSynopData, withTransaction } from "@/src/utils/db";
import { formatNet3hr, formatPres, formatPres24, formatTemp, formatVaporP, formatWind } from "@/src/utils/formatters";
import { get24HoursAgo, get3HoursAgo } from "@/src/utils/time";
import { isTendencyValid, validateCeiling, validateField, validateMaxTemp, validateMinTemp } from "@/src/utils/validators";

import { Icon } from "@/components/ui/icon";
import { CircleGaugeIcon, CloseIcon, CloudRainWindIcon, CloudyIcon, FileText, ThermometerIcon, ViewIcon, WindIcon } from "lucide-react-native";
import { Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import CategoryGroup from "./CategoryGroup";
import CloudDirInput from "./CloudDirInput";
import CloudLayerInput from "./CloudLayerInput";
import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import ObservationHeader from "./ObservationHeader";
// import { checkApiConnection, saveSynopData, API_URL } from "../api"; // adjust path if needed
import { useUser } from "@/src/context/UserContext";
import { API_URL, checkApiConnection, saveSynopData } from "@/src/utils/api";

const TRACE = "0.01";

export default function DataCollectionForm({ dataParams, formData, setField, errors, setError }) {
    const toast = useToast();
    const { user } = useUser();

    const handleSaveObservation = async (
        mode: "save" | "update" | "qc"
    ): Promise<boolean> => {
        if (isSaveBtnLoading) return false;
        setIsSaveBtnLoading(true);

        try {
            const db = await getDB();

            // =========================
            // VALIDATION
            // =========================
            const allErrors: string[] = [];

            const validateObject = (obj: any, errObj: any) => {
                for (const key in obj) {
                    if (typeof obj[key] === "object" && obj[key] !== null) {
                        validateObject(obj[key], errObj[key]);
                    } else {
                        const err = errObj[key];
                        if (err && err.trim() !== "") {
                            allErrors.push(err);
                        }
                    }
                }
            };

            validateObject(formData, errors);

            if (allErrors.length > 0) {
                setAlertTitle("Invalid Observation Inputs");
                setAlertMessage("Please review highlighted fields.");
                handleOpenDialog();
                return false;
            }

            // =========================
            // CHECK EXISTING
            // =========================
            const existing = await db.getFirstAsync(
                `SELECT sID, isValidated FROM synop_data 
             WHERE stnID = ? AND sDate = ? AND sHour = ?`,
                [dataParams.stationId, dataParams.date, dataParams.time]
            );

            if (mode === "save" && existing) {
                setAlertTitle("Record Exists");
                setAlertMessage("Record already exists. Use Update instead.");
                handleOpenDialog();
                return false;
            }

            if (existing?.isValidated === 1 && mode !== "qc") {
                setAlertTitle("Already Validated");
                setAlertMessage("Validated records cannot be modified.");
                handleOpenDialog();
                return false;
            }

            // =========================
            // COMPUTE
            // =========================
            const computedTR = await computeObservedPeriod(
                db,
                dataParams.stationId,
                dataParams.date,
                dataParams.time
            );

            // =========================
            // FULL RECORD
            // =========================
            const record: any = {
                uID: user?.id ?? null,
                stnID: dataParams.stationId,
                sDate: dataParams.date,
                sHour: dataParams.time,

                heightLL: Number(formData.visibility.heightLL) || null,
                VV: Number(formData.visibility.VV) || null,
                SummTotal: Number(formData.visibility.SummTotal) || null,

                wDir: Number(formData.wind.wDir) || null,
                wSpd: Number(formData.wind.wSpd) || null,

                dBulb: Number(formData.temperature.dBulb) || null,
                wBulb: Number(formData.temperature.wBulb) || null,
                dPoiint: Number(formData.temperature.dPoiint) || null,
                RH: Number(formData.temperature.RH) || null,
                vaporP: Number(formData.temperature.vaporP) || null,
                maxTemp: Number(formData.temperature.maxTemp) || null,
                minTemp: Number(formData.temperature.minTemp) || null,

                stnP: Number(formData.pressure.stnP) || null,
                mslP: Number(formData.pressure.mslP) || null,
                altP: Number(formData.pressure.altP) || null,
                tendency: formData.pressure.tendency || null,
                net3hr: Number(formData.pressure.net3hr) || null,
                pres24: Number(formData.pressure.pres24) || null,

                pAttachTherm: Number(formData.pressure.pAttachTherm) || null,
                pObsBaro: Number(formData.pressure.pObsBaro) || null,
                pCorrection: Number(formData.pressure.pCorrection) || null,
                pBarograph: Number(formData.pressure.pBarograph) || null,
                pBaroCorrection: Number(formData.pressure.pBaroCorrection) || null,

                RR: formData.atmosphericPhenomena.RR
                    ? Number(formData.atmosphericPhenomena.RR)
                    : null,

                presW: formData.atmosphericPhenomena.presW
                    ? Number(formData.atmosphericPhenomena.presW)
                    : null,

                pastW1:
                    formData.atmosphericPhenomena.pastW?.[0] != null
                        ? Number(formData.atmosphericPhenomena.pastW[0])
                        : 0,

                pastW2:
                    formData.atmosphericPhenomena.pastW?.[1] != null
                        ? Number(formData.atmosphericPhenomena.pastW[1])
                        : 0,

                amtLC: formData.clouds.amtLC || null,

                amtFirstLayer: formData.clouds.firstLayer.amt || null,
                typeFirstLayer: formData.clouds.firstLayer.type || null,
                heightFirstLayer: formData.clouds.firstLayer.height || null,

                amtSecondLayer: formData.clouds.secondLayer.amt || null,
                typeSecondLayer: formData.clouds.secondLayer.type || null,
                heightSecondLayer: formData.clouds.secondLayer.height || null,

                amtThirdLayer: formData.clouds.thirdLayer.amt || null,
                typeThirdLayer: formData.clouds.thirdLayer.type || null,
                heightThirdLayer: formData.clouds.thirdLayer.height || null,

                amtFourthLayer: formData.clouds.fourthLayer.amt || null,
                typeFourthLayer: formData.clouds.fourthLayer.type || null,
                heightFourthLayer: formData.clouds.fourthLayer.height || null,

                ceiling: formData.clouds.ceiling === "UNL" ? "9999" : Number(formData.clouds.ceiling) * 10 || null,
                dirLow: formData.clouds.dirLow || null,
                dirMid: formData.clouds.dirMid || null,
                dirHigh: formData.clouds.dirHigh || null,

                remark: formData.observer.remark || null,
                obsINT: formData.observer.obsINT || null,

                tR: computedTR,

                summaryDate:
                    dataParams.time === "0000"
                        ? new Date(new Date().setDate(new Date().getDate() - 1))
                            .toISOString()
                            .slice(0, 10)
                        : new Date().toISOString().slice(0, 10),

                isValidated: mode === "qc" ? 1 : 0
            };

            // =========================
            // DYNAMIC SQL BUILDER
            // =========================
            const keys = Object.keys(record);
            const values = keys.map((k) => record[k]);

            await withTransaction(db, async () => {
                if (existing) {
                    const setClause = keys.map((k) => `${k}=?`).join(", ");

                    await db.runAsync(
                        `UPDATE synop_data SET ${setClause} WHERE sID=?`,
                        [...values, existing.sID]
                    );
                } else {
                    const placeholders = keys.map(() => "?").join(", ");

                    await db.runAsync(
                        `INSERT INTO synop_data (${keys.join(", ")}) VALUES (${placeholders})`,
                        values
                    );
                }
            });

            // =========================
            // API SYNC
            // =========================
            try {
                const isOnline = await checkApiConnection();

                if (isOnline) {
                    const apiPayload = {
                        ...record,
                        stnId: record.stnID
                    };
                    delete apiPayload.stnID;

                    if (existing) {
                        await fetch(`${API_URL}/api/synop_data`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(apiPayload),
                        });
                    } else {
                        await saveSynopData(apiPayload);
                    }
                }
            } catch (apiErr) {
                console.warn("API sync failed:", apiErr);
            }

            // =========================
            // SUCCESS
            // =========================
            setAlertTitle("Success");
            setAlertMessage(
                mode === "qc"
                    ? "Saved, validated, and synced."
                    : mode === "update"
                        ? "Observation updated."
                        : "Observation saved."
            );

            handleOpenDialog();
            return true;

        } catch (err) {
            console.error("Save failed:", err);
            setAlertTitle("Error");
            setAlertMessage("Failed to save observation.");
            handleOpenDialog();
            return false;
        } finally {
            setIsSaveBtnLoading(false);
        }
    };

    const [isSaveBtnLoading, setIsSaveBtnLoading] = useState<boolean>(false);
    const [showAlertDialog, setShowAlertDialog] = useState<boolean>(false);
    const [alertTitle, setAlertTitle] = useState<string>("");
    const [alertMessage, setAlertMessage] = useState<string>("");
    const handleOpenDialog = () => setShowAlertDialog(true);
    const handleClose = () => setShowAlertDialog(false);
    const handleSuccessClose = () => {
        setShowAlertDialog(false);
        router.replace("/");
    };
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [isRRTrace, setIsRRTrace] = useState<boolean>(false);

    useEffect(() => {
        if (isRRTrace) {
            setField(["atmosphericPhenomena", "RR"], TRACE);
            setError(["atmosphericPhenomena", "RR"], "");
        } else {
            setField(["atmosphericPhenomena", "RR"], "");
            setError(["atmosphericPhenomena", "RR"], "");
        }
    }, [isRRTrace]);

    const [mslP3hrAgo, setMslP3hrAgo] = useState<string | null>(null);
    const [mslP24hrAgo, setMslP24hrAgo] = useState<string | null>(null);

    const [net3hrSign, setNet3hrSign] = useState<number | null>(null);

    let is3hourly = false;
    let is6hourly = false;

    const time3Hourly = ["0000", "0300", "0600", "0900", "1200", "1500", "1800", "2100"];
    const time6Hourly = ["0000", "0600", "1200", "1800"];

    if (time3Hourly.includes(String(dataParams.time))) {
        is3hourly = true;
    }

    if (time6Hourly.includes(String(dataParams.time))) {
        is6hourly = true;
    }

    useEffect(() => {
        const loadNecessaryData = async () => {
            try {
                const stnID = dataParams.stationId;
                const db = await getDB();

                // --- 3 HOURS AGO ---
                const { date: sDate3hr, time: sHour3hr } =
                    get3HoursAgo(dataParams.date, dataParams.time);


                const synopData3hrAgo = await getLSynopData(
                    db,
                    stnID,
                    sHour3hr,
                    sDate3hr
                );

                setMslP3hrAgo(synopData3hrAgo?.[0]?.mslP ?? null);

                // --- 24 HOURS AGO (ONLY IF 6-HOURLY) ---
                if (!is6hourly) {
                    const { date: sDate24hr, time: sHour24hr } =
                        get24HoursAgo(dataParams.date, dataParams.time);

                    const synopData24hrAgo = await getLSynopData(
                        db,
                        stnID,
                        sHour24hr,
                        sDate24hr
                    );

                    setMslP24hrAgo(synopData24hrAgo?.[0]?.mslP ?? null);
                } else {
                    setMslP24hrAgo(null);
                }

            } catch (error) {
                console.error("Error loading necessary data:", error);
                setMslP3hrAgo(null);
                setMslP24hrAgo(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadNecessaryData();
    }, [dataParams.stationId, dataParams.date, dataParams.time, is6hourly]);


    const stnPAutoComputeFn = (stnP: string) => {
        const pressureRegex = /^(9\d{2}|10\d{2})\.\d$/;

        if (!pressureRegex.test(stnP)) {
            setField(["pressure", "mslP"], "");
            setField(["pressure", "altP"], "");
            setField(["pressure", "pBaroCorrection"], "");

            setNet3hrSign(null);
            setField(["pressure", "net3hr"], "");
            setField(["pressure", "pres24"], "");
            return;
        }

        const stationPressure = Number(stnP);

        const computedMsl = (
            stationPressure + Number(dataParams.mslCor ?? 0)
        ).toFixed(1);

        const computedAlt = (
            stationPressure + Number(dataParams.altCor ?? 0)
        ).toFixed(1);

        setField(["pressure", "mslP"], computedMsl);
        setField(["pressure", "altP"], computedAlt);

        const pBarograph = Number(formData.pressure.pBarograph);

        if (!isNaN(pBarograph) && pBarograph > 0) {
            const correction = (stationPressure - pBarograph).toFixed(1);
            setField(["pressure", "pBaroCorrection"], correction);
        } else {
            setField(["pressure", "pBaroCorrection"], "");
        }

        // 🔥 ---- Derive 3hr & 24hr changes from computed MSL ----

        const numericMsl = Number(computedMsl);
        const msl3 = Number(mslP3hrAgo ?? 0);
        const msl24 = Number(mslP24hrAgo ?? 0);

        // ---- 3 Hour Change ----
        if (!isNaN(msl3) && msl3 !== 0) {
            const diff3 = Number((numericMsl - msl3).toFixed(1));

            const sign3 = Math.sign(diff3);             // -1 = falling, 0 = no change, 1 = rising
            const absDiff3 = Math.abs(diff3).toFixed(1);

            setNet3hrSign(sign3);                       // store sign only
            setField(["pressure", "net3hr"], absDiff3); // absolute magnitude
        } else {
            setNet3hrSign(null);
            setField(["pressure", "net3hr"], "");
        }

        // ---- 24 Hour Change ----
        if (!isNaN(msl24) && msl24 !== 0) {
            const diff24 = Number((numericMsl - msl24).toFixed(1));
            setField(["pressure", "pres24"], String(Math.abs(diff24).toFixed(1)));
        } else {
            setField(["pressure", "pres24"], "");
        }
    };

    const barographAutoComputeFn = (pBarograph: string) => {
        const pressureRegex = /^(9\d{2}|10\d{2})\.\d$/;

        if (!pressureRegex.test(pBarograph)) {
            setField(["pressure", "pBaroCorrection"], "");
            return;
        }

        const barograph = Number(pBarograph);
        const stationPressure = Number(formData.pressure.stnP);

        if (!isNaN(barograph) && barograph > 0) {
            const correction = (stationPressure - barograph).toFixed(1);
            setField(["pressure", "pBaroCorrection"], correction);
        } else {
            setField(["pressure", "pBaroCorrection"], "");
        }
    }

    const fetchPsychrometric = async (
        dBulb: string,
        wBulb: string
    ) => {
        try {
            const db = await getDB(); // 🔥 no await unless your function truly returns a Promise

            // Prevent invalid numbers
            const d = parseFloat(dBulb);
            const w = parseFloat(wBulb);

            if (isNaN(d) || isNaN(w)) {
                console.warn("Invalid dBulb or wBulb values");
                return null;
            }

            // 1️⃣ Try API first
            let apiData = null;

            try {
                apiData = await getPsychrometric(dBulb, wBulb);
            } catch (apiError) {
                console.warn("API failed, falling back to local:", apiError);
            }

            if (apiData) return apiData;

            // 2️⃣ Fallback to local
            const localData = await getLPsychrometric(db, d, w);

            return localData ?? null;

        } catch (error) {
            console.error("fetchPsychrometric fatal error:", error);
            return null;
        }
    };

    const autoComputePsychrometric = async (dBulb: string, wBulb: string) => {
        if (!dBulb || !wBulb) {
            setField(["temperature", "dPoiint"], "");
            setField(["temperature", "RH"], "");
            setField(["temperature", "vaporP"], "");
            return;
        }

        const toastId = String(Math.random());

        // 🔄 Loading toast
        toast.show({
            id: toastId,
            placement: 'top',
            duration: null,
            render: () => (
                <Toast
                    action="muted"
                    variant="outline"
                >
                    <VStack space="xs">
                        <ToastTitle className="font-semibold">
                            Retrieving Data...
                        </ToastTitle>
                        <ToastDescription size="sm">
                            Comparing values to database for Dew Point, RH, and Vapor Pressure.
                        </ToastDescription>
                    </VStack>
                </Toast>
            ),
        });

        try {
            const pD = await fetchPsychrometric(dBulb, wBulb);

            toast.close(toastId);

            const isValid =
                pD &&
                pD.dPoint != null &&
                pD.RH != null &&
                pD.vPressure != null;

            if (isValid) {
                const { dPoint, RH, vPressure } = pD;

                setField(["temperature", "dPoiint"], String(dPoint));
                setField(["temperature", "RH"], String(RH).split(".")[0]);
                setField(["temperature", "vaporP"], String(vPressure));

                toast.show({
                    placement: 'top',
                    duration: 3000,
                    render: ({ id }) => (
                        <Toast
                            action="success"
                            variant="outline"
                        >
                            <VStack space="xs">
                                <ToastTitle className="font-semibold text-green-600">
                                    Data Retrieved
                                </ToastTitle>
                                <ToastDescription size="sm">
                                    Dew Point, RH, and Vapor Pressure loaded.
                                </ToastDescription>
                            </VStack>
                            <Pressable onPress={() => toast.close(id)}>
                                <Icon as={CloseIcon} />
                            </Pressable>
                        </Toast>
                    ),
                });

            } else {
                toast.show({
                    placement: 'top',
                    duration: 3000,
                    render: ({ id }) => (
                        <Toast
                            action="warning"
                            variant="outline"
                        >
                            <VStack space="xs">
                                <ToastTitle className="font-semibold text-warning-600">
                                    No Psychrometric Data
                                </ToastTitle>
                                <ToastDescription size="sm">
                                    No matching data found.
                                </ToastDescription>
                            </VStack>
                            <Pressable onPress={() => toast.close(id)} className="absolute top-2 right-2">
                                <Icon as={CloseIcon} />
                            </Pressable>
                        </Toast>
                    ),
                });
            }

        } catch (err) {
            toast.close(toastId);

            toast.show({
                placement: 'top',
                duration: 3000,
                render: ({ id }) => (
                    <Toast
                        action="error"
                        variant="outline"
                    >
                        <VStack space="xs">
                            <ToastTitle className="font-semibold text-red-600">
                                Error Fetching Data
                            </ToastTitle>
                            <ToastDescription size="sm">
                                Something went wrong.
                            </ToastDescription>
                        </VStack>
                        <Pressable onPress={() => toast.close(id)}>
                            <Icon as={CloseIcon} />
                        </Pressable>
                    </Toast>
                ),
            });
        }
    };

    const dBulbAutoComputeFn = async (dBulb: string) => {
        const wBulb = formData.temperature.wBulb;
        await autoComputePsychrometric(dBulb, wBulb);
    };

    const wBulbAutoComputeFn = async (wBulb: string) => {
        const dBulb = formData.temperature.dBulb;
        await autoComputePsychrometric(dBulb, wBulb);
    };

    const inputRefs = useRef<Record<string, any>>({});

    const registerRef = (key: string, ref: any) => {
        if (ref) inputRefs.current[key] = ref;
    }

    const fieldOrder = [
        "visibility.heightLL",
        "visibility.VV",
        "visibility.SummTotal",
        "wind.wDir",
        "wind.wSpd",

        "temperature.dBulb",
        "temperature.wBulb",
        "temperature.dPoiint",
        "temperature.RH",
        "temperature.vaporP",
        "temperature.maxTemp",
        "temperature.minTemp",

        "pressure.stnP",
        "pressure.mslP",
        "pressure.tendency",
        "pressure.net3hr",
        "pressure.pres24",
        "pressure.altP",

        "pressure.pAttachTherm",
        "pressure.pObsBaro",
        "pressure.pCorrection",
        "pressure.pBarograph",

        "atmosphericPhenomena.RR",
        "atmosphericPhenomena.presW",
        "atmosphericPhenomena.pastW",

        "clouds.amtLC",
        "clouds.firstLayer.amt",
        "clouds.firstLayer.type",
        "clouds.firstLayer.height",
        "clouds.secondLayer.amt",
        "clouds.secondLayer.type",
        "clouds.secondLayer.height",
        "clouds.thirdLayer.amt",
        "clouds.thirdLayer.type",
        "clouds.thirdLayer.height",
        "clouds.fourthLayer.amt",
        "clouds.fourthLayer.type",
        "clouds.fourthLayer.height",
        "clouds.ceiling",
        "clouds.dirLow",
        "clouds.dirMid",
        "clouds.dirHigh",

        "observer.remark",
        "observer.obsINT"
    ];

    const getFieldValue = (path: string) => {
        return path.split(".").reduce((obj, key) => obj?.[key], formData)
    }

    const focusNextEmptyField = (currentKey: string) => {

        const currentIndex = fieldOrder.indexOf(currentKey)

        if (currentIndex === -1) return

        for (let i = currentIndex + 1; i < fieldOrder.length; i++) {

            const nextKey = fieldOrder[i]

            const value = getFieldValue(nextKey)

            // If field already has value → skip it
            if (value !== null && value !== undefined && value !== "") {
                continue
            }

            const ref = inputRefs.current[nextKey]

            if (ref?.focus) {
                ref.focus()
                break
            }
        }
    }


    const [pendingAdvance, setPendingAdvance] = useState<string | null>(null);
    useEffect(() => {
        if (!pendingAdvance) return;

        const id = requestAnimationFrame(() => {
            focusNextEmptyField(pendingAdvance);
            setPendingAdvance(null);
        });

        return () => cancelAnimationFrame(id);
    }, [pendingAdvance]);

    return (
        <Box className="flex-1 p-2 gap-2">
            {/* Observational Parameters */}
            <ObservationHeader
                stationName={dataParams.stationName}
                date={dataParams.date}
                time={dataParams.time}
                status={dataParams.status}
                isSaving={isSaveBtnLoading}
                onAction={handleSaveObservation}
            />

            <KeyboardAwareScrollView className="flex-1 rounded-xl" automaticallyAdjustKeyboardInsets bottomOffset={10} showsVerticalScrollIndicator={false}>
                <Box className="gap-2">
                    {/* Grouped Inputs */}
                    <CategoryGroup title="Visibility" icon={ViewIcon}>
                        <FormInput label="HT of Lowest Level" value={formData.visibility.heightLL} maxLength={1} setterFn={(v: string) => setField(["visibility", "heightLL"], v)} error={errors.visibility.heightLL} setErrFn={(m: string) => setError(["visibility", "heightLL"], m)} validateFn={(v: string) => { return validateField(v, "HT of Lowest Level", { numeric: false }) }} fieldKey="visibility.heightLL" inputRef={(ref: any) => registerRef("visibility.heightLL", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Visibility" value={formData.visibility.VV} maxLength={2} setterFn={(v: string) => setField(["visibility", "VV"], v)} error={errors.visibility.VV} setErrFn={(m: string) => setError(["visibility", "VV"], m)} validateFn={(v: string) => { return validateField(v, "Visibility", { numeric: false }) }} fieldKey="visibility.VV" inputRef={(ref: any) => registerRef("visibility.VV", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Summation Total" value={formData.visibility.SummTotal} maxLength={1} setterFn={(v: string) => setField(["visibility", "SummTotal"], v)} error={errors.visibility.SummTotal} setErrFn={(m: string) => setError(["visibility", "SummTotal"], m)} validateFn={(v: string) => { return validateField(v, "Summation Total", { numeric: false }) }} fieldKey="visibility.SummTotal" inputRef={(ref: any) => registerRef("visibility.SummTotal", ref)} setPendingAdvance={setPendingAdvance} />
                    </CategoryGroup>

                    <CategoryGroup title="Wind" icon={WindIcon}>
                        <FormInput label="Direction(Degrees)" value={formData.wind.wDir} maxLength={3} setterFn={(v: string) => setField(["wind", "wDir"], v)} error={errors.wind.wDir} setErrFn={(m: string) => setError(["wind", "wDir"], m)} formatFn={formatWind} validateFn={(v: string) => { return validateField(v, "Wind Direction", { numeric: false }) }} fieldKey="wind.wDir" inputRef={(ref: any) => registerRef("wind.wDir", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Speed(MPS)" value={formData.wind.wSpd} maxLength={3} setterFn={(v: string) => setField(["wind", "wSpd"], v)} error={errors.wind.wSpd} setErrFn={(m: string) => setError(["wind", "wSpd"], m)} formatFn={formatWind} validateFn={(v: string) => { return validateField(v, "Wind Speed", { numeric: false }) }} fieldKey="wind.wSpd" inputRef={(ref: any) => registerRef("wind.wSpd", ref)} setPendingAdvance={setPendingAdvance} />
                    </CategoryGroup>

                    <CategoryGroup title="Temperature" icon={ThermometerIcon}>
                        <FormInput label="Dry Bulb (°C)" value={formData.temperature.dBulb} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "dBulb"], v)} error={errors.temperature.dBulb} setErrFn={(m: string) => setError(["temperature", "dBulb"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Dry Bulb", { numeric: false }) }} autoComputeFn={dBulbAutoComputeFn} fieldKey="temperature.dBulb" inputRef={(ref: any) => registerRef("temperature.dBulb", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Wet Bulb (°C)" value={formData.temperature.wBulb} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "wBulb"], v)} error={errors.temperature.wBulb} setErrFn={(m: string) => setError(["temperature", "wBulb"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Wet Bulb", { numeric: false }) }} autoComputeFn={wBulbAutoComputeFn} fieldKey="temperature.wBulb" inputRef={(ref: any) => registerRef("temperature.wBulb", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Dew Point (°C)" value={formData.temperature.dPoiint} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "dPoiint"], v)} error={errors.temperature.dPoiint} setErrFn={(m: string) => setError(["temperature", "dPoiint"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Dew Point", { numeric: false }) }} fieldKey="temperature.dPoiint" inputRef={(ref: any) => registerRef("temperature.dPoiint", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Relative Humidity (%)" value={formData.temperature.RH} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "RH"], v)} error={errors.temperature.RH} setErrFn={(m: string) => setError(["temperature", "RH"], m)} validateFn={(v: string) => { return validateField(v, "Relative Humidity", { numeric: false }) }} fieldKey="temperature.RH" inputRef={(ref: any) => registerRef("temperature.RH", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Vapor Pressure" value={formData.temperature.vaporP} maxLength={6} maxTypableChars={4} setterFn={(v: string) => setField(["temperature", "vaporP"], v)} error={errors.temperature.vaporP} setErrFn={(m: string) => setError(["temperature", "vaporP"], m)} formatFn={formatVaporP} validateFn={(v: string) => { return validateField(v, "Vapor Pressure", { numeric: false }) }} fieldKey="temperature.vaporP" inputRef={(ref: any) => registerRef("temperature.vaporP", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Max. Temperature" value={formData.temperature.maxTemp} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "maxTemp"], v)} error={errors.temperature.maxTemp} setErrFn={(m: string) => setError(["temperature", "maxTemp"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateMaxTemp(dataParams.stationId, dataParams.date, dataParams.time, v, formData.temperature.dBulb) }} fieldKey="temperature.maxTemp" inputRef={(ref: any) => registerRef("temperature.maxTemp", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Min. Temperature" value={formData.temperature.minTemp} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "minTemp"], v)} error={errors.temperature.minTemp} setErrFn={(m: string) => setError(["temperature", "minTemp"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateMinTemp(dataParams.stationId, dataParams.date, dataParams.time, v, formData.temperature.dBulb) }} fieldKey="temperature.minTemp" inputRef={(ref: any) => registerRef("temperature.minTemp", ref)} setPendingAdvance={setPendingAdvance} />
                    </CategoryGroup>

                    <CategoryGroup title="Atmospheric Pressure" icon={CircleGaugeIcon}>
                        <FormInput label="Station Pressure" value={formData.pressure.stnP} maxLength={6} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "stnP"], v)} error={errors.pressure.stnP} setErrFn={(m: string) => setError(["pressure", "stnP"], m)} formatFn={formatPres} validateFn={(v: string) => { return validateField(v, "Station Pressure", { numeric: false }) }} autoComputeFn={stnPAutoComputeFn} fieldKey="pressure.stnP" inputRef={(ref: any) => registerRef("pressure.stnP", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="MSL Pressure" value={formData.pressure.mslP} maxLength={6} setterFn={(v: string) => setField(["pressure", "mslP"], v)} error={errors.pressure.mslP} setErrFn={(m: string) => setError(["pressure", "mslP"], m)} formatFn={(v: string) => { return formatPres(v.length === 4 ? v.slice(1) : v) }} validateFn={(v: string) => { return validateField(v, "MSL Pressure", { numeric: false }) }} fieldKey="pressure.mslP" inputRef={(ref: any) => registerRef("pressure.mslP", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Tendency" value={formData.pressure.tendency} maxLength={1} setterFn={(v: string) => setField(["pressure", "tendency"], v)} error={errors.pressure.tendency} setErrFn={(m: string) => setError(["pressure", "tendency"], m)} validateFn={(v: string) => { return isTendencyValid(v, net3hrSign) }} fieldKey="pressure.tendency" inputRef={(ref: any) => registerRef("pressure.tendency", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="NET 3-hr Change" value={formData.pressure.net3hr} maxLength={4} setterFn={(v: string) => setField(["pressure", "net3hr"], v)} error={errors.pressure.net3hr} setErrFn={(m: string) => setError(["pressure", "net3hr"], m)} formatFn={formatNet3hr} validateFn={(v: string) => { return validateField(v, "NET 3-hr Change", { numeric: false }) }} fieldKey="pressure.net3hr" inputRef={(ref: any) => registerRef("pressure.net3hr", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="24-hr Pressure Change" value={formData.pressure.pres24} maxLength={4} setterFn={(v: string) => setField(["pressure", "pres24"], v)} error={errors.pressure.pres24} setErrFn={(m: string) => setError(["pressure", "pres24"], m)} formatFn={formatPres24} validateFn={(v: string) => { return validateField(v, "24-hr Pressure Change", { numeric: false }) }} fieldKey="pressure.pres24" inputRef={(ref: any) => registerRef("pressure.pres24", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Altimeter Setting" value={formData.pressure.altP} maxLength={6} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "altP"], v)} error={errors.pressure.altP} setErrFn={(m: string) => setError(["pressure", "altP"], m)} formatFn={formatPres} validateFn={(v: string) => { return validateField(v, "Altimeter Setting", { numeric: false }) }} fieldKey="pressure.altP" inputRef={(ref: any) => registerRef("pressure.altP", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Attached Thermometer" value={formData.pressure.pAttachTherm} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "pAttachTherm"], v)} error={errors.pressure.pAttachTherm} setErrFn={(m: string) => setError(["pressure", "pAttachTherm"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Attached Thermometer", { numeric: false }) }} fieldKey="pressure.pAttachTherm" inputRef={(ref: any) => registerRef("pressure.pAttachTherm", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Barometer" value={formData.pressure.pObsBaro} maxLength={6} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "pObsBaro"], v)} error={errors.pressure.pObsBaro} setErrFn={(m: string) => setError(["pressure", "pObsBaro"], m)} formatFn={formatPres} validateFn={(v: string) => { return validateField(v, "Observed Barometer", { numeric: false }) }} fieldKey="pressure.pObsBaro" inputRef={(ref: any) => registerRef("pressure.pObsBaro", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Barometer Correction" value={formData.pressure.pCorrection} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "pCorrection"], v)} error={errors.pressure.pCorrection} setErrFn={(m: string) => setError(["pressure", "pCorrection"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Barometer Correction", { numeric: false }) }} fieldKey="pressure.pCorrection" inputRef={(ref: any) => registerRef("pressure.pCorrection", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Barograph" value={formData.pressure.pBarograph} maxLength={6} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "pBarograph"], v)} error={errors.pressure.pBarograph} setErrFn={(m: string) => setError(["pressure", "pBarograph"], m)} formatFn={formatPres} validateFn={(v: string) => { return validateField(v, "Barograph", { numeric: false }) }} autoComputeFn={barographAutoComputeFn} fieldKey="pressure.pBarograph" inputRef={(ref: any) => registerRef("pressure.pBarograph", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Barograph Correction" value={formData.pressure.pBaroCorrection} maxLength={5} readonly setterFn={(v: string) => setField(["pressure", "pBaroCorrection"], v)} error={errors.pressure.pBaroCorrection} setErrFn={(m: string) => setError(["pressure", "pBaroCorrection"], m)} validateFn={(v: string) => { return validateField(v, "Barograph Correction", { numeric: false }) }} fieldKey="pressure.pBaroCorrection" inputRef={(ref: any) => registerRef("pressure.pBaroCorrection", ref)} setPendingAdvance={setPendingAdvance} />
                    </CategoryGroup>

                    <CategoryGroup title="Atmospheric Phenomena" icon={CloudRainWindIcon}>
                        <FormInput label="Rainfall Amount(mm)" value={formData.atmosphericPhenomena.RR} maxLength={4} setterFn={(v: string) => setField(["atmosphericPhenomena", "RR"], v)} error={errors.atmosphericPhenomena.RR} setErrFn={(m: string) => setError(["atmosphericPhenomena", "RR"], m)} showCheckbox={true} checked={isRRTrace} checkboxVal={TRACE} onCheckChange={setIsRRTrace} validateFn={(v: string) => { return validateField(v, "Rainfall Amount", { numeric: false }) }} fieldKey="atmosphericPhenomena.RR" inputRef={(ref: any) => registerRef("atmosphericPhenomena.RR", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Present Weather" value={formData.atmosphericPhenomena.presW} maxLength={2} setterFn={(v: string) => setField(["atmosphericPhenomena", "presW"], v)} error={errors.atmosphericPhenomena.presW} setErrFn={(m: string) => setError(["atmosphericPhenomena", "presW"], m)} validateFn={(v: string) => { return validateField(v, "Present Weather", { numeric: false }) }} fieldKey="atmosphericPhenomena.presW" inputRef={(ref: any) => registerRef("atmosphericPhenomena.presW", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Past Weather" value={formData.atmosphericPhenomena.pastW} maxLength={2} setterFn={(v: string) => setField(["atmosphericPhenomena", "pastW"], v)} error={errors.atmosphericPhenomena.pastW} setErrFn={(m: string) => setError(["atmosphericPhenomena", "pastW"], m)} validateFn={(v: string) => { return validateField(v, "Past Weather", { numeric: false }) }} fieldKey="atmosphericPhenomena.pastW" inputRef={(ref: any) => registerRef("atmosphericPhenomena.pastW", ref)} setPendingAdvance={setPendingAdvance} />
                    </CategoryGroup>

                    <CategoryGroup title="Clouds" icon={CloudyIcon}>
                        <FormInput label="Amounts of Low Clouds" value={formData.clouds.amtLC} maxLength={1} setterFn={(v: string) => setField(["clouds", "amtLC"], v)} error={errors.clouds.amtLC} setErrFn={(m: string) => setError(["clouds", "amtLC"], m)} validateFn={(v: string) => { return validateField(v, "Amounts of Low Clouds", { numeric: false }) }} fieldKey="clouds.amtLC" inputRef={(ref: any) => registerRef("clouds.amtLC", ref)} setPendingAdvance={setPendingAdvance} />
                        <CloudLayerInput
                            label="First Layer"
                            amount={formData.clouds.firstLayer.amt}
                            type={formData.clouds.firstLayer.type}
                            height={formData.clouds.firstLayer.height}
                            setAmount={(v) => setField(["clouds", "firstLayer", "amt"], v)}
                            setType={(v) => setField(["clouds", "firstLayer", "type"], v)}
                            setHeight={(v) => setField(["clouds", "firstLayer", "height"], v)}
                            errorAmount={errors.clouds.firstLayer.amt}
                            errorType={errors.clouds.firstLayer.type}
                            errorHeight={errors.clouds.firstLayer.height}
                            setErrorAmount={(m) => setError(["clouds", "firstLayer", "amt"], m)}
                            setErrorType={(m) => setError(["clouds", "firstLayer", "type"], m)}
                            setErrorHeight={(m) => setError(["clouds", "firstLayer", "height"], m)}

                            amountKey="clouds.firstLayer.amt"
                            typeKey="clouds.firstLayer.type"
                            heightKey="clouds.firstLayer.height"

                            amountRef={(ref: any) => registerRef("clouds.firstLayer.amt", ref)}
                            typeRef={(ref: any) => registerRef("clouds.firstLayer.type", ref)}
                            heightRef={(ref: any) => registerRef("clouds.firstLayer.height", ref)}

                            setPendingAdvance={setPendingAdvance}
                        />
                        <CloudLayerInput
                            label="Second Layer"
                            amount={formData.clouds.secondLayer.amt}
                            type={formData.clouds.secondLayer.type}
                            height={formData.clouds.secondLayer.height}
                            setAmount={(v) => setField(["clouds", "secondLayer", "amt"], v)}
                            setType={(v) => setField(["clouds", "secondLayer", "type"], v)}
                            setHeight={(v) => setField(["clouds", "secondLayer", "height"], v)}
                            errorAmount={errors.clouds.secondLayer.amt}
                            errorType={errors.clouds.secondLayer.type}
                            errorHeight={errors.clouds.secondLayer.height}
                            setErrorAmount={(m) => setError(["clouds", "secondLayer", "amt"], m)}
                            setErrorType={(m) => setError(["clouds", "secondLayer", "type"], m)}
                            setErrorHeight={(m) => setError(["clouds", "secondLayer", "height"], m)}

                            amountKey="clouds.secondLayer.amt"
                            typeKey="clouds.secondLayer.type"
                            heightKey="clouds.secondLayer.height"

                            amountRef={(ref: any) => registerRef("clouds.secondLayer.amt", ref)}
                            typeRef={(ref: any) => registerRef("clouds.secondLayer.type", ref)}
                            heightRef={(ref: any) => registerRef("clouds.secondLayer.height", ref)}

                            setPendingAdvance={setPendingAdvance}
                        />
                        <CloudLayerInput
                            label="Third Layer"
                            amount={formData.clouds.thirdLayer.amt}
                            type={formData.clouds.thirdLayer.type}
                            height={formData.clouds.thirdLayer.height}
                            setAmount={(v) => setField(["clouds", "thirdLayer", "amt"], v)}
                            setType={(v) => setField(["clouds", "thirdLayer", "type"], v)}
                            setHeight={(v) => setField(["clouds", "thirdLayer", "height"], v)}
                            errorAmount={errors.clouds.thirdLayer.amt}
                            errorType={errors.clouds.thirdLayer.type}
                            errorHeight={errors.clouds.thirdLayer.height}
                            setErrorAmount={(m) => setError(["clouds", "thirdLayer", "amt"], m)}
                            setErrorType={(m) => setError(["clouds", "thirdLayer", "type"], m)}
                            setErrorHeight={(m) => setError(["clouds", "thirdLayer", "height"], m)}

                            amountKey="clouds.thirdLayer.amt"
                            typeKey="clouds.thirdLayer.type"
                            heightKey="clouds.thirdLayer.height"

                            amountRef={(ref: any) => registerRef("clouds.thirdLayer.amt", ref)}
                            typeRef={(ref: any) => registerRef("clouds.thirdLayer.type", ref)}
                            heightRef={(ref: any) => registerRef("clouds.thirdLayer.height", ref)}

                            setPendingAdvance={setPendingAdvance}
                        />
                        <CloudLayerInput
                            label="Fourth Layer"
                            amount={formData.clouds.fourthLayer.amt}
                            type={formData.clouds.fourthLayer.type}
                            height={formData.clouds.fourthLayer.height}
                            setAmount={(v) => setField(["clouds", "fourthLayer", "amt"], v)}
                            setType={(v) => setField(["clouds", "fourthLayer", "type"], v)}
                            setHeight={(v) => setField(["clouds", "fourthLayer", "height"], v)}
                            errorAmount={errors.clouds.fourthLayer.amt}
                            errorType={errors.clouds.fourthLayer.type}
                            errorHeight={errors.clouds.fourthLayer.height}
                            setErrorAmount={(m) => setError(["clouds", "fourthLayer", "amt"], m)}
                            setErrorType={(m) => setError(["clouds", "fourthLayer", "type"], m)}
                            setErrorHeight={(m) => setError(["clouds", "fourthLayer", "height"], m)}

                            amountKey="clouds.fourthLayer.amt"
                            typeKey="clouds.fourthLayer.type"
                            heightKey="clouds.fourthLayer.height"

                            amountRef={(ref: any) => registerRef("clouds.fourthLayer.amt", ref)}
                            typeRef={(ref: any) => registerRef("clouds.fourthLayer.type", ref)}
                            heightRef={(ref: any) => registerRef("clouds.fourthLayer.height", ref)}

                            setPendingAdvance={setPendingAdvance}
                        />
                        <FormInput label="Ceiling" value={formData.clouds.ceiling} maxLength={3} setterFn={(v: string) => setField(["clouds", "ceiling"], v)} error={errors.clouds.ceiling} setErrFn={(m: string) => setError(["clouds", "ceiling"], m)} validateFn={(v: string) => { return validateField(v, "Ceiling", { customFn: (val) => validateCeiling(val) }) }} fieldKey="clouds.ceiling" inputRef={(ref: any) => registerRef("clouds.ceiling", ref)} setPendingAdvance={setPendingAdvance} isAlphanumeric />
                        <CloudDirInput
                            label="Direction of Low Clouds"
                            value={formData.clouds.dirLow}
                            onChange={(v: string) => {
                                setField(["clouds", "dirLow"], v);
                                const { isValid, error } = validateField(
                                    v,
                                    "Direction of Low Clouds",
                                    { numeric: false }
                                );
                                setError(["clouds", "dirLow"], isValid ? "" : error || "");
                            }}
                            fieldKey="clouds.dirLow" setPendingAdvance={setPendingAdvance}
                        />

                        <CloudDirInput
                            label="Direction of Mid Clouds"
                            value={formData.clouds.dirMid}
                            onChange={(v: string) => {
                                setField(["clouds", "dirMid"], v);
                                const { isValid, error } = validateField(
                                    v,
                                    "Direction of Mid Clouds",
                                    { numeric: false }
                                );
                                setError(["clouds", "dirMid"], isValid ? "" : error || "");
                            }}
                            fieldKey="clouds.dirMid" setPendingAdvance={setPendingAdvance}
                        />

                        <CloudDirInput
                            label="Direction of High Clouds"
                            value={formData.clouds.dirHigh}
                            onChange={(v: string) => {
                                setField(["clouds", "dirHigh"], v);
                                const { isValid, error } = validateField(
                                    v,
                                    "Direction of High Clouds",
                                    { numeric: false }
                                );
                                setError(["clouds", "dirHigh"], isValid ? "" : error || "");
                            }}
                            fieldKey="clouds.dirHigh" setPendingAdvance={setPendingAdvance}
                        />
                    </CategoryGroup>

                    <CategoryGroup title="Remarks and Signature" icon={FileText}>
                        <FormTextarea label="Remarks" value={formData.observer.remark} maxLength={255} setterFn={(v: string) => setField(["observer", "remark"], v)} error={errors.observer.remark} setErrFn={(m: string) => setError(["observer", "remark"], m)} fieldKey="observer.remark" inputRef={(ref: any) => registerRef("observer.remark", ref)} setPendingAdvance={setPendingAdvance} />
                        <FormInput label="Observer's Signature" value={formData.observer.obsINT} setterFn={(v: string) => setField(["observer", "obsINT"], v)} error={errors.observer.obsINT} setErrFn={(m: string) => setError(["observer", "obsINT"], m)} isAlphanumeric={true} validateFn={(v: string) => { return validateField(v, "Observer's Signature", { required: true }) }} fieldKey="observer.obsINT" inputRef={(ref: any) => registerRef("observer.obsINT", ref)} setPendingAdvance={setPendingAdvance} />
                    </CategoryGroup>
                </Box>
            </KeyboardAwareScrollView>

            {/* Dynamic Alert Dialog */}
            <AlertDialog isOpen={showAlertDialog}>
                <AlertDialogBackdrop />

                <AlertDialogContent className="rounded-2xl px-5 py-6">
                    <AlertDialogHeader className="mb-3">
                        <Heading
                            className={`text-lg font-semibold ${alertTitle === "Success"
                                ? "text-green-600"
                                : alertTitle === "Save Error"
                                    ? "text-red-600"
                                    : "text-blue-500"
                                }`}
                        >
                            {alertTitle}
                        </Heading>
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <Box
                            className={`rounded-xl px-4 py-3 ${alertTitle === "Success"
                                ? "bg-green-50"
                                : alertTitle === "Save Error"
                                    ? "bg-red-50"
                                    : "bg-blue-50"
                                }`}
                        >
                            <Text className="text-sm leading-relaxed text-gray-800">
                                {alertMessage}
                            </Text>
                        </Box>
                    </AlertDialogBody>

                    <AlertDialogFooter className="mt-5">
                        <Button
                            action="primary"
                            onPress={
                                alertTitle === "Success"
                                    ? handleSuccessClose
                                    : handleClose
                            }
                            size="sm"
                            className="rounded-xl px-6 bg-blue-400 active:bg-blue-500"
                        >
                            <ButtonText className="text-white font-medium">
                                OK
                            </ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
}