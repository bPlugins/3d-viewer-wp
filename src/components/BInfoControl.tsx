import { ToggleControl } from "@wordpress/components";
import { BControlPro } from "../../../bpl-tools/ProControls";
import Label from "./Label";

interface BInfoControlProps {
    info?: string;
    label?: string;
    className?: string;
    onChange?: (val: any) => void;
    setOpen?: (open: boolean) => void;
    [key: string]: any;
}

const BInfoControl = ({ info = "", label = "", className = "", onChange = () => { }, setOpen, ...restPros }: BInfoControlProps) => {
    return (
        <div className="mt5 bInfoControl">
            {/* @ts-ignore */}
            <BControlPro isPremium={true} Component={ToggleControl} label={<Label info={info}>{label}</Label>} className={className} onChange={onChange} setIsProModalOpen={setOpen} {...restPros} />
        </div>
    );
};

export default BInfoControl;
