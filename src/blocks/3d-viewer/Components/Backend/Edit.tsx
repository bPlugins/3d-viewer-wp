import { __ } from "@wordpress/i18n";
import { useEffect, useState, useRef, useMemo } from "@wordpress/element";
const { withSelect } = wp.data;
import { useSelect } from "@wordpress/data";
import { useBlockProps, MediaUpload } from "@wordpress/block-editor";
import { Button, PanelRow, TextControl } from "@wordpress/components";

import Settings from "./settings";
import Viewer from "../Common/Viewer";
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

  // A copied block shares its source's id; the first one in the tree keeps it.
  const isDuplicateId = useSelect((select: any) => {
    const { getClientIdsWithDescendants, getBlockName, getBlockAttributes } = select("core/block-editor");
    const owner = getClientIdsWithDescendants().find(
      (id: string) => getBlockName(id) === "b3dviewer/modelviewer" && getBlockAttributes(id)?.uniqueId === uniqueId
    );
    return Boolean(owner && owner !== clientId);
  }, [uniqueId, clientId]);

  // Only assign an id when missing or duplicated, so opening the editor doesn't dirty the post.
  useEffect(() => {
    if (!uniqueId || uniqueId === "uniqueId" || isDuplicateId) {
      setAttributes({ uniqueId: "b3dviewer" + clientId.substr(0, 8) });
    }
  }, [uniqueId, isDuplicateId]);

  useEffect(() => {
    const woo = ["product", null].includes(postType);
    if (attributes.woo !== woo) {
      setAttributes({ woo });
    }
  }, [postType]);

  const viewerAttributes = useMemo(() => ({ ...attributes, isBackend: true }), [attributes]);

  // The placeholder unmounts once modelUrl is set, so typed text is only committed on Enter/blur.
  const [draftUrl, setDraftUrl] = useState("");
  const commitDraftUrl = () => {
    const modelUrl = draftUrl.trim();
    modelUrl && setAttributes({ model: { ...model, modelUrl } });
  };


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

        {modelSrc && isValid && <Viewer {...{ viewerRef, attributes: viewerAttributes, setAttributes, __, containerRef }} />}
        {modelSrc && !isValid && <h2>{__("3D file is not valid", "3d-viewer")}</h2>}
        {!modelSrc && (
          <div className="upload3d" style={uploadStyle}>
            <div className="upload3d__icon"><ThreeDIcons size={26} /></div>
            <h2>{__("Add Your 3D Model", "3d-viewer")}</h2>
            <p className="upload3d__hint">{__("Paste a model URL or upload a file to get started.", "3d-viewer")}</p>
            <PanelRow className="bPlInlineMediaUpload">
              <TextControl
                value={draftUrl}
                placeholder={__("Model URL", "3d-viewer")}
                onChange={setDraftUrl}
                onBlur={commitDraftUrl}
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && commitDraftUrl()}
              />
              <MediaUpload
                allowedTypes={["model/gltf-binary", "model/obj", "application/octet-stream", "application/x-3ds", "application/vnd.ms-pki.stl", "text/vnd.in3d.3dml", "application/collada+xml", "model/vrml", "application/vnd.ms-3mfdocument"]}
                onSelect={(media: any) => setAttributes({ model: { ...model, modelUrl: media.url } })}
                render={({ open }: any) => (
                  <Button className="button button-primary" onClick={open} label={__("Upload 3D model", "3d-viewer")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M7.4,10h1.59v5c0,0.55,0.45,1,1,1h4c0.55,0,1-0.45,1-1v-5h1.59c0.89,0,1.34-1.08,0.71-1.71L12.7,3.7 c-0.39-0.39-1.02-0.39-1.41,0L6.7,8.29C6.07,8.92,6.51,10,7.4,10z M5,19c0,0.55,0.45,1,1,1h12c0.55,0,1-0.45,1-1s-0.45-1-1-1H6 C5.45,18,5,18.45,5,19z" />
                    </svg>
                  </Button>
                )}
              />
            </PanelRow>
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
