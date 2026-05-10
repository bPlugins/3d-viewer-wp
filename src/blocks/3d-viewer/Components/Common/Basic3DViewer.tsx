import { useEffect, useMemo, useRef, useState } from "react";

import posx from "../../../../../public/images/envmaps/fishermans_bastion/posx.jpg";
import posy from "../../../../../public/images/envmaps/fishermans_bastion/posy.jpg";
import posz from "../../../../../public/images/envmaps/fishermans_bastion/posz.jpg";
import negx from "../../../../../public/images/envmaps/fishermans_bastion/negx.jpg";
import negy from "../../../../../public/images/envmaps/fishermans_bastion/negy.jpg";
import negz from "../../../../../public/images/envmaps/fishermans_bastion/negz.jpg";

import hexToRGB from "../../../../../../wp-utils/v1/hexToRGB";


interface Basic3DViewerProps {
  attributes: any;
  modelSrc: string;
}

const Basic3DViewer = (props: Basic3DViewerProps) => {
  const { attributes, modelSrc } = props;
  const { styles, multiple, O3DVSettings = {}, model, isBackend } = attributes;
  const { camera, mouseControl, zoom = true, showEdge = false } = O3DVSettings;
  const currentModel = model;

  const [viewerLoaded, setViewerLoaded] = useState(false);

  const parentDiv = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {

    if (modelSrc) {
      viewerRef.current?.Destroy();
      viewerRef.current?.canvas?.remove();
      viewerRef.current = null;


      if (viewerRef.current === null) {

        const defaultCamera = camera && !multiple ? { camera: new window.OV.Camera(new window.OV.Coord3D(...Object.values(camera.eye)), new window.OV.Coord3D(...Object.values(camera.center)), new window.OV.Coord3D(...Object.values(camera.up)), 45.0) } : {};

        instanceRef.current = new window.OV.EmbeddedViewer(parentDiv.current, {
          ...defaultCamera,
          backgroundColor: new window.OV.RGBAColor(255, 255, 255, 255),
          edgeSettings: new window.OV.EdgeSettings(showEdge, new window.OV.RGBColor(0, 0, 0), 1),
          environmentSettings: new window.OV.EnvironmentSettings([posx, negx, posy, negy, posz, negz], false),
        });

        const models = [modelSrc?.replace(/https?:/, window.location.protocol)];
        instanceRef.current.LoadModelFromUrlList(models);
        viewerRef.current = instanceRef.current;
        window.VR = instanceRef.current;

        // handle zoom functionality
        instanceRef.current.viewer.navigation.SetZoomStatus(zoom);
      } else {
        viewerRef.current.LoadModelFromUrlList([modelSrc?.replace(/https?:/, window.location.protocol)]);
        const Coord3D = new window.OV.Coord3D(0.0, 0.0, 0.0);
        viewerRef.current.viewer.SetCamera(new window.OV.Camera(new window.OV.Coord3D(0.0, 0.0, 1.0), Coord3D, new window.OV.Coord3D(0.0, 1.0, 0.0), 45.0));
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 1000);

      }
    }

    return () => {
      if (viewerRef.current !== null && parentDiv.current !== null && viewerLoaded) {
        delete viewerRef.current.model;
        viewerRef.current.viewer.renderer.resetState();
        viewerRef.current.viewer.Clear();
        if (viewerRef.current.viewer) {
          delete viewerRef.current.viewer;
        }
        const gl = viewerRef.current.canvas.getContext("webgl2");
        gl.getExtension("WEBGL_lose_context").loseContext();
        const tempClone = viewerRef.current.canvas.cloneNode(true);
        viewerRef.current.canvas.parentNode.replaceChild(tempClone, viewerRef.current.canvas);
        parentDiv.current?.removeChild(parentDiv.current.children[0]);
        viewerRef.current.canvas?.parentNode?.removeChild(viewerRef.current.canvas);
        viewerRef.current.canvas.remove();
        viewerRef.current = null;
        setViewerLoaded(false);
      }
    };
  }, [modelSrc, currentModel]);

  useEffect(() => {
    if (hexToRGB(styles.bgColor)) {
      viewerRef.current?.viewer?.SetBackgroundColor(hexToRGB(styles.bgColor));
    }
    setTimeout(() => {
      viewerRef.current?.viewer?.Resize(parentDiv.current?.offsetWidth, parentDiv.current?.offsetHeight);
    }, 10);
    viewerRef.current.viewer.Render();
    window.viewer = viewerRef.current;
  }, [styles, modelSrc]);

  // resize if window is resized
  useEffect(() => {
    window.addEventListener("resize", () => {
      viewerRef.current?.viewer?.Resize(parentDiv.current?.offsetWidth, parentDiv.current?.offsetHeight);
    });
  }, []);


  return (
    <>
      <div
        ref={parentDiv}
        role={"img"}
        aria-label="Canvas showing the model in the 3D Viewer"
        className={`${(mouseControl && !isBackend) ? "" : "DMC"} ${viewerRef.current?.modelLoader?.inProgress} relative flex  flex-col items-center justify-center p-2 h-72 w-72 border-2 border-black rounded-sm online_3d_viewer`}
      >

      </div>
    </>
  );
};

export default Basic3DViewer;
