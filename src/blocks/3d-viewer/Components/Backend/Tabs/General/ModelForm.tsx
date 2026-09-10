import { SelectControl, PanelBody, ToggleControl } from "@wordpress/components";

import { __ } from "@wordpress/i18n";
import BtnGroup from '../../../../../../../../bpl-tools/Components/BtnGroup/BtnGroup'
import { InlineMediaUpload } from '../../../../../../../../bpl-tools/Components/MediaControl/MediaControl'


import { defaultEnvironmentImages, modelViewers } from "../../../../data";
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

  const environmentImage = attributes.environmentImage || '';

  // A custom image needs an entry of its own to stay selected, but only ever one.
  const environmentImages = defaultEnvironmentImages.some((item) => item.value === environmentImage)
    ? defaultEnvironmentImages
    : [...defaultEnvironmentImages, { label: __("Custom", "3d-viewer"), value: environmentImage }];

  const settingsUrl = window.bp3dBlock?.admin_url + 'edit.php?post_type=bp3d-model-viewer&page=3dviewer-settings';
  const allowedMimeTypes: string[] = window.bp3dBlock?.allowedMimeTypes || [];
  const supportedMimes: Record<string, string> = window.bp3dBlock?.supportedMimes || {};
  const supportedMimeTypes = Object.keys(supportedMimes);

  // The media picker lists whatever is still uploadable, so a format switched
  // off in settings drops out of it too.
  const modelMimeTypes = Array.from(new Set(allowedMimeTypes.map((ext) => supportedMimes[ext]).filter(Boolean)));
  const modelUrl = model?.modelUrl || '';

  let showNotice = false;
  let noticeMessage = '';

  if (allowedMimeTypes.length === 0) {
    showNotice = true;
    noticeMessage = __("All 3D file formats are currently disabled for upload. Please enable them in settings.", "3d-viewer");
  } else if (modelUrl) {
    const ext = modelUrl.split('.').pop()?.toLowerCase();
    if (ext && supportedMimeTypes.includes(ext) && !allowedMimeTypes.includes(ext)) {
      showNotice = true;
      noticeMessage = `The uploaded 3D model format (.${ext.toUpperCase()}) is currently disabled. Please enable it in settings.`;
    }
  }

  return (
    <PanelBody title={<Title title={__("Model", "3d-viewer")} Icon={ThreeDIcons} /> as unknown as string} initialOpen={placement !== 'visual-editor'} className="bPlPanelBody">

      {showNotice ? (
        <div style={{
          padding: '10px 12px',
          borderLeft: '4px solid #d63638',
          background: '#fff',
          boxShadow: '0 1px 1px 0 rgba(0,0,0,.1)',
          marginBottom: '15px',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          <span style={{ color: '#d63638', fontWeight: 'bold' }}>{__("Notice: ", "3d-viewer")}</span>
          {noticeMessage}
          {' '}
          <a href={settingsUrl} target="_blank" rel="noreferrer" style={{ color: '#2271b1', textDecoration: 'underline' }}>
            {__("Enable in settings", "3d-viewer")}
          </a>.
        </div>
      ) : (
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '15px', display: 'flex', alignItems: 'flex-start', gap: '4px', lineHeight: '1.4' }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#46b450', marginTop: '4px', flexShrink: 0 }}></span>
          <span>
            {__("All supported 3D formats are enabled for upload by default. You can turn any of them off in ", "3d-viewer")}
            <a href={settingsUrl} target="_blank" rel="noreferrer" style={{ color: '#2271b1', textDecoration: 'underline' }}>
              {__("Settings", "3d-viewer")}
            </a>.
          </span>
        </div>
      )}

      <BInfoControl Component={BtnGroup} value={currentViewer} label={__("3D Viewer", "3d-viewer")} options={modelViewers(placement)} onChange={(value) => setAttributes({ currentViewer: value })} isTextIcon={true} info={helpText.viewerType} />

      <BInfoControl Component={InlineMediaUpload}
        value={model?.modelUrl}
        placeholder={__("Model URL", "3d-viewer")}
        onChange={(modelUrl) => {
          setAttributes({ model: { ...model, initialView: null, modelUrl, ext: modelUrl.split(".")?.[modelUrl.split(".").length - 1] }, O3DVSettings: { ...O3DVSettings, camera: null } });
        }}
        types={modelMimeTypes.length ? modelMimeTypes : Object.values(supportedMimes)}
        label={__("Model URL", "3d-viewer")}
        info={helpText.modelUrl}
      />



      {currentViewer === "modelViewer" && (
        <>
          <BInfoControl Component={InlineMediaUpload} value={model?.poster} placeholder={__("Model Poster", "3d-viewer")} onChange={(poster) => setAttributes({ model: { ...model, poster } })} types={["image"]} label={__("Model Poster", "3d-viewer")} info={helpText.modelPoster} />

          <BInfoControl Component={SelectControl} label={__("Environment Image", "3d-viewer")} options={environmentImages} value={environmentImage} onChange={(environmentImage) => setAttributes({ environmentImage })} info={helpText.environmentImage} />

          <BInfoControl Component={InlineMediaUpload} value={environmentImage} placeholder={__("Environment Image URL", "3d-viewer")} onChange={(environmentImage) => setAttributes({ environmentImage })} types={["image"]} label={__("Custom Environment Image", "3d-viewer")} info={helpText.environmentImage} />

          <BInfoControl Component={InlineMediaUpload} value={model?.skyboxImage} placeholder={__("HDR Image URL", "3d-viewer")} onChange={(skyboxImage) => setAttributes({ model: { ...model, skyboxImage } })} types={["image"]} label={__("HDR Skybox Image", "3d-viewer")} info={helpText.skyboxImage} />


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
        <hr />
        <BInfoControl label={__("Enable AR", "3d-viewer")} Component={ToggleControl} checked={model?.arEnabled} onChange={() => setAttributes({ model: { ...model, arEnabled: !model.arEnabled } })} info={helpText.arEnabled} />
        {model?.arEnabled && (
          <>
            <BInfoControl Component={InlineMediaUpload} types={['model']} value={model?.modelISOSrc} placeholder={__("3D Model for iOS (Optional)", "3d-viewer")} onChange={(modelISOSrc) => setAttributes({ model: { ...model, modelISOSrc } })} label={__("3D Model (iOS)", "3d-viewer")} info={helpText.modeliSOSrc} />

            <BInfoControl Component={SelectControl} label={__("AR Placement", "3d-viewer")}
              options={[
                { label: "Floor", value: "floor" },
                { label: "Wall", value: "wall" },
              ]}
              value={model?.arPlacement}
              onChange={(arPlacement) => setAttributes({ model: { ...model, arPlacement } })}
              info={helpText.arPlacement}
              __next40pxDefaultSize={true}
              __nextHasNoMarginBottom={true}
            />

            <BInfoControl Component={SelectControl} label={__("AR Mode", "3d-viewer")}
              options={[
                { label: "webxr", value: "webxr" },
                { label: "Scene Viewer", value: "scene-viewer" },
                { label: "Quick Look", value: "quick-look" },
              ]}
              value={model?.arMode}
              onChange={(arMode) => setAttributes({ model: { ...model, arMode } })}
              info={helpText.arMode}
              __next40pxDefaultSize={true}
              __nextHasNoMarginBottom={true}
            />
          </>
        )}
        <hr />
        <PremiumPanel title={__('Premium Features', '3d-viewer')} description={__('Multiple models, tone mapping and applying textures are available in the premium version', '3d-viewer')} pricingUrl={pricingUrl}><></></PremiumPanel>
      </>}

    </PanelBody>
  );
};

export default ModelForm;
