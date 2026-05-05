import { PanelBody } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import Title from "../../../../../../components/Title";
import AnnotationIcon from "../../../../../../icons/AnnotationIcon";
import { PremiumBadge, PremiumPanel } from "../../../../../../../../bpl-tools/ProControls";
import { pricingUrl } from "../../../../../../utils/constant";

const Hotspots = () => {
    return <>
        {/* @ts-ignore */}
        <PanelBody className="bPlPanelBody hotspots" title={<><Title title={__("Hotspots", "3d-viewer")} Icon={AnnotationIcon} /> <PremiumBadge /></>} >

            {/* <Notice status={"info"}>
                {__("Hotspots/Annotations available in premium version", "3d-viewer")}
            </Notice> */}
            <PremiumPanel title={__('Premium Feature', '3d-viewer')} description={__('Hotspots/Annotations available in premium version', '3d-viewer')} pricingUrl={pricingUrl} />

        </PanelBody >
    </>
}

export default Hotspots;
