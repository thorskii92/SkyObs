import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import {
    Select,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicator,
    SelectDragIndicatorWrapper,
    SelectIcon,
    SelectInput,
    SelectItem,
    SelectPortal,
    SelectScrollView,
    SelectTrigger,
    SelectVirtualizedList
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from "@/components/ui/vstack";
import {
    ChevronDownIcon,
    ClockIcon,
    EditIcon,
    FileText,
    PlusIcon,
    TrashIcon,
    XIcon
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUser } from "@/src/context/UserContext";
import { deleteCodeTemplate as deleteCodeTemplateAPI, saveCodeParameter, saveCodeTemplate } from "@/src/utils/api";
import { createCodeParameter, createCodeTemplate, deleteCodeTemplate, getAllCodeTemplates, getDB, getLCategories, getLCodeParams, getLStations, updateCodeTemplate } from "@/src/utils/db";

interface CodeTemplate {
    codeID: number;
    stnID: number;
    cID: number;
    hour?: string;
    uID?: number;
    Template: string;
    tType: 'General' | 'Specific';
    dateadded: string;
    dateupdated: string;
    cName?: string;
    stnName?: string;
}

interface CodeParameter {
    par: string;
    var: string;
    varname: string;
}

export default function CodeTemplatesScreen() {
    const toast = useToast();
    const { user } = useUser();

    // Data states
    const [templates, setTemplates] = useState<CodeTemplate[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [codeParams, setCodeParams] = useState<CodeParameter[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isCreateMode, setIsCreateMode] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<CodeTemplate | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleteTemplate, setDeleteTemplate] = useState<CodeTemplate | null>(null);

    // Form fields
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [templateType, setTemplateType] = useState<'General' | 'Specific'>('General');
    const [selectedHour, setSelectedHour] = useState<string>('');
    const [templateText, setTemplateText] = useState<string>('');
    const [selectedStation, setSelectedStation] = useState<any>(null);

    // Form select values
    const [selectedStationValue, setSelectedStationValue] = useState<string>('');
    const [selectedCategoryValue, setSelectedCategoryValue] = useState<string>('');
    const [selectedHourValue, setSelectedHourValue] = useState<string>('');

    // Code Parameter form states
    const [showCodeParamForm, setShowCodeParamForm] = useState(false);
    const [codeParamPar, setCodeParamPar] = useState<string>('');
    const [codeParamVar, setCodeParamVar] = useState<string>('');
    const [codeParamvarname, setCodeParamvarname] = useState<string>('');

    // Template builder
    // const [templateParts, setTemplateParts] = useState<string[]>([]);

    const loadData = useCallback(async () => {
        try {
            const db = await getDB();

            // Load templates
            const allTemplates = await getAllCodeTemplates(db);
            setTemplates(allTemplates);

            // Load categories
            const cats = await getLCategories(db);
            setCategories(cats);

            // Load stations
            const stns = await getLStations(db);
            setStations(stns);

            // Code parameters will be loaded by useEffect when category is selected

        } catch (error) {
            console.error("Error loading data:", error);
            toast.show({
                placement: "top",
                render: () => (
                    <Toast>
                        <ToastTitle>Error</ToastTitle>
                        <ToastDescription>Failed to load data</ToastDescription>
                    </Toast>
                ),
            });
        } finally {
            setLoading(false);
        }
    }, [user?.station_id, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Update code parameters when category changes
    useEffect(() => {
        const loadCodeParams = async () => {
            console.log("Loading code parameters for station:", user?.station_id, "and category:", selectedCategory?.cName);
            if (user?.station_id && selectedCategory) {
                try {
                    console.log("Loading code parameters for station:", user.station_id, "and category:", selectedCategory.cName);
                    const db = await getDB();
                    const params = await getLCodeParams(db, user.station_id.toString(), selectedCategory.cID);
                    setCodeParams(params || []);
                } catch (error) {
                    console.error("Error loading code parameters:", error);
                    setCodeParams([]);
                }
            }
        };

        loadCodeParams();
    }, [selectedCategory, user?.station_id]);

    const resetForm = () => {
        setSelectedCategory(null);
        setTemplateType('General');
        setSelectedHour('');
        setSelectedHourValue('');
        setTemplateText('');
        setSelectedStation(null);
        setSelectedStationValue('');
        setSelectedCategoryValue('');
        setCodeParams([]);
        setIsCreateMode(true);
        setEditingTemplate(null);
    };

    const handleCreate = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEdit = (template: CodeTemplate) => {
        setIsCreateMode(false);
        setEditingTemplate(template);
        const category = categories.find(c => c.cID === template.cID);
        const station = stations.find(s => s.Id === template.stnID);
        setSelectedCategory(category);
        setSelectedCategoryValue(category?.cID.toString() || '');
        setTemplateType(template.tType);
        setSelectedHour(template.hour || '');
        setSelectedHourValue(template.hour || '');
        setTemplateText(template.Template);
        setSelectedStation(station);
        setSelectedStationValue(station?.Id.toString() || '');
        setShowForm(true);
    };

    const handleDelete = (template: CodeTemplate) => {
        setDeleteTemplate(template);
    };

    const confirmDelete = async () => {
        if (!deleteTemplate) return;

        try {
            const db = await getDB();
            await deleteCodeTemplate(db, deleteTemplate.codeID);

            // Delete from API
            const apiResult = await deleteCodeTemplateAPI(deleteTemplate.stnID, deleteTemplate.tType, deleteTemplate.hour);
            if (!apiResult) {
                throw new Error('Failed to delete template from API');
            }

            // Reload templates
            const updatedTemplates = await getAllCodeTemplates(db);
            setTemplates(updatedTemplates);

            toast.show({
                placement: "top",
                render: () => (
                    <Toast>
                        <ToastTitle>Success</ToastTitle>
                        <ToastDescription>Template deleted successfully</ToastDescription>
                    </Toast>
                ),
            });
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.show({
                placement: "top",
                render: () => (
                    <Toast>
                        <ToastTitle>Error</ToastTitle>
                        <ToastDescription>Failed to delete template</ToastDescription>
                    </Toast>
                ),
            });
        } finally {
            setDeleteTemplate(null);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!selectedCategory) {
            Alert.alert("Error", "Please select a category");
            return;
        }

        if (!selectedStation) {
            Alert.alert("Error", "Please select a station");
            return;
        }

        if (!templateText.trim()) {
            Alert.alert("Error", "Please enter template text");
            return;
        }

        if (templateType === 'Specific' && !selectedHour) {
            Alert.alert("Error", "Please select an hour for specific templates");
            return;
        }

        try {
            const db = await getDB();

            const templateData = {
                stnID: selectedStation.Id,
                cID: selectedCategory.cID,
                hour: templateType === 'Specific' ? selectedHour : null,
                uID: user?.user_id,
                Template: templateText.trim(),
                tType: templateType,
            };

            console.log("Saving template with data:", templateData);

            if (isCreateMode) {
                await createCodeTemplate(db, templateData);
            } else if (editingTemplate) {
                await updateCodeTemplate(db, editingTemplate.codeID, {
                    Template: templateText.trim(),
                    tType: templateType,
                    hour: templateType === 'Specific' ? selectedHour : null,
                });
            }

            const apiPayload = {
                stnID: selectedStation.Id,
                cID: selectedCategory.cID,
                hour: templateType === 'Specific' ? selectedHour : null,
                uID: user?.user_id,
                Template: templateText.trim(),
                tType: templateType,
                ...(editingTemplate ? { codeID: editingTemplate.codeID } : {}),
            };

            const apiResult = await saveCodeTemplate(apiPayload);
            if (!apiResult) {
                throw new Error('Failed to save template to API');
            }

            // Reload templates
            const updatedTemplates = await getAllCodeTemplates(db);
            setTemplates(updatedTemplates);

            setShowForm(false);
            resetForm();

            toast.show({
                placement: "top",
                render: () => (
                    <Toast>
                        <ToastTitle>Success</ToastTitle>
                        <ToastDescription>
                            Template {isCreateMode ? 'created' : 'updated'} successfully
                        </ToastDescription>
                    </Toast>
                ),
            });
        } catch (error) {
            console.error("Error saving template:", error);
            toast.show({
                placement: "top",
                render: () => (
                    <Toast>
                        <ToastTitle>Error</ToastTitle>
                        <ToastDescription>Failed to save template</ToastDescription>
                    </Toast>
                ),
            });
        }
    };

    const handleCodeParamSubmit = async () => {
        // Validation
        if (!selectedCategory) {
            Alert.alert("Error", "Please select a category first");
            return;
        }

        if (!codeParamPar.trim()) {
            Alert.alert("Error", "Please enter parameter code");
            return;
        }

        if (!codeParamVar.trim()) {
            Alert.alert("Error", "Please enter variable name");
            return;
        }

        if (!codeParamvarname.trim()) {
            Alert.alert("Error", "Please enter variable display name");
            return;
        }

        try {
            const db = await getDB();

            // Save to local database
            const paramData = {
                stnID: user?.station_id || 1,
                cID: selectedCategory.cID,
                par: codeParamPar.trim(),
                var: codeParamVar.trim(),
                varname: codeParamvarname.trim(),
                uID: user?.id,
            };

            await createCodeParameter(db, paramData);

            // Save to API
            const apiPayload = {
                ...paramData,
                stnId: paramData.stnID,
            };
            await saveCodeParameter(apiPayload);

            // Reload code parameters
            const updatedParams = await getLCodeParams(db, user?.station_id?.toString() || '1', selectedCategory.cID);
            setCodeParams(updatedParams || []);

            // Reset form
            setCodeParamPar('');
            setCodeParamVar('');
            setCodeParamvarname('');
            setShowCodeParamForm(false);

            toast.show({
                placement: "top",
                render: () => (
                    <Toast>
                        <ToastTitle>Success</ToastTitle>
                        <ToastDescription>Code parameter added successfully</ToastDescription>
                    </Toast>
                ),
            });
        } catch (error) {
            console.error("Error saving code parameter:", error);
            toast.show({
                placement: "top",
                render: () => (
                    <Toast>
                        <ToastTitle>Error</ToastTitle>
                        <ToastDescription>Failed to save code parameter</ToastDescription>
                    </Toast>
                ),
            });
        }
    };

    const addCodeParameter = (param: CodeParameter) => {
        setTemplateText(prev => prev + `{${param.var}}`);
    };

    const addTextPart = (text: string) => {
        setTemplateText(prev => prev + text);
    };

    const clearTemplate = () => {
        setTemplateText('');
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <Box className="flex-1 justify-center items-center">
                    <Text>Loading...</Text>
                </Box>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={{ top: 'off', bottom: 'off' }}>
            <KeyboardAwareScrollView
                className="flex-1"
                automaticallyAdjustKeyboardInsets
                bottomOffset={10}
            >
                <Box className="p-4 flex-1">
                    <HStack className="justify-between items-center mb-4">
                        <Heading>Code Templates</Heading>
                        <Button onPress={handleCreate} size="sm">
                            <ButtonText>Add Template</ButtonText>
                            <Icon as={PlusIcon} className="ml-2" />
                        </Button>
                    </HStack>

                    {/* Templates List */}
                    <VStack space="md">
                        {templates.map((template) => (
                            <Box key={template.codeID} className="bg-white p-4 rounded-lg border border-gray-200">
                                <HStack className="justify-between items-start mb-2">
                                    <VStack className="flex-1">
                                        <HStack className="items-center mb-1">
                                            <Badge
                                                variant={template.tType === 'General' ? 'solid' : 'outline'}
                                                className="mr-2"
                                            >
                                                <BadgeText>{template.tType}</BadgeText>
                                            </Badge>
                                            <Text className="text-sm text-gray-600">
                                                {template.stnName} - {template.cName}
                                            </Text>
                                        </HStack>
                                        {template.hour && (
                                            <HStack className="items-center mb-2">
                                                <Icon as={ClockIcon} size="xs" className="mr-1" />
                                                <Text className="text-xs text-gray-500">{template.hour}</Text>
                                            </HStack>
                                        )}
                                    </VStack>
                                    <HStack space="sm">
                                        <Pressable onPress={() => handleEdit(template)}>
                                            <Icon as={EditIcon} size="sm" className="text-blue-500" />
                                        </Pressable>
                                        <Pressable onPress={() => handleDelete(template)}>
                                            <Icon as={TrashIcon} size="sm" className="text-red-500" />
                                        </Pressable>
                                    </HStack>
                                </HStack>
                                <Text className="text-sm bg-gray-50 p-2 rounded font-mono">
                                    {template.Template}
                                </Text>
                                <Text className="text-xs text-gray-400 mt-1">
                                    Updated: {new Date(template.dateupdated).toLocaleDateString()}
                                </Text>
                            </Box>
                        ))}
                    </VStack>

                    {templates.length === 0 && (
                        <Box className="bg-white p-8 rounded-lg border border-gray-200 items-center">
                            <Icon as={FileText} size="xl" className="text-gray-400 mb-2" />
                            <Text className="text-gray-500 text-center">No templates found</Text>
                            <Text className="text-gray-400 text-center text-sm">Create your first code template</Text>
                        </Box>
                    )}
                </Box>

                {/* Delete Confirmation Dialog */}
                <AlertDialog isOpen={!!deleteTemplate} onClose={() => setDeleteTemplate(null)}>
                    <AlertDialogBackdrop />
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <Heading size="md">Delete Template</Heading>
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            <Text>
                                Are you sure you want to delete this template? This action cannot be undone.
                            </Text>
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button variant="outline" onPress={() => setDeleteTemplate(null)}>
                                <ButtonText>Cancel</ButtonText>
                            </Button>
                            <Button variant="solid" action="negative" onPress={confirmDelete}>
                                <ButtonText>Delete</ButtonText>
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </KeyboardAwareScrollView>

            {/* Create/Edit Form Modal */}
            {showForm && (
                <Box className="absolute inset-0 bg-black/50 justify-end">
                    <Pressable
                        className="flex-1"
                        onPress={() => setShowForm(false)}
                    />
                    <Box className="bg-white rounded-t-3xl h-[85%] p-4">
                        <KeyboardAwareScrollView
                            showsVerticalScrollIndicator={false}
                            automaticallyAdjustKeyboardInsets
                            className="flex-1"
                            contentContainerStyle={{ flexGrow: 1 }}
                        >
                            <HStack className="justify-between items-center mb-4">
                                <Heading size="md">
                                    {isCreateMode ? 'Create Template' : 'Edit Template'}
                                </Heading>
                                <Pressable onPress={() => setShowForm(false)}>
                                    <Icon as={XIcon} size="md" />
                                </Pressable>
                            </HStack>

                            {/* Station Selection */}
                            <Box className="mb-4">
                                <Text className="text-sm font-medium mb-2">Station</Text>
                                <Select
                                    value={selectedStationValue}
                                    onValueChange={(value) => {
                                        setSelectedStationValue(value);
                                        const station = stations.find(s => s.Id.toString() === value);
                                        setSelectedStation(station);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectInput
                                            placeholder="Select station"
                                            value={selectedStation ? `${selectedStation.wmoID}${selectedStation.stationID} - ${selectedStation.stnName}` : ''}
                                        />
                                        <SelectIcon as={ChevronDownIcon} />
                                    </SelectTrigger>
                                    <SelectPortal snapPoints={[40]}>
                                        <SelectBackdrop />
                                        <SelectContent>
                                            <SelectDragIndicatorWrapper>
                                                <SelectDragIndicator />
                                            </SelectDragIndicatorWrapper>
                                            <SelectVirtualizedList
                                                data={stations}
                                                getItem={(data, index) => data[index]}
                                                getItemCount={(data) => data.length}
                                                keyExtractor={(item) => (item as any).Id.toString()}
                                                renderItem={({ item }) => (
                                                    <SelectItem
                                                        label={`${(item as any).wmoID}${(item as any).stationID} - ${(item as any).stnName}`}
                                                        value={(item as any).Id.toString()}
                                                    />
                                                )}
                                            />
                                        </SelectContent>
                                    </SelectPortal>
                                </Select>
                            </Box>

                            {/* Category Selection */}
                            <Box className="mb-4">
                                <Text className="text-sm font-medium mb-2">Category</Text>
                                <Select
                                    value={selectedCategoryValue}
                                    onValueChange={(value) => {
                                        setSelectedCategoryValue(value);
                                        const category = categories.find(c => c.cID.toString() === value);
                                        setSelectedCategory(category);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectInput
                                            placeholder="Select category"
                                            value={selectedCategory?.cName}
                                        />
                                        <SelectIcon as={ChevronDownIcon} />
                                    </SelectTrigger>
                                    <SelectPortal snapPoints={[40]}>
                                        <SelectBackdrop />
                                        <SelectContent>
                                            <SelectDragIndicatorWrapper>
                                                <SelectDragIndicator />
                                            </SelectDragIndicatorWrapper>
                                            <SelectScrollView>
                                                {categories.map((category) => (
                                                    <SelectItem
                                                        key={category.cID}
                                                        label={category.cName}
                                                        value={category.cID.toString()}
                                                    />
                                                ))}
                                            </SelectScrollView>
                                        </SelectContent>
                                    </SelectPortal>
                                </Select>
                            </Box>

                            {/* Template Type */}
                            <Box className="mb-4">
                                <Text className="text-sm font-medium mb-2">Template Type</Text>
                                <HStack space="md">
                                    <Pressable
                                        onPress={() => setTemplateType('General')}
                                        className={`flex-1 p-3 rounded-lg border ${templateType === 'General'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-center ${templateType === 'General' ? 'text-blue-700' : 'text-gray-600'
                                            }`}>
                                            General
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setTemplateType('Specific')}
                                        className={`flex-1 p-3 rounded-lg border ${templateType === 'Specific'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-center ${templateType === 'Specific' ? 'text-blue-700' : 'text-gray-600'
                                            }`}>
                                            Specific
                                        </Text>
                                    </Pressable>
                                </HStack>
                            </Box>

                            {/* Hour Selection (for Specific templates) */}
                            {templateType === 'Specific' && (
                                <Box className="mb-4">
                                    <Text className="text-sm font-medium mb-2">Hour</Text>
                                    <Select
                                        value={selectedHourValue}
                                        onValueChange={(value) => {
                                            setSelectedHourValue(value);
                                            setSelectedHour(value);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectInput
                                                placeholder="Select hour"
                                                value={selectedHour}
                                            />
                                            <SelectIcon as={ChevronDownIcon} />
                                        </SelectTrigger>
                                        <SelectPortal snapPoints={[40]}>
                                            <SelectBackdrop />
                                            <SelectContent>
                                                <SelectDragIndicatorWrapper>
                                                    <SelectDragIndicator />
                                                </SelectDragIndicatorWrapper>
                                                <SelectScrollView>
                                                    {Array.from({ length: 24 }, (_, i) => {
                                                        const hour = String(i).padStart(2, '0') + '00';
                                                        return (
                                                            <SelectItem
                                                                key={hour}
                                                                label={hour}
                                                                value={hour}
                                                            />
                                                        );
                                                    })}
                                                </SelectScrollView>
                                            </SelectContent>
                                        </SelectPortal>
                                    </Select>
                                </Box>
                            )}

                            {/* Template Builder */}
                            <Box className="mb-4">
                                <Text className="text-sm font-medium mb-2">Template Builder</Text>

                                {/* Code Parameters */}
                                <Box className="mb-3">
                                    <HStack className="justify-between items-center mb-2">
                                        <Text className="text-xs text-gray-600">Available Code Parameters:</Text>
                                        <Pressable onPress={() => setShowCodeParamForm(true)}>
                                            <Icon as={PlusIcon} size="xs" className="text-blue-500" />
                                        </Pressable>
                                    </HStack>
                                    <Box className="flex-row flex-wrap gap-2">
                                        {codeParams.map((param, index) => (
                                            <Pressable
                                                key={index}
                                                onPress={() => addCodeParameter(param)}
                                                className="bg-blue-100 px-2 py-1 rounded border border-blue-200"
                                            >
                                                <Text className="text-xs text-blue-700">
                                                    {param.varname}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </Box>
                                </Box>

                                {/* Quick Text Buttons */}
                                <Box className="mb-3">
                                    <Text className="text-xs text-gray-600 mb-2">Quick Add:</Text>
                                    <HStack space="sm" className="flex-wrap">
                                        {[' ', '-', '/', '(', ')', '[', ']', '{', '}', '\n'].map((char) => (
                                            <Pressable
                                                key={char}
                                                onPress={() => addTextPart(char)}
                                                className="bg-gray-100 px-3 py-1 rounded border"
                                            >
                                                <Text className="text-xs">
                                                    {char === '\n' ? '↵' : char === ' ' ? '␣' : char}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </HStack>
                                </Box>

                                {/* Template Text */}
                                <Textarea className="mb-2">
                                    <TextareaInput
                                        placeholder="Enter template text..."
                                        value={templateText}
                                        onChangeText={setTemplateText}
                                        multiline
                                        numberOfLines={4}
                                    />
                                </Textarea>

                                <Pressable
                                    onPress={clearTemplate}
                                    className="bg-gray-200 px-3 py-1 rounded self-start"
                                >
                                    <Text className="text-xs text-gray-600">Clear</Text>
                                </Pressable>
                            </Box>

                            {/* Action Buttons */}
                            <HStack space="md" className="mt-auto pt-6">
                                <Button
                                    variant="outline"
                                    onPress={() => setShowForm(false)}
                                    className="flex-1"
                                >
                                    <ButtonText>Cancel</ButtonText>
                                </Button>
                                <Button onPress={handleSubmit} className="flex-1">
                                    <ButtonText>
                                        {isCreateMode ? 'Create' : 'Update'}
                                    </ButtonText>
                                </Button>
                            </HStack>
                        </KeyboardAwareScrollView>
                    </Box>
                </Box>
            )}

            {/* Code Parameter Form Modal */}
            {showCodeParamForm && (
                <Box className="absolute inset-0 bg-black/50 justify-center items-center">
                    <Box className="bg-white rounded-3xl p-6 w-[90%] max-w-md">
                        <KeyboardAwareScrollView >
                            <HStack className="justify-between items-center mb-4">
                                <Heading size="md">Add Code Parameter</Heading>
                                <Pressable onPress={() => setShowCodeParamForm(false)}>
                                    <Icon as={XIcon} size="md" />
                                </Pressable>
                            </HStack>

                            <VStack space="md">
                                <Box>
                                    <Text className="text-sm font-medium mb-2">Parameter Code</Text>
                                    <Input>
                                        <InputField
                                            placeholder="e.g., TT, DD, FF"
                                            value={codeParamPar}
                                            onChangeText={setCodeParamPar}
                                        />
                                    </Input>
                                </Box>

                                <Box>
                                    <Text className="text-sm font-medium mb-2">Variable Name</Text>
                                    <Input>
                                        <InputField
                                            placeholder="e.g., temperature, windDirection"
                                            value={codeParamVar}
                                            onChangeText={setCodeParamVar}
                                        />
                                    </Input>
                                </Box>

                                <Box>
                                    <Text className="text-sm font-medium mb-2">Display Name</Text>
                                    <Input>
                                        <InputField
                                            placeholder="e.g., Temperature, Wind Direction"
                                            value={codeParamvarname}
                                            onChangeText={setCodeParamvarname}
                                        />
                                    </Input>
                                </Box>
                            </VStack>
                        </KeyboardAwareScrollView>
                        <HStack space="md" className="mt-4">
                            <Button
                                variant="outline"
                                onPress={() => setShowCodeParamForm(false)}
                                className="flex-1"
                            >
                                <ButtonText>Cancel</ButtonText>
                            </Button>
                            <Button onPress={handleCodeParamSubmit} className="flex-1">
                                <ButtonText>Add Parameter</ButtonText>
                            </Button>
                        </HStack>
                    </Box>
                </Box>
            )}
        </SafeAreaView>
    );
}