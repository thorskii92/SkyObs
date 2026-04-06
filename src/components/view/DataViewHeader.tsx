import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { CalendarDaysIcon, ClipboardCheck, ClipboardIcon, Clock2Icon, User } from "lucide-react-native";

export default function DataViewHeader({ observedData, status }) {
    const formattedDate = observedData.sDate
        ? new Date(observedData.sDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "2-digit",
        })
        : "";

    return (
        <Box className=" bg-white px-4 pt-6 pb-4 shadow-lg shadow-slate-400">
            {/* Station Heading */}
            <Heading size="lg" className="mb-2 text-center">
                {observedData.stnName}
            </Heading>

            {/* Date, Hour, and Observer Initial */}
            <Box className="gap-2 flex-row items-center justify-center flex-wrap">
                <Badge size="lg" action="muted" className="gap-1">
                    <BadgeIcon as={CalendarDaysIcon} />
                    <BadgeText>{formattedDate}</BadgeText>
                </Badge>
                <Badge size="lg" action="muted" className="gap-1">
                    <BadgeIcon as={Clock2Icon} />
                    <BadgeText>{observedData.sHour}</BadgeText>
                </Badge>
                <Badge size="lg" action="warning" className="gap-1">
                    <BadgeIcon as={User} />
                    <BadgeText>{observedData.obsINT}</BadgeText>
                </Badge>
                <Badge
                    size="lg"
                    action={status === "validated" ? "success" : "info"}
                    className="gap-1"
                >
                    <BadgeIcon as={status === "validated" ? ClipboardCheck : ClipboardIcon} />
                    <BadgeText>
                        {status === "validated" ? "Validated" : "Recorded"}
                    </BadgeText>
                </Badge>
            </Box>
        </Box>
    );
}