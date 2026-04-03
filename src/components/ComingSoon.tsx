import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { AlertTriangle } from "lucide-react-native";

type Props = {
    title: string;
    description?: string;
};

export default function ComingSoon({ title, description }: Props) {
    return (
        <Box className="flex-1 bg-white px-6 pt-8 items-center justify-center">
            <VStack space="md" className="items-center">

                <Icon
                    as={AlertTriangle}
                    size="xl"
                    color="#f59e0b"
                />

                <Heading size="lg" className="text-center">
                    {title}
                </Heading>

                <Text className="text-gray-500 text-center">
                    {description || "This feature is not available yet."}
                </Text>

                <Box className="bg-gray-100 px-4 py-2 rounded-full mt-2">
                    <Text size="xs" className="text-gray-600">
                        🚧 Coming Soon
                    </Text>
                </Box>

            </VStack>
        </Box>
    );
}