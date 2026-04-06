export interface InputFieldConfig {
    label: string;
    setterFn: (value: string) => void;
    validFn?: (value: string) => string | null;
    blurFn?: (value: string) => string | Promise<string>;
    value?: string | null;
    valueName: string;
    type?: string;
    defaultValue?: string | number | boolean;
    isDisabled?: boolean;
    isReadOnly?: boolean;
    maxLength: number;
    maxCharType?: number;
    error: string;
}

export interface InputGroupType {
    groupName: string;
    bgColor: string;
    inputFields: InputFieldConfig[];
    errorHandler: Function;
}


