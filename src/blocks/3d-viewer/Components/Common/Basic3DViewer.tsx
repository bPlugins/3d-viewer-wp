import { useEffect, useRef, useState } from "react";

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
  const { styles, O3DVSettings = {}, model, isBackend } = attributes;
  const { mouseControl, zoom = true } = O3DVSettings;
  const currentModel = model;

  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const parentDiv = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {

    if (modelSrc && typeof window.OV !== 'undefined') {
      viewerRef.current?.Destroy();
      viewerRef.current?.canvas?.remove();
      viewerRef.current = null;


      if (viewerRef.current === null) {
        const rgb = hexToRGB(styles.bgColor) || { r: 255, g: 255, b: 255, a: 255 };
        instanceRef.current = new window.OV.EmbeddedViewer(parentDiv.current, {
          backgroundColor: new window.OV.RGBAColor(rgb.r, rgb.g, rgb.b, rgb.a),
          environmentSettings: new window.OV.EnvironmentSettings([posx, negx, posy, negy, posz, negz], false),
        });

        const models = [modelSrc?.replace(/https?:/, window.location.protocol)];
        instanceRef.current.LoadModelFromUrlList(models);
        viewerRef.current = instanceRef.current;
        window.VR = instanceRef.current;
        setViewerLoaded(true);

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
        viewerRef.current.viewer?.renderer?.resetState();
        viewerRef.current.viewer?.Clear();
        if (viewerRef.current.viewer) {
          delete viewerRef.current.viewer;
        }
        const gl = viewerRef.current.canvas?.getContext("webgl2");
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
        const tempClone = viewerRef.current.canvas?.cloneNode(true);
        if (tempClone && viewerRef.current.canvas?.parentNode) {
          viewerRef.current.canvas.parentNode.replaceChild(tempClone, viewerRef.current.canvas);
        }
        if (parentDiv.current && parentDiv.current.children.length > 0) {
          parentDiv.current.removeChild(parentDiv.current.children[0]);
        }
        viewerRef.current.canvas?.parentNode?.removeChild(viewerRef.current.canvas);
        viewerRef.current.canvas?.remove();
        viewerRef.current = null;
        setViewerLoaded(false);
      }
    };
  }, [modelSrc, currentModel, viewerLoaded]);

  useEffect(() => {
    if (viewerRef.current?.viewer) {
      const rgb = hexToRGB(styles.bgColor);
      if (rgb && typeof window.OV !== 'undefined') {
        const ovColor = new window.OV.RGBAColor(rgb.r, rgb.g, rgb.b, rgb.a);
        viewerRef.current.viewer.SetBackgroundColor(ovColor);
      }
      setTimeout(() => {
        if (viewerRef.current?.viewer && parentDiv.current) {
          viewerRef.current.viewer.Resize(parentDiv.current.offsetWidth, parentDiv.current.offsetHeight);
          viewerRef.current.viewer.Render();
        }
      }, 10);
      window.viewer = viewerRef.current;
    }
  }, [styles, modelSrc]);

  // Resize when container size changes (e.g. tab becomes active/visible, or window is resized)
  useEffect(() => {
    if (!parentDiv.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (viewerRef.current?.viewer && parentDiv.current) {
          const w = parentDiv.current.offsetWidth || width;
          const h = parentDiv.current.offsetHeight || height;
          if (w > 0 && h > 0) {
            viewerRef.current.viewer.Resize(w, h);
            viewerRef.current.viewer.Render();
          }
        }
      }
    });

    observer.observe(parentDiv.current);
    return () => {
      observer.disconnect();
    };
  }, []);


  return (
    <>
      <div
        ref={parentDiv}
        role={"img"}
        aria-label="Canvas showing the model in the 3D Viewer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${(mouseControl && (!isBackend || hovered)) ? "" : "DMC"} ${viewerRef.current?.modelLoader?.inProgress} relative flex  flex-col items-center justify-center p-2 h-72 w-72 border-2 border-black rounded-sm online_3d_viewer`}
      >

      </div>
    </>
  );
};

export default Basic3DViewer;
