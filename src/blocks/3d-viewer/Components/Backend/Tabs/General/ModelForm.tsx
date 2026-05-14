import { SelectControl, PanelBody } from "@wordpress/components";

import { __ } from "@wordpress/i18n";
import { BtnGroup, InlineMediaUpload } from '../../../../../../../../bpl-tools/Components'


import { modelViewers } from "../../../../data";
import ThreeDIcons from "../../../../../../icons/ThreeDIcons";
import Title from "../../../../../../components/Title";
import BInfoControl from "../../../../../../components/BInfoControl";
import { helpText, pricingUrl } from "../../../../../../utils/constant";
import { PremiumPanel } from "../../../../../../../../bpl-tools/ProControls";


interface ModelFormProps {
  attributes: any;
  setAttributes: (attrs: any) => void;
}

const ModelForm = ({ attributes, setAttributes }: ModelFormProps) => {
  const { model, currentViewer, O3DVSettings, placement } = attributes;

  return (
    <PanelBody title={<Title title={__("Model", "3d-viewer")} Icon={ThreeDIcons} /> as unknown as string} initialOpen={placement !== 'visual-editor'} className="bPlPanelBody">

      <BInfoControl Component={BtnGroup} value={currentViewer} label={__("3D Viewer", "3d-viewer")} options={modelViewers(placement)} onChange={(value) => setAttributes({ currentViewer: value })} isTextIcon={true} info={helpText.viewerType} />

      <BInfoControl Component={InlineMediaUpload}
        value={model?.modelUrl}
        placeholder={__("Model URL", "3d-viewer")}
        onChange={(modelUrl) => {
          setAttributes({ model: { ...model, initialView: null, modelUrl, ext: modelUrl.split(".")?.[modelUrl.split(".").length - 1] }, O3DVSettings: { ...O3DVSettings, camera: null } });
        }}
        types={["model/gltf-binary", "model/obj", "application/octet-stream", "application/x-3ds", "application/vnd.ms-pki.stl", "text/vnd.in3d.3dml", "application/collada+xml", "model/vrml", "application/vnd.ms-3mfdocument"]}
        label={__("Model URL", "3d-viewer")}
        info={helpText.modelUrl}
      />



      {currentViewer === "modelViewer" && (
        <>
          <BInfoControl Component={InlineMediaUpload} value={model?.poster} placeholder={__("Model Poster", "3d-viewer")} onChange={(poster) => setAttributes({ model: { ...model, poster } })} types={["image"]} label={__("Model Poster", "3d-viewer")} info={helpText.modelPoster} />


          <BInfoControl Component={SelectControl} options={[
            { label: "None", value: "none" },
            { label: "Draco", value: "Draco" }
          ]}
            value={model?.decoder}
            onChange={(decoder) => setAttributes({ model: { ...model, decoder } })}
            label={__("Use Decoder", "3d-viewer")}
            info={helpText.useDecoder}
            __next40pxDefaultSize={true}
            __nextHasNoMarginBottom={true}
          />
          {/* </PanelRow> */}

          {model?.decoder === "Draco" && (
            <>
              <InlineMediaUpload value={model?.binFile} placeholder={__("Bin File", "3d-viewer")} onChange={(binFile: string) => setAttributes({ model: { ...model, binFile } })} types={["application/octet-stream"]} label={__("Bin File", "3d-viewer")} />
            </>
          )}

        </>
      )}

      {currentViewer === 'modelViewer' && <>
        {/* <Notice status="info">
          {__("Use Multople models, HDR skybox image, Enviroment Image, Exposure, Ton Mapping and AR in premmium version", "3d-viewer")}
        </Notice> */}
        <hr />
        <PremiumPanel title={__('Premium Features', '3d-viewer')} description={__('Multople models, HDR skybox image, Enviroment Image, Exposure, Ton Mapping, AR and Apply Textures available in premmium version', '3d-viewer')} pricingUrl={pricingUrl} />
      </>}

    </PanelBody>
  );
};

export default ModelForm;
