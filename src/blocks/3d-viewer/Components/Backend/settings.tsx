import { __ } from "@wordpress/i18n";
import { withSelect } from "@wordpress/data";
import { InspectorControls } from "@wordpress/block-editor";

import { ClipboardButton, TabPanel, Panel, PanelBody, PanelRow } from "@wordpress/components";
import { useState } from "@wordpress/element";
import ModelForm from "./Tabs/General/ModelForm";
import _Style from "./Tabs/Style/Style";
const Style = _Style as unknown as React.FC<any>;
import Additional from "./Tabs/Style/Additional";
import Options from "./Tabs/General/Options";
import O3DVOptions from "./Tabs/General/O3DVOptions";

// import "./settings.scss";
import Hotspots from "./Tabs/General/Hotspots";
import Upgrade from "./Upgrade";
import ProModal from "./ProModal";
import { AdvertiseCard } from "../../../../../../bpl-tools/ProControls";
// import AR from './Components/Tabs/General/AR';

//settings typescript props
interface SettingsProps {
  attributes: any;
  setAttributes: (attrs: any) => void;
  postId: string;
  postType: string;
}

const Settings = ({ attributes, setAttributes, postId, postType }: SettingsProps) => {
  const [copied, setCopied] = useState(false);
  const { currentViewer, isPremium, placement } = attributes;
  const [open, setOpen] = useState<boolean>(false);


  const props = { attributes, setAttributes, isPremium, open, setOpen }

  return (
    <InspectorControls>
      {postType === "bp3d-model-viewer" && (
        <PanelBody>
          <PanelRow>
            <div className="b3dviewer_front_shortcode justify-center">
              <ClipboardButton
                //@ts-expect-error
                variant="primary"
                title={copied ? __("Copied", "3d-viewer") : ""}
                text={`[3d_viewer id=${postId}]`}
                onCopy={() => setCopied(true)}
                onFinishCopy={() => setCopied(false)}
              >
                {copied ? __("Copied", "3d-viewer") : __("Copy Shortcode", "3d-viewer")}
              </ClipboardButton>
              {/* {copied && <Snackbar>{__("Copied Succesfully", "3d-viewer")}</Snackbar>} */}
            </div>
          </PanelRow>
        </PanelBody>
      )}
      <TabPanel
        className="b3dviewer-tab-panel bPlTabPanel"
        activeClass="active activeTab"
        tabs={[
          {
            name: "settings",
            title: __("Settings", "3d-viewer"),
            className: "settings",
          },
          {
            name: "style",
            title: __("Style", "3d-viewer"),
            className: "style",
          },
        ]}
      >
        {(tab) => {
          return (
            <span>
              {tab.name === "settings" && (
                <Panel>
                  <ModelForm {...props} />

                  {currentViewer === "modelViewer" && <>

                    <Options {...props} />
                  </>}

                  {currentViewer === "O3DViewer" && <O3DVOptions {...props} />}

                  {currentViewer === 'modelViewer' && <Hotspots />}

                </Panel>
              )}
              {tab.name === "style" && placement !== 'visual-editor' && (
                <Panel>
                  <Style {...props} />
                </Panel>
              )}
            </span>
          );
        }}
      </TabPanel>
      <Additional {...props} />

      {/* <AdvertiseCard planLink="https://bplugins.com/products/3d-viewer/pricing/" /> */}
      <ProModal open={open} setOpen={setOpen} />
    </InspectorControls>
  );
};

export default (withSelect((select: any) => {
  const postType = select("core/editor")?.getCurrentPostType() || "product";
  const postId = select("core/editor")?.getCurrentPostId();

  return {
    postId,
    postType,
  };
}) as unknown as (component: React.ComponentType<any>) => React.ComponentType<any>)(Settings);
