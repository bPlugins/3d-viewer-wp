import React from 'react';

const { __experimentalUnitControl: UnitControl } = (wp as any).components;

import "./styles.scss";

interface UnitOption {
    value: string;
    label: string;
    default: number;
}

interface BUnitControlProps {
    units?: UnitOption[];
    value: string;
    onChange: (value: string) => void;
    isResetValueOnUnitChange?: boolean;
    [key: string]: any;
}

const BUnitControl: React.FC<BUnitControlProps> = (props) => {
    const {
        units = [
            { value: "px", label: "px", default: 16 },
            { value: "em", label: "em", default: 1 },
        ],
        value,
        onChange,
        isResetValueOnUnitChange = true,
        ...rest
    } = props;

    return (
        <div id="BUnitControl">
            <UnitControl
                onChange={onChange}
                isResetValueOnUnitChange={isResetValueOnUnitChange}
                value={value}
                units={units}
                {...rest}
            />
        </div>
    );
};

export default BUnitControl;
