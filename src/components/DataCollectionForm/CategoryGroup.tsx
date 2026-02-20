import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ElementType, ReactNode } from "react";
import Separator from "../Separator";

interface CategoryGroupProps {
    title: string;
    icon: ElementType;
    children: ReactNode;
}

export default function CategoryGroup({ title, icon, children }: CategoryGroupProps) {
    return (
        <Box className="bg-white border border-gray-200 py-4 shadow-lg rounded-xl space-y-3">
            <Box className="px-4 flex flex-row justify-between">
                <Text className="text-lg font-semibold text-gray-700">{title}</Text>
                <Icon as={icon} size="xl" />
            </Box>
            <Separator />
            <Box className="space-y-3 px-4">
                {children}
            </Box>
        </Box>
    );
};