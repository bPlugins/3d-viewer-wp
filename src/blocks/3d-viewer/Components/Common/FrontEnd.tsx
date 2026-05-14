
import { useRef, useState } from "react";
import Viewer from "./Viewer";
import createSetAttributes from "../../../../utils/createSetAttributes";

if (!Array.isArray(window.modelViewerMessages)) {
  window.modelViewerMessages = [];
}

const FrontEnd = ({ attributes }: { attributes: any }) => {
  const [attrs, setAttrs] = useState(attributes);

  // eslint-disable-next-line no-unused-vars
  function __(text: string, textdomain = "") {
    return text;
  }
  const viewerRef = useRef(null);
  window.modelViewerMessages.push({ attributes, viewerRef });

  const setAttributes = createSetAttributes(setAttrs);
  const containerRef = useRef(null);

  if (attributes) {
    return <Viewer {...{ attributes: attrs, viewerRef, __, setAttributes, containerRef }} />;
  }
};

export default FrontEnd;

