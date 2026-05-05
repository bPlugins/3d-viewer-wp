import { PanelBody, ToggleControl, } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import BInfoControl from "../../../../../../components/BInfoControl";
import { Notice } from "../../../../../../../../bpl-tools/Components";

interface O3DVOptionsProps {
  attributes: any;
  setAttributes: (attrs: any) => void;
  setOpen: (open: boolean) => void;
}

const O3DVOptions = ({ attributes, setAttributes, setOpen }: O3DVOptionsProps) => {
  const { O3DVSettings, zoomInOutBtn } = attributes;
  const { isFullscreen, mouseControl } = O3DVSettings;

  const handleChange = (option: any) => {
    setAttributes({ O3DVSettings: { ...O3DVSettings, ...option } });
  };

  return (
    <PanelBody title={__("Options", "3d-viewer")}>
      <ToggleControl label={__("Fullscreen", "3d-viewer")} checked={isFullscreen} onChange={() => handleChange({ isFullscreen: !isFullscreen })} />
      <BInfoControl Component={ToggleControl} className="mt10" label={__("Zoom In/Out Button", "3d-viewer")} checked={zoomInOutBtn} onChange={() => setAttributes({ zoomInOutBtn: !zoomInOutBtn })} setOpen={setOpen} />

      <ToggleControl label={__("Mouse Control", "3d-viewer")} checked={mouseControl} onChange={() => handleChange({ mouseControl: !mouseControl })} />
      {mouseControl && <Notice>{__("Mouse control does not work in Editor (Backend).", "3d-viewer")}</Notice>}

    </PanelBody>
  );
};

export default O3DVOptions;
