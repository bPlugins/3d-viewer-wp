import { __ } from "@wordpress/i18n";
import { useEffect, useState, useRef } from "@wordpress/element";
const { withSelect } = wp.data;
import { useBlockProps } from "@wordpress/block-editor";

import Settings from "./settings";
import Viewer from "../Common/Viewer";
import { InlineMediaUpload } from "../../../../../../bpl-tools/Components/MediaControl/MediaControl";
import ThreeDIcons from "../../../../icons/ThreeDIcons";
import { BlockAttributes } from "../../types";

interface EditProps {
  clientId: string;
  attributes: BlockAttributes;
  setAttributes: (attrs: Partial<BlockAttributes>) => void;
  isSelected: boolean;
  postType: string;
}

const Edit = ({ clientId, attributes, setAttributes, isSelected, postType }: EditProps) => {
  const [isValid, setIsValid] = useState(true);
  const { uniqueId, model } = attributes;
  const viewerRef = useRef();

  //generate new unique ID
  useEffect(() => {
    const woo = ["product", null].includes(postType) ? true : false;
    setAttributes({ uniqueId: "b3dviewer" + clientId.substr(0, 8), woo, isBackend: true });
  }, []);


  useEffect(() => {
    try {
      new URL(modelSrc as string);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    }
  }, [uniqueId, model]);

  const modelSrc = model?.modelUrl;

  const blockProps = useBlockProps({ draggable: false });
  blockProps.className = blockProps.className
    ?.replace(/\balign\w+\b/g, '') // removes alignwide, alignfull, alignleft, etc.
    .trim();

  const containerRef = useRef();

  // Old saves store height as a plain string instead of per-device values.
  const height = attributes.styles?.height as any;
  const heightFor = (device: string) => (typeof height === "string" ? height : height?.[device]);
  const uploadStyle = {
    "--bp3d-upload-h-desktop": heightFor("desktop"),
    "--bp3d-upload-h-tablet": heightFor("tablet"),
    "--bp3d-upload-h-mobile": heightFor("mobile"),
  } as React.CSSProperties;


  return (
    <div {...blockProps}>

      {!isSelected && <div className="modelViewerIsSelected"></div>}
      <>
        <Settings {...{ attributes, setAttributes, viewerRef }} />

        {modelSrc && isValid && <Viewer {...{ viewerRef, attributes, setAttributes, __, containerRef }} />}
        {modelSrc && !isValid && <h2>{__("3D file is not valid", "3d-viewer")}</h2>}
        {!modelSrc && (
          <div className="upload3d" style={uploadStyle}>
            <div className="upload3d__icon"><ThreeDIcons size={26} /></div>
            <h2>{__("Add Your 3D Model", "3d-viewer")}</h2>
            <p className="upload3d__hint">{__("Paste a model URL or upload a file to get started.", "3d-viewer")}</p>
            <InlineMediaUpload
              value={modelSrc}
              placeholder={__("Model URL", "3d-viewer")}
              onChange={(modelUrl: string) => {
                setAttributes({ model: { ...model, modelUrl } });
              }}
              types={["model/gltf-binary", "model/obj", "application/octet-stream", "application/x-3ds", "application/vnd.ms-pki.stl", "text/vnd.in3d.3dml", "application/collada+xml", "model/vrml", "application/vnd.ms-3mfdocument"]}
            />
          </div>
        )}
      </>
    </div>
  );
};

export default withSelect((select: any) => {
  const postType = select("core/editor")?.getCurrentPostType() || "product";
  return {
    postType,
  };
})(Edit);
