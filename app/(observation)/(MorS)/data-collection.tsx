import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { getDB, getLSynopData } from "@/src/utils/db";
import { router, useLocalSearchParams } from "expo-router";
import { Goal } from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DataCollectionScreen() {
    const onSave = async () => {
        setIsSaveBtnLoading(true);

        try {
            const db = await getDB();

            const record = {
                stnID: Number(params.stationId),
                MorS: MorS,
                sDate: params.date,
                sHour: params.time,

                SurfaceWind: formData.SurfaceWind || null,
                PresVV: formData.PresVV || null,
                PresWx: formData.PresWx || null,

                Cloud1: formData.Cloud1 || null,
                Cloud2: formData.Cloud2 || null,
                Cloud3: formData.Cloud3 || null,
                Cloud4: formData.Cloud4 || null,

                Tem: formData.Tem ? Number(formData.Tem) : null,
                Dew: formData.Dew ? Number(formData.Dew) : null,

                AltPres: formData.altP ? Number(formData.altP) : null,

                Supplemental: formData.Supplemental || null,
                Remarks: formData.remarks || null,

                Signature: formData.Signature || null,
                ATS: formData.ATS || null
            };

            await db.withTransactionAsync(async () => {

                const res = await db.runAsync(
                    `UPDATE aerodrome SET
                    SurfaceWind = ?,
                    PresVV = ?,
                    PresWx = ?,

                    Cloud1 = ?,
                    Cloud2 = ?,
                    Cloud3 = ?,
                    Cloud4 = ?,

                    Tem = ?,
                    Dew = ?,
                    AltPres = ?,

                    Supplemental = ?,
                    Remarks = ?,

                    Signature = ?,
                    ATS = ?,

                    date_updated = datetime('now')

                 WHERE stnID = ?
                 AND MorS = ?
                 AND sDate = ?
                 AND sHour = ?`,
                    [
                        record.SurfaceWind,
                        record.PresVV,
                        record.PresWx,

                        record.Cloud1,
                        record.Cloud2,
                        record.Cloud3,
                        record.Cloud4,

                        record.Tem,
                        record.Dew,
                        record.AltPres,

                        record.Supplemental,
                        record.Remarks,

                        record.Signature,
                        record.ATS,

                        record.stnID,
                        record.MorS,
                        record.sDate,
                        record.sHour
                    ]
                );

                if (!res || (res.rowsAffected ?? res.changes ?? 0) === 0) {

                    await db.runAsync(
                        `INSERT INTO aerodrome (
                        stnID,
                        MorS,
                        sDate,
                        sHour,

                        SurfaceWind,
                        PresVV,
                        PresWx,

                        Cloud1,
                        Cloud2,
                        Cloud3,
                        Cloud4,

                        Tem,
                        Dew,
                        AltPres,

                        Supplemental,
                        Remarks,

                        Signature,
                        ATS
                    )
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [
                            record.stnID,
                            record.MorS,
                            record.sDate,
                            record.sHour,

                            record.SurfaceWind,
                            record.PresVV,
                            record.PresWx,

                            record.Cloud1,
                            record.Cloud2,
                            record.Cloud3,
                            record.Cloud4,

                            record.Tem,
                            record.Dew,
                            record.AltPres,

                            record.Supplemental,
                            record.Remarks,

                            record.Signature,
                            record.ATS
                        ]
                    );
                }
            });

            setAlertTitle("Success");
            setAlertMessage("Aerodrome observation saved successfully.");
            handleOpenDialog();

            return true;

        } catch (err) {
            console.error("Save failed:", err);

            setAlertTitle("Save Error");
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

    const params = useLocalSearchParams<{
        MorS: "METAR" | "SPECI";
        stationId: string;
        stationICAO: string;
        stationName: string;
        date: string;
        time: string;
    }>();

    const DAY = params.date?.split("-")[2] ?? "";
    const HOUR = params.time ?? "";
    const STATION = params.stationICAO ?? "";
    const MorS = params.MorS ?? "METAR";

    const [formData, setFormData] = useState({
        sDate: DAY,
        sHour: HOUR,
        SurfaceWind: "",
        wDir: "",
        vDir: "",
        wSpd: "",
        gust: "",
        PresVV: "",
        VV: "",
        presW: "",
        PresWx: "",
        Tem: "",
        Dew: "",
        Cloud1: "",
        cAmt1: "",
        cHeight1: "",
        Cloud2: "",
        cAmt2: "",
        cHeight2: "",
        Cloud3: "",
        cAmt3: "",
        cHeight3: "",
        Cloud4: "",
        cAmt4: "",
        cHeight4: "",
        altP: "",
        AltPres: "",
        pastW: "",
        Supplemental: "",
        remarks: "",
        Signature: "",
        ATS: "",
    });

    useEffect(() => {
        const loadSynop = async () => {
            if (MorS !== "METAR") return;

            try {
                const db = await getDB();

                const synop = await getLSynopData(
                    db,
                    Number(params.stationId),
                    params.time,
                    params.date
                );


                if (!synop) return;

                console.log("VV:", synop[0]?.VV);
                console.log("Synop:", synop);
                console.log(synop[0]?.VV != null
                    ? synop[0].VV >= 10
                        ? "9999"
                        : `${Number(synop[0].VV)}000`
                    : "")
                setFormData((prev) => ({
                    ...prev,
                    wDir: synop[0]?.wDir?.toString() ?? "",
                    wSpd: synop[0]?.wSpd != null
                        ? (synop[0].wSpd * 2).toString().padStart(2, "0")
                        : "",
                    VV: synop[0]?.VV?.toString() ?? "",
                    PresVV: synop[0]?.VV != null
                        ? synop[0].VV >= 10
                            ? "9999"
                            : `${Number(synop[0].VV)}000`
                        : "",
                    presW: synop[0]?.presW?.toString().padStart(2, "0") ?? "",

                    cAmt1: synop[0]?.amtFirstLayer?.toString() ?? "",
                    cHeight1: synop[0]?.heightFirstLayer != null
                        ? Math.floor(synop[0].heightFirstLayer / 10).toString()
                        : "",

                    cAmt2: synop[0]?.amtSecondLayer?.toString() ?? "",
                    cHeight2: synop[0]?.heightSecondLayer != null
                        ? Math.floor(synop[0].heightSecondLayer / 10).toString()
                        : "",

                    cAmt3: synop[0]?.amtThirdLayer?.toString() ?? "",
                    cHeight3: synop[0]?.heightThirdLayer != null
                        ? Math.floor(synop[0].heightThirdLayer / 10).toString()
                        : "",

                    cAmt4: synop[0]?.amtFourthLayer?.toString() ?? "",
                    cHeight4: synop[0]?.heightFourthLayer != null
                        ? Math.floor(synop[0].heightFourthLayer / 10).toString()
                        : "",

                    Tem: synop[0]?.dBulb != null ? Math.round(synop[0].dBulb).toString() : "",
                    Dew: synop[0]?.dPoiint != null ? Math.round(synop[0].dPoiint).toString() : "",
                    altP: synop[0]?.altP != null
                        ? Math.floor(synop[0].altP).toString()
                        : "",
                    pastW: `${synop[0]?.pastW1 ?? ""}${synop[0]?.pastW2 ?? ""}`,
                    Signature: synop[0]?.obsINT ?? "",
                }));
            } catch (err) {
                console.warn("Failed to load SYNOP data:", err);
            }
        };

        loadSynop();
    }, [MorS, params.stationId, params.date, params.time]);

    useEffect(() => {
        const { wDir, vDir, wSpd, gust } = formData;

        if (!wDir || !wSpd) return;

        let windGroup = `${wDir}`;

        // Add variable direction group
        if (vDir) {
            windGroup += `V${vDir}`;
        }

        windGroup += `${(wSpd).toString().padStart(2, "0")}`

        // Add gust group
        if (gust && ((Number(gust) / 2) - (Number(wSpd) / 2) > 5) && Number(gust) > 10) {
            const gustVal = gust.padStart(2, "0");
            windGroup += `G${gustVal}`;
        }

        setFormData((prev) => ({
            ...prev,
            SurfaceWind: `${windGroup}KT`
        }));

    }, [formData.wDir, formData.vDir, formData.wSpd, formData.gust]);

    useEffect(() => {
        const presWxMap = {
            "15": "VCSH",
            "16": "VCSH",
            "17": "TS",
            "50": "-DZ",
            "51": "-DZ",
            "52": "DZ",
            "53": "DZ",
            "54": "+DZ",
            "55": "+DZ",
            "60": "-RA",
            "61": "-RA",
            "62": "RA",
            "63": "RA",
            "64": "+RA",
            "65": "+RA",
            "80": "-SHRA",
            "81": "SHRA",
            "82": "+SHRA",
            "91": "-RA",
            "92": "RA",
            "+92": "+RA",
            "-95": "-TSSHRA",
            "95": "TSSHRA",
            "97": "+TSSHRA"
        };

        setFormData((prev) => ({
            ...prev,
            PresWx: presWxMap[formData.presW] ?? ""
        }));
    }, [formData.presW]);

    useEffect(() => {
        const pastW = String(formData.pastW ?? "");
        const digits = pastW.split("");

        const hasDZ = digits.includes("5");
        const hasRA = digits.includes("6");
        const hasSHRA = digits.includes("8");
        const hasTS = digits.includes("9");

        let code = "";

        if (hasTS && hasSHRA) code = "TSSHRA";
        else if (hasTS && hasRA) code = "TSRA";
        else if (hasTS) code = "TS";
        else if (hasSHRA) code = "SHRA";
        else if (hasRA) code = "RA";
        else if (hasDZ) code = "DZ";

        setFormData((prev) => ({
            ...prev,
            Supplemental: code ? `RE${code}` : ""
        }));
    }, [formData.pastW]);

    useEffect(() => {
        const mapAmount = (amt) => {
            const n = Number(amt);

            if (n >= 1 && n <= 2) return "FEW";
            if (n >= 3 && n <= 4) return "SCT";
            if (n >= 5 && n <= 7) return "BKN";
            if (n === 8) return "OVC";
            return "";
        };

        setFormData((prev) => {
            const updated = { ...prev };

            let maxCoverage = 0;
            let chainBroken = false;

            [1, 2, 3, 4].forEach((i) => {
                const amt = Number(prev[`cAmt${i}`]);
                const height = prev[`cHeight${i}`];

                if (!amt || !height || chainBroken) {
                    updated[`Cloud${i}`] = "";
                    chainBroken = true;
                    return;
                }

                // coverage order check
                if (amt < maxCoverage) {
                    updated[`Cloud${i}`] = "";
                    chainBroken = true;
                    return;
                }

                const type = mapAmount(amt);
                const h = Math.floor(Number(height) / 3).toString().padStart(3, "0");

                updated[`Cloud${i}`] = `${type}${h}`;

                maxCoverage = amt;
            });

            return updated;
        });

    }, [
        formData.cAmt1, formData.cAmt2, formData.cAmt3, formData.cAmt4,
        formData.cHeight1, formData.cHeight2, formData.cHeight3, formData.cHeight4
    ]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            PresVV: Number(prev.VV) >= 10 ? "9999" : `${Number(prev.VV) ?? ""}000`
        }));
    }, [formData.VV]);

    useEffect(() => {
        if (formData.altP?.length === 4) {
            setFormData((prev) => ({
                ...prev,
                AltPres: `Q${formData.altP}`
            }));
        }
    }, [formData.altP]);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={{ top: 'off', bottom: "additive" }}>
            <Box className="px-4 py-2">
                <Box className="p-4 bg-blue-400 rounded-2xl flex-row justify-between items-center">
                    <Heading size="xl" italic className="text-white">{MorS}</Heading>
                    <Button
                        action="positive"
                        onPress={onSave}
                        disabled={isSaveBtnLoading}
                        className={`rounded-xl ${isSaveBtnLoading ? "bg-blue-200" : "bg-white"}`}
                    >
                        <ButtonText
                            className={`${isSaveBtnLoading ? "text-blue-300" : "text-blue-400"
                                }`}
                        >
                            {isSaveBtnLoading ? "Saving..." : "Save"}
                        </ButtonText>

                        {!isSaveBtnLoading && (
                            <ButtonIcon
                                className="text-blue-400"
                                as={Goal}
                            />
                        )}
                    </Button>
                </Box>
            </Box>
            <KeyboardAwareScrollView className="flex-1 rounded-xl" automaticallyAdjustKeyboardInsets bottomOffset={10} showsVerticalScrollIndicator={false}>
                <Box className="flex-1 p-4">
                    {/* Identification Groups */}
                    <Box className="mb-4">
                        <Heading size="lg" className="mb-2">
                            Identification Groups
                        </Heading>
                        <Box className="flex-row gap-2 p-2">
                            <Box className="flex-1 gap-2">
                                <Text size="sm" bold>METAR or SPECI</Text>
                                <Box className="border border-gray-200 rounded p-3"><Text bold>{MorS}</Text></Box>
                            </Box>
                            <Box className="flex-1 gap-2">
                                <Text size="sm" bold>ICAO</Text>
                                <Box className="border border-gray-200 rounded p-3"><Text bold>{STATION}</Text></Box>
                            </Box>
                            <Box className="flex-1 gap-2">
                                <Text size="sm" bold>Date & Time</Text>
                                <Box className="border border-gray-200 rounded p-3"><Text bold>{DAY}{HOUR}Z</Text></Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Surface Wind */}
                    <Box className="mb-4">
                        <Heading size="md" className="mb-2">
                            Surface Wind (KT)
                        </Heading>
                        <Box className="flex-1 flex-row gap-2 p-2">
                            {/* Direction */}
                            <FormControl className="flex-1">
                                <FormControlLabel>
                                    <FormControlLabelText>Wind Direction</FormControlLabelText>
                                </FormControlLabel>
                                <Input variant="outline" size="md" className="flex-1">
                                    <InputField
                                        placeholder="ddd"
                                        value={formData.wDir}
                                        maxLength={3}
                                        keyboardType="numeric"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, wDir: text }))
                                        }
                                    />
                                    <Box className="h-full items-center justify-center min-w-12  border-l border-neutral-200 bg-neutral-50"><Text>°</Text></Box>
                                </Input>
                            </FormControl>
                            <FormControl className="flex-1">
                                <FormControlLabel>
                                    <FormControlLabelText>Variable Direction</FormControlLabelText>
                                </FormControlLabel>
                                <Input variant="outline" size="md" className="flex-1">
                                    <InputField
                                        placeholder="dxdxdx"
                                        value={formData.vDir}
                                        maxLength={3}
                                        keyboardType="numeric"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, vDir: text }))
                                        }
                                    />
                                    <Box className="h-full items-center justify-center min-w-12  border-l border-neutral-200 bg-neutral-50"><Text>°</Text></Box>
                                </Input>
                            </FormControl>
                        </Box>
                        <Box className="flex-1 flex-row p-2 gap-2">
                            {/* Speed */}
                            <FormControl className="flex-1">
                                <FormControlLabel>
                                    <FormControlLabelText>Wind Speed</FormControlLabelText>
                                </FormControlLabel>
                                <Input variant="outline" size="md" className="flex-1">
                                    <InputField
                                        placeholder="ff"
                                        value={formData.wSpd}
                                        maxLength={2}
                                        keyboardType="numeric"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, wSpd: text }))
                                        }
                                    />
                                    <Box className="h-full items-center justify-center min-w-12  border-l border-neutral-200 bg-neutral-50">
                                        <Text>KT</Text>
                                    </Box>
                                </Input>
                            </FormControl>

                            {/* Gust */}
                            <FormControl className="flex-1">
                                <FormControlLabel>
                                    <FormControlLabelText>Wind Gust</FormControlLabelText>
                                </FormControlLabel>
                                <Input variant="outline" size="md" className="flex-1">
                                    <InputField
                                        placeholder="fmfm"
                                        value={formData.gust}
                                        maxLength={2}
                                        keyboardType="numeric"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, gust: text }))
                                        }
                                    />
                                    <Box className="h-full items-center justify-center min-w-12  border-l border-neutral-200 bg-neutral-50">
                                        <Text>KT</Text>
                                    </Box>
                                </Input>
                            </FormControl>
                        </Box>

                        <Box className="p-2 gap-2">
                            <Box className="border border-gray-200 rounded p-3"><Text bold className="text-center">{formData.SurfaceWind}</Text></Box>
                            <Text size="xs" italic className="text-center">Surface Wind Coding</Text>
                        </Box>
                    </Box>

                    <Box className="flex-1 flex-row gap-4">
                        {/* Previous Visibility */}
                        <Box className="flex-1 mb-4">
                            <Heading size="md" className="mb-2">Previous Visibility</Heading>
                            <FormControl className="px-2 gap-4">
                                <Input variant="outline" size="md">
                                    <InputField
                                        placeholder="VVVV"
                                        value={formData.VV}
                                        keyboardType="numeric"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, VV: text }))
                                        }
                                    />
                                    <Box className="h-full items-center justify-center min-w-12 border-l border-neutral-200 bg-neutral-50">
                                        <Text>KM</Text>
                                    </Box>
                                </Input>
                                <Box className="gap-2">
                                    <Box className="border border-gray-200 rounded p-3">
                                        <Text bold className="text-center">
                                            {formData.PresVV}
                                        </Text>
                                    </Box>
                                    <Text size="xs" italic className="text-center">Prev VSBY Coding</Text>
                                </Box>
                            </FormControl>
                        </Box>

                        {/* Present Weather */}
                        <Box className="flex-1 mb-4">
                            <Heading size="md" className="mb-2">Present Weather</Heading>

                            <FormControl className="px-2 gap-4">
                                {/* Raw Present Weather Input */}
                                <Input variant="outline" size="md">
                                    <InputField
                                        placeholder="w'w'"
                                        value={formData.presW}
                                        keyboardType="numeric"
                                        maxLength={8}
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, presW: text }))
                                        }
                                    />
                                </Input>

                                {/* Editable Present Weather Coding */}
                                <Input variant="outline" size="md">
                                    <InputField
                                        placeholder={`Encoded Weather\u000A(Pres WX)`}
                                        value={formData.PresWx}
                                        maxLength={10}
                                        className="text-center font-bold"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, PresWx: text }))
                                        }
                                    />
                                </Input>

                                <Text size="xs" italic className="text-center">
                                    Pres WX Coding
                                </Text>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Cloud Layers */}
                    <Box className="mb-4">
                        <Heading size="md" className="mb-2">Cloud</Heading>

                        {/* Header */}
                        <Box className="flex-row mb-1 gap-2 px-2">
                            <Text className="w-12" size="xs" italic></Text>
                            <Text className="flex-1" size="sm" bold>Amount</Text>
                            <Text className="flex-1" size="sm" bold>Height</Text>
                            <Text className="flex-1 text-right"></Text>
                        </Box>

                        <Box className="gap-2 px-2 pb-2">
                            {["1st", "2nd", "3rd", "4th"].map((ordinal, i) => {
                                const n = i + 1;

                                return (
                                    <FormControl className="flex-row items-center gap-2" key={n}>

                                        {/* Layer label */}
                                        <Box className="w-12">
                                            <Text size="xs" italic>{ordinal} Layer</Text>
                                        </Box>

                                        {/* Amount */}
                                        <Input variant="outline" size="md" className="flex-1">
                                            <InputField
                                                placeholder="Amt"
                                                value={formData[`cAmt${n}`]}
                                                keyboardType="numeric"
                                                onChangeText={(text) =>
                                                    setFormData((prev) => ({ ...prev, [`cAmt${n}`]: text }))
                                                }
                                                maxLength={1}
                                                className="text-center"
                                            />
                                        </Input>

                                        {/* Height */}
                                        <Input variant="outline" size="md" className="flex-1">
                                            <InputField
                                                placeholder="Height"
                                                value={formData[`cHeight${n}`]}
                                                keyboardType="numeric"
                                                onChangeText={(text) =>
                                                    setFormData((prev) => ({ ...prev, [`cHeight${n}`]: text }))
                                                }
                                                className="text-center"
                                            />
                                        </Input>

                                        {/* Coding */}
                                        <Box className="border border-gray-200 rounded px-3 py-2 flex-1">
                                            <Text bold className="text-center">
                                                {formData[`Cloud${n}`]}
                                            </Text>
                                        </Box>

                                    </FormControl>
                                );
                            })}
                        </Box>
                    </Box>

                    {/* Temperature & Dew Point */}
                    <Box className="mb-4 gap-4">
                        <Heading size="md">Temperature & Dew Point</Heading>
                        <Box className="flex-row gap-2">
                            <FormControl className="flex-1">
                                <FormControlLabel>
                                    <FormControlLabelText>Temperature</FormControlLabelText>
                                </FormControlLabel>
                                <Input variant="outline" size="md" className="flex-1">
                                    <InputField
                                        placeholder="T'T'"
                                        value={formData.Tem}
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, Tem: text }))
                                        }
                                    />
                                    <Box className="h-full items-center justify-center min-w-12  border-l border-neutral-200 bg-neutral-50">
                                        <Text>°C</Text>
                                    </Box>
                                </Input>
                            </FormControl>
                            <FormControl className="flex-1">
                                <FormControlLabel>
                                    <FormControlLabelText>Dew Point</FormControlLabelText>
                                </FormControlLabel>
                                <Input variant="outline" size="md" className="flex-1">
                                    <InputField
                                        placeholder="TdTd"
                                        value={formData.Dew}
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, Dew: text }))
                                        }
                                    />
                                    <Box className="h-full items-center justify-center min-w-12  border-l border-neutral-200 bg-neutral-50">
                                        <Text>°C</Text>
                                    </Box>
                                </Input>
                            </FormControl>
                        </Box>
                        <Box className="gap-2">
                            <Box className="border border-gray-200 rounded p-3">
                                <Text bold className="text-center">
                                    {formData.Tem !== "" && formData.Tem != null && formData.Dew !== "" && formData.Dew != null
                                        ? `${Math.round(formData.Tem)}/${Math.round(formData.Dew)}`
                                        : ""}
                                </Text>
                            </Box>
                            <Text size="xs" italic className="text-center">
                                T & D Pt Coding
                            </Text>
                        </Box>
                    </Box>

                    <Box className="gap-4 flex-row">
                        {/* Atmospheric Pressure */}
                        <Box className="mb-4 flex-1">
                            <Heading size="md" className="mb-2">Atmospheric Pressure</Heading>
                            <FormControl className="gap-4">
                                <Input variant="outline" size="md">
                                    <InputField
                                        placeholder="QNH"
                                        value={formData.altP}
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, altP: text }))
                                        }
                                    />
                                    <Box className="h-full items-center justify-center min-w-12 border-l border-neutral-200 bg-neutral-50">
                                        <Text>hPa</Text>
                                    </Box>
                                </Input>
                                <Box className="gap-2">
                                    <Box className="border border-gray-200 rounded p-3">
                                        <Text bold className="text-center">
                                            {formData.AltPres}
                                        </Text>
                                    </Box>
                                    <Text size="xs" italic className="text-center">Atm Pres Coding</Text>
                                </Box>
                            </FormControl>
                        </Box>

                        {/* Supplemental Info */}
                        <Box className="mb-4 flex-1">
                            <Heading size="md" className="mb-2">Supplemental Info</Heading>

                            <FormControl className="gap-4">
                                <Input variant="outline" size="md" className="flex-row items-center">
                                    <InputField
                                        placeholder="w'w'"
                                        value={formData.pastW}
                                        maxLength={2}
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, pastW: text }))
                                        }
                                        className="flex-1 px-2"
                                    />
                                </Input>

                                {/* Editable Weather Coding */}
                                <Input variant="outline" size="md">
                                    <InputField
                                        placeholder={`Encoded Weather\u000A(Sup Info)`}
                                        value={formData.Supplemental}
                                        maxLength={10}
                                        className="text-center font-bold"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, Supplemental: text }))
                                        }
                                    />
                                </Input>

                                <Text size="xs" italic className="text-center">
                                    Sup Info
                                </Text>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Remarks */}
                    <Box className="mb-4">
                        <Heading size="md" className="mb-2">Remarks</Heading>
                        <Textarea className="rounded" size="md">
                            <TextareaInput
                                value={formData.remarks}
                                className="font-bold"
                                onChangeText={(text) =>
                                    setFormData((prev) => ({ ...prev, remarks: text }))
                                }
                            />
                        </Textarea>
                    </Box>

                    {/* Signatures */}
                    <Box className="mb-4">
                        <Heading size="md" className="mb-2">Signatures</Heading>
                        <Box className="flex-row gap-2">
                            <FormControl className="flex-1 gap-2">
                                <Input variant="outline" size="md">
                                    <InputField
                                        placeholder="Observer's Signature"
                                        value={formData.Signature}
                                        maxLength={10}
                                        className="text-center font-bold"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, Signature: text }))
                                        }
                                    />
                                </Input>
                                <Text size="xs" italic className="text-center">
                                    OBS SIG
                                </Text>
                            </FormControl>
                            <FormControl className="flex-1 gap-2">
                                <Input variant="outline" size="md">
                                    <InputField
                                        placeholder="ATS's Signature"
                                        value={formData.ATS}
                                        maxLength={10}
                                        className="text-center font-bold"
                                        onChangeText={(text) =>
                                            setFormData((prev) => ({ ...prev, ATS: text }))
                                        }
                                    />
                                </Input>
                                <Text size="xs" italic className="text-center">
                                    ATS SIG
                                </Text>
                            </FormControl>
                        </Box>
                    </Box>
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
        </SafeAreaView>
    );
}