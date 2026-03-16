import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

interface PlaceholderScreenProps {
    title?: string; // optional screen title
    message?: string; // optional description
}

export default function PlaceholderScreen({
    title = "Coming Soon",
    message = "This screen is not yet available."
}: PlaceholderScreenProps) {
    return (
        <Box className="flex-1 justify-center items-center p-6 bg-white">
            <Heading size="lg" className="mb-2 text-center text-gray-700">
                {title}
            </Heading>
            <Text className="text-center text-gray-500">
                {message}
            </Text>
        </Box>
    );
}