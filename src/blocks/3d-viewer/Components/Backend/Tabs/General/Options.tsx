import { __ } from "@wordpress/i18n";
import { PanelBody, ToggleControl, RangeControl } from "@wordpress/components";
import Title from "../../../../../../components/Title";
import SettingsIcon from "../../../../../../icons/SettingsIcon";
import BInfoControl from "../../../../../../components/BInfoControl";
import { helpText } from "../../../../../../utils/constant";
import Notice from "../../../../../../../../bpl-tools/Components/Notice";

interface OptionsProps {
  attributes: any;
  setAttributes: (attrs: any) => void;
  setOpen: (open: boolean) => void;
}

const Options = ({ attributes, setAttributes, setOpen }: OptionsProps) => {
  const { fullscreen, cameraBtn, lazyLoad, loadingPercentage, model, mouseControl, progressBar, zoomInOutBtn, exposure = 1, shadow = true } = attributes;

  return (
    <>
      {/* @ts-ignore */}
      <PanelBody title={<Title title={__("Options", "3d-viewer")} Icon={SettingsIcon} />} initialOpen={false} className="bPlPanelBody">
        <BInfoControl Component={ToggleControl} label={__("Fullscreen", "3d-viewer")} checked={fullscreen} onChange={() => setAttributes({ fullscreen: !fullscreen })} info={helpText.fullscreen} />

        {["gltf", "glb"].includes(model.ext || "glb") && (
          <>

            <BInfoControl Component={ToggleControl} label={__("Mouse Control", "3d-viewer")} checked={mouseControl} onChange={() => setAttributes({ mouseControl: !mouseControl })} info={helpText.mouseControl} />

            <BInfoControl Component={ToggleControl} className="mt5" label={__("Lazy Load", "3d-viewer")} checked={lazyLoad} onChange={() => setAttributes({ lazyLoad: !lazyLoad })} info={helpText.lazyLoad} />

            <BInfoControl Component={ToggleControl} className="mt5" label={__("Show Loading Percentage", "3d-viewer")} checked={loadingPercentage} onChange={() => setAttributes({ loadingPercentage: !loadingPercentage })} info={helpText.loadingPercentage} />

            <BInfoControl Component={ToggleControl} className="mt5" label={__("Show Progressbar", "3d-viewer")} checked={progressBar} onChange={() => setAttributes({ progressBar: !progressBar })} info={helpText.progressBar} />

            <BInfoControl Component={ToggleControl} className="mt10" label={__("Camera/Capture Button", "3d-viewer")} checked={cameraBtn} onChange={() => setAttributes({ cameraBtn: !cameraBtn })} info={helpText.cameraBtn} />
            <BInfoControl Component={ToggleControl} className="mt10" label={__("Zoom In/Out Button", "3d-viewer")} checked={zoomInOutBtn} onChange={() => setAttributes({ zoomInOutBtn: !zoomInOutBtn })} info={helpText.zoomInOutBtn} />

            <BInfoControl Component={ToggleControl} className="mt5" label={__("Enable Shadow", "3d-viewer")} checked={shadow} onChange={() => setAttributes({ shadow: !shadow })} info={helpText.shadow} />

            <BInfoControl Component={RangeControl} labelPosition="side" label={__("Exposure", "3d-viewer")} value={exposure} onChange={(exposure: number) => setAttributes({ exposure })} min={0.1} step={0.1} max={5} info={__("Adjusts the brightness of the model scene. Higher values make the model brighter.", "3d-viewer")} />

            <Notice status={"premium"} isIcon={true}>
              {__("autoplay, variant selector, animation selector, lock left-right, up-down rotation, auto rotate, zoom, set initial zoom available in premium version", "3d-viewer")}
            </Notice>


          </>
        )}


      </PanelBody>
    </>
  );
};

export default Options;
