import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useEffect, useState } from "react";

import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";

import { Heading } from "@/components/ui/heading";
import { getPsychrometric } from "@/src/utils/api";
import { formatPres, formatRH, formatTemp } from "@/src/utils/formatters";
import { isTendencyValid, validateField } from "@/src/utils/validators";
import { CircleGaugeIcon, CloudRainWindIcon, CloudyIcon, ThermometerIcon, User2Icon, ViewIcon, WindIcon } from "lucide-react-native";
import CategoryGroup from "./CategoryGroup";
import CloudLayerInput from "./CloudLayerInput";
import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import ObservationHeader from "./ObservationHeader";

const TRACE = "0.01";

export default function DataCollectionForm({ dataParams, formData, setField, errors, setError }) {
    const onSave = () => { }
    const onMarkQC = () => { }
    const [isSaveBtnLoading, setIsSaveBtnLoading] = useState<boolean>(false);
    const [showAlertDialog, setShowAlertDialog] = useState<boolean>(false);
    const handleClose = () => setShowAlertDialog(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [isRRTrace, setIsRRTrace] = useState<boolean>(false);

    const [rawNet3hr, setRawNet3hr] = useState<string | undefined>();

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
        if (isRRTrace) {
            setField(["atmosphericPhenomena", "RR"], TRACE);
            setError(["atmosphericPhenomena", "RR"], "");
        };
    }, [isRRTrace])

    const stnPAutoComputeFn = (stnP: string) => {
        const stationPressure = Number(stnP)

        const computedMsl = (stationPressure + Number(dataParams.mslCor ?? 0)).toFixed(1);
        const computedAlt = (stationPressure + Number(dataParams.altCor ?? 0)).toFixed(1);

        setField(["pressure", "mslP"], computedMsl);
        setField(["pressure", "altP"], computedAlt);

        const pBarograph = Number(formData.pressure.pBarograph);

        if (stationPressure && pBarograph) {
            const correction = (stationPressure - pBarograph).toFixed(1);
            setField(["pressure", "pBaroCorrection"], correction);
        }
    }

    const dBulbAutoComputeFn = async (dBulb: string) => {
        const wBulb = formData.temperature.wBulb;

        if (!dBulb || !wBulb) {
            setField(["temperature", "dPoiint"], "");
            setField(["temperature", "RH"], "");
            setField(["temperature", "vaporP"], "");
            return;
        }

        try {
            const pD = await getPsychrometric(dBulb, wBulb);
            if (pD) {
                const { dewPoint, relativeHumidity, vaporPressure } = pD;

                setField(["temperature", "dPoiint"], dewPoint ?? "");
                setField(["temperature", "RH"], relativeHumidity ?? "");
                setField(["temperature", "vaporP"], vaporPressure ?? "");
            }
        } catch (err) {
            console.error("dBulb auto-compute error:", err);
        }
    };

    const wBulbAutoComputeFn = async (wBulb: string) => {
        const dBulb = formData.temperature.dBulb;

        if (!dBulb || !wBulb) {
            setField(["temperature", "dPoiint"], "");
            setField(["temperature", "RH"], "");
            setField(["temperature", "vaporP"], "");
            return;
        }

        try {
            const pD = await getPsychrometric(dBulb, wBulb);
            if (pD) {
                const { dewPoint, relativeHumidity, vaporPressure } = pD;

                setField(["temperature", "dPoiint"], dewPoint ?? "");
                setField(["temperature", "RH"], relativeHumidity ?? "");
                setField(["temperature", "vaporP"], vaporPressure ?? "");
            }
        } catch (err) {
            console.error("wBulb auto-compute error:", err);
        }
    };



    return (
        <Box className="flex">
            {/* Observational Parameters */}
            <ObservationHeader stationName={dataParams.stationName} date={dataParams.date} time={dataParams.time} status={dataParams.status} onSave={onSave} onMarkQC={onMarkQC} />

            {/* Grouped Inputs */}
            <Box className="bg-white p-4 flex gap-4">
                <CategoryGroup title="Visibility" icon={ViewIcon}>
                    <FormInput label="HT of Lowest Level" value={formData.visibility.heightLL} maxLength={1} setterFn={(v: string) => setField(["visibility", "heightLL"], v)} error={errors.visibility.heightLL} setErrFn={(m: string) => setError(["visibility", "heightLL"], m)} validateFn={(v: string) => { return validateField(v, "HT of Lowest Level", { required: true, numeric: false }) }} />
                    <FormInput label="Visibility" value={formData.visibility.VV} maxLength={2} setterFn={(v: string) => setField(["visibility", "VV"], v)} error={errors.visibility.VV} setErrFn={(m: string) => setError(["visibility", "VV"], m)} validateFn={(v: string) => { return validateField(v, "Visibility", { required: true, numeric: false }) }} />
                    <FormInput label="Summation Total" value={formData.visibility.SummTotal} maxLength={1} setterFn={(v: string) => setField(["visibility", "SummTotal"], v)} error={errors.visibility.SummTotal} setErrFn={(m: string) => setError(["visibility", "SummTotal"], m)} validateFn={(v: string) => { return validateField(v, "Summation Total", { required: true, numeric: false }) }} />
                </CategoryGroup>

                <CategoryGroup title="Wind" icon={WindIcon}>
                    <FormInput label="Direction(Degrees)" value={formData.wind.wDir} maxLength={3} setterFn={(v: string) => setField(["wind", "wDir"], v)} error={errors.wind.wDir} setErrFn={(m: string) => setError(["wind", "wDir"], m)} validateFn={(v: string) => { return validateField(v, "Wind Direction", { required: true, numeric: false }) }} />
                    <FormInput label="Speed(MPS)" value={formData.wind.wSpd} maxLength={3} setterFn={(v: string) => setField(["wind", "wSpd"], v)} error={errors.wind.wSpd} setErrFn={(m: string) => setError(["wind", "wSpd"], m)} validateFn={(v: string) => { return validateField(v, "Wind Speed", { required: true, numeric: false }) }} />
                </CategoryGroup>

                <CategoryGroup title="Temperature" icon={ThermometerIcon}>
                    <FormInput label="Dry Bulb (°C)" value={formData.temperature.dBulb} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "dBulb"], v)} error={errors.temperature.dBulb} setErrFn={(m: string) => setError(["temperature", "dBulb"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Dry Bulb", { required: true, numeric: false }) }} autoComputeFn={dBulbAutoComputeFn} />
                    <FormInput label="Wet Bulb (°C)" value={formData.temperature.wBulb} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "wBulb"], v)} error={errors.temperature.wBulb} setErrFn={(m: string) => setError(["temperature", "wBulb"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Wet Bulb", { required: true, numeric: false }) }} autoComputeFn={wBulbAutoComputeFn} />
                    <FormInput label="Dew Point (°C)" value={formData.temperature.dPoiint} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "dPoiint"], v)} error={errors.temperature.dPoiint} setErrFn={(m: string) => setError(["temperature", "dPoiint"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Dew Point", { required: true, numeric: false }) }} />
                    <FormInput label="Relative Humidity" value={formData.temperature.RH} maxLength={4} maxTypableChars={2} setterFn={(v: string) => setField(["temperature", "RH"], v)} error={errors.temperature.RH} setErrFn={(m: string) => setError(["temperature", "RH"], m)} formatFn={formatRH} validateFn={(v: string) => { return validateField(v, "Relative Humidity", { required: true, numeric: false }) }} />
                    <FormInput label="Vapor Pressure" value={formData.temperature.vaporP} maxLength={4} setterFn={(v: string) => setField(["temperature", "vaporP"], v)} error={errors.temperature.vaporP} setErrFn={(m: string) => setError(["temperature", "vaporP"], m)} validateFn={(v: string) => { return validateField(v, "Vapor Pressure", { required: true, numeric: false }) }} />
                    <FormInput label="Max. Temperature" value={formData.temperature.maxTemp} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "maxTemp"], v)} error={errors.temperature.maxTemp} setErrFn={(m: string) => setError(["temperature", "maxTemp"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Max. Temperature", { required: true, numeric: false }) }} />
                    <FormInput label="Min. Temperature" value={formData.temperature.minTemp} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["temperature", "minTemp"], v)} error={errors.temperature.minTemp} setErrFn={(m: string) => setError(["temperature", "minTemp"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Min. Temperature", { required: true, numeric: false }) }} />
                </CategoryGroup>

                <CategoryGroup title="Atmospheric Pressure" icon={CircleGaugeIcon}>
                    <FormInput label="Station Pressure" value={formData.pressure.stnP} maxLength={6} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "stnP"], v)} error={errors.pressure.stnP} setErrFn={(m: string) => setError(["pressure", "stnP"], m)} formatFn={formatPres} validateFn={(v: string) => { return validateField(v, "Station Pressure", { required: true, numeric: false }) }} autoComputeFn={stnPAutoComputeFn} />
                    <FormInput label="MSL Pressure" value={formData.pressure.mslP} maxLength={6} readonly setterFn={(v: string) => setField(["pressure", "mslP"], v)} error={errors.pressure.mslP} setErrFn={(m: string) => setError(["pressure", "mslP"], m)} validateFn={(v: string) => { return validateField(v, "MSL Pressure", { required: true, numeric: false }) }} />
                    <FormInput label="Tendency" value={formData.pressure.tendency} maxLength={1} setterFn={(v: string) => setField(["pressure", "tendency"], v)} error={errors.pressure.tendency} setErrFn={(m: string) => setError(["pressure", "tendency"], m)} validateFn={(v: string) => { return isTendencyValid(v, rawNet3hr) }} />
                    <FormInput label="NET 3-hr Change" value={formData.pressure.net3hr} maxLength={4} readonly setterFn={(v: string) => setField(["pressure", "net3hr"], v)} error={errors.pressure.net3hr} setErrFn={(m: string) => setError(["pressure", "net3hr"], m)} validateFn={(v: string) => { return validateField(v, "NET 3-hr Change", { numeric: false }) }} />
                    <FormInput label="24-hr Pressure Change" value={formData.pressure.pres24} maxLength={4} readonly setterFn={(v: string) => setField(["pressure", "pres24"], v)} error={errors.pressure.pres24} setErrFn={(m: string) => setError(["pressure", "pres24"], m)} validateFn={(v: string) => { return validateField(v, "24-hr Pressure Change", { numeric: false }) }} />
                    <FormInput label="Altimeter Setting" value={formData.pressure.altP} maxLength={6} maxTypableChars={3} readonly setterFn={(v: string) => setField(["pressure", "altP"], v)} error={errors.pressure.altP} setErrFn={(m: string) => setError(["pressure", "altP"], m)} validateFn={(v: string) => { return validateField(v, "Altimeter Setting", { numeric: false }) }} />
                    <FormInput label="Attached Thermometer" value={formData.pressure.pAttachTherm} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "pAttachTherm"], v)} error={errors.pressure.pAttachTherm} setErrFn={(m: string) => setError(["pressure", "pAttachTherm"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Attached Thermometer", { numeric: false }) }} />
                    <FormInput label="Barometer" value={formData.pressure.pObsBaro} maxLength={6} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "pObsBaro"], v)} error={errors.pressure.pObsBaro} setErrFn={(m: string) => setError(["pressure", "pObsBaro"], m)} formatFn={formatPres} validateFn={(v: string) => { return validateField(v, "Observed Barometer", { numeric: false }) }} />
                    <FormInput label="Barometer Correction" value={formData.pressure.pCorrection} maxLength={4} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "pCorrection"], v)} error={errors.pressure.pCorrection} setErrFn={(m: string) => setError(["pressure", "pCorrection"], m)} formatFn={formatTemp} validateFn={(v: string) => { return validateField(v, "Barometer Correction", { numeric: false }) }} />
                    <FormInput label="Barograph" value={formData.pressure.pBarograph} maxLength={6} maxTypableChars={3} setterFn={(v: string) => setField(["pressure", "pBarograph"], v)} error={errors.pressure.pBarograph} setErrFn={(m: string) => setError(["pressure", "pBarograph"], m)} formatFn={formatPres} validateFn={(v: string) => { return validateField(v, "Barograph", { numeric: false }) }} />
                    <FormInput label="Barograph Correction" value={formData.pressure.pBaroCorrection} maxLength={5} readonly setterFn={(v: string) => setField(["pressure", "pBaroCorrection"], v)} error={errors.pressure.pBaroCorrection} setErrFn={(m: string) => setError(["pressure", "pBaroCorrection"], m)} validateFn={(v: string) => { return validateField(v, "Barograph Correction", { numeric: false }) }} />
                </CategoryGroup>

                <CategoryGroup title="Atmospheric Phenomena" icon={CloudRainWindIcon}>
                    <FormInput label="Rainfall Amount(mm)" value={formData.atmosphericPhenomena.RR} maxLength={4} setterFn={(v: string) => setField(["atmosphericPhenomena", "RR"], v)} error={errors.atmosphericPhenomena.RR} setErrFn={(m: string) => setError(["atmosphericPhenomena", "RR"], m)} showCheckbox={true} checked={isRRTrace} checkboxVal={TRACE} onCheckChange={setIsRRTrace} validateFn={(v: string) => { return validateField(v, "Rainfall Amount", { required: true, numeric: false }) }} />
                    <FormInput label="Observed Period" value={formData.atmosphericPhenomena.tR} maxLength={1} setterFn={(v: string) => setField(["atmosphericPhenomena", "tR"], v)} error={errors.atmosphericPhenomena.tR} setErrFn={(m: string) => setError(["atmosphericPhenomena", "tR"], m)} validateFn={(v: string) => { return validateField(v, "Observed Period", { required: true, numeric: false }) }} />
                    <FormInput label="Present Weather" value={formData.atmosphericPhenomena.presW} maxLength={2} setterFn={(v: string) => setField(["atmosphericPhenomena", "presW"], v)} error={errors.atmosphericPhenomena.presW} setErrFn={(m: string) => setError(["atmosphericPhenomena", "presW"], m)} validateFn={(v: string) => { return validateField(v, "Present Weather", { required: true, numeric: false }) }} />
                    <FormInput label="Past Weather" value={formData.atmosphericPhenomena.pastW} setterFn={(v: string) => setField(["atmosphericPhenomena", "pastW"], v)} error={errors.atmosphericPhenomena.pastW} setErrFn={(m: string) => setError(["atmosphericPhenomena", "pastW"], m)} validateFn={(v: string) => { return validateField(v, "Past Weather", { required: true, numeric: false }) }} />
                </CategoryGroup>

                <CategoryGroup title="Clouds" icon={CloudyIcon}>
                    <FormInput label="Amounts of Low Clouds" value={formData.clouds.amtLC} maxLength={1} setterFn={(v: string) => setField(["clouds", "amtLC"], v)} error={errors.clouds.amtLC} setErrFn={(m: string) => setError(["clouds", "amtLC"], m)} validateFn={(v: string) => { return validateField(v, "Amounts of Low Clouds", { required: true, numeric: false }) }} />
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
                    />
                    <FormInput label="Ceiling" value={formData.clouds.ceiling} maxLength={3} setterFn={(v: string) => setField(["clouds", "ceiling"], v)} error={errors.clouds.ceiling} setErrFn={(m: string) => setError(["clouds", "ceiling"], m)} validateFn={(v: string) => { return validateField(v, "Ceiling", { required: true, numeric: false }) }} isAlphanumeric />
                </CategoryGroup>

                <CategoryGroup title="Observer" icon={User2Icon}>
                    <FormTextarea label="Remarks" value={formData.observer.remark} maxLength={255} setterFn={(v: string) => setField(["observer", "remark"], v)} error={errors.observer.remark} setErrFn={(m: string) => setError(["observer", "remark"], m)} />
                    <FormInput label="Observer's Signature" value={formData.observer.obsINT} setterFn={(v: string) => setField(["observer", "obsINT"], v)} error={errors.observer.obsINT} setErrFn={(m: string) => setError(["observer", "obsINT"], m)} isAlphanumeric={true} validateFn={(v: string) => { return validateField(v, "Observer's Signature", { required: true }) }} />
                </CategoryGroup>
            </Box>

            {/* Dynamic Alert Dialog (New & Quality Controlled) */}
            <AlertDialog isOpen={showAlertDialog}>
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading>Temporarily Save Synoptic Data</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text>The data will be temporarily saved for quality control.</Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={handleClose}
                            size="sm">
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button
                            action="positive"
                            isDisabled={isSaveBtnLoading}
                            onPress={onSave}
                            size="sm">
                            <ButtonText>Confirm</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
}