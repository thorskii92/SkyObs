import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import React from "react";

const GlobalLoading = () => {
    return (
        <Box className="flex-1 bg-white justify-center items-center">
            {/* Spinner only */}
            <Spinner size="large" className="text-blue-400" />
        </Box>
    );
};

export default GlobalLoading;