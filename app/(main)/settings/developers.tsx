import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';

const developers = [
    { name: "Nestor Z. Igna Jr.", role: "Project Lead" },
    { name: "Uzziel Kyle R. Ynciong", role: "Fullstack Developer" },
    { name: "Tristan D. Balce", role: "UI/UX Designer" },
];

const getInitials = (name: string) =>
    name
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

export default function DevelopersScreen() {
    return (
        <Box className="flex-1 bg-white px-5 py-6">

            {/* Header */}
            <VStack className="mb-8">
                <Heading className="text-2xl">Developers</Heading>
                <Text className="text-gray-500">
                    Meet the team behind this application
                </Text>
            </VStack>

            {/* List */}
            <VStack className="gap-6">
                {developers.map((dev, index) => (
                    <Box
                        key={index}
                        className="flex-row items-center justify-between border-b border-gray-100 pb-4"
                    >
                        {/* Left: Avatar + Name */}
                        <Box className="flex-row items-center gap-4">
                            <Box className="size-12 rounded-full bg-blue-100 items-center justify-center">
                                <Text className="text-blue-400 font-semibold">
                                    {getInitials(dev.name)}
                                </Text>
                            </Box>

                            <Box>
                                <Text className="text-base font-semibold text-gray-900">
                                    {dev.name}
                                </Text>
                                <Text className="text-sm text-gray-500">
                                    {dev.role}
                                </Text>
                            </Box>
                        </Box>
                    </Box>
                ))}
            </VStack>
        </Box>
    );
}