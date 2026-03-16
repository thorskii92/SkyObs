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
        <Box className="bg-white border border-gray-200 py-4 shadow-lg rounded-xl">
            <Box className="px-4 pb-2 flex flex-row gap-2 items-center">
                <Box className="p-2 bg-gray-100 rounded-xl">
                    <Icon as={icon} size="md" />
                </Box>
                <Text className="text-lg font-semibold text-gray-700">{title}</Text>
            </Box>
            <Separator />
            <Box className="space-y-3 px-4">
                {children}
            </Box>
        </Box>
    );
};