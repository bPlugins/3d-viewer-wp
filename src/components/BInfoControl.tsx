import { ToggleControl } from "@wordpress/components";
import { BControlPro } from "../../../bpl-tools/ProControls";
import Label from "./Label";

interface BInfoControlProps {
    info?: string;
    label?: string;
    onChange?: (val: any) => void;
    Component?: any;
    [key: string]: any;
}

const BInfoControl = ({ info = "", label = "", Component = ToggleControl, ...restPros }: BInfoControlProps) => {
    return (
        <div className="mt5 bInfoControl">
            {/* @ts-ignore */}
            <Component label={<Label info={info}>{label}</Label>} {...restPros} />
        </div>
    );
};

export default BInfoControl;
