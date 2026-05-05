import { EventEmitter } from "bp-utils";
import { rgbaStringToFactor } from "../utils";

// --- Model Viewer Scene Graph Types ---

interface GltfImage {
  uri?: string;
  bufferView?: number;
  createThumbnail(width: number, height: number): Promise<string>;
  name?: string;
}

interface GltfTexture {
  source: GltfImage;
  name?: string;
}

interface TextureInfo {
  texture: GltfTexture | null;
  setTexture(texture: GltfTexture | null): void;
}

interface PBRMetallicRoughness {
  baseColorTexture: TextureInfo;
  metallicRoughnessTexture: TextureInfo;
  baseColorFactor: number[];
  metallicFactor: number;
  roughnessFactor: number;
  setBaseColorFactor(factor: number[]): void;
  setMetallicFactor(value: number): void;
  setRoughnessFactor(value: number): void;
}

interface SceneGraphMaterial {
  name: string;
  pbrMetallicRoughness: PBRMetallicRoughness;
  normalTexture: TextureInfo;
  emissiveTexture: TextureInfo;
  occlusionTexture: TextureInfo;
  emissiveFactor: number[];
  setEmissiveFactor(factor: number[]): void;
  ensureLoaded(): Promise<void>;
}

interface SceneGraphModel {
  materials: SceneGraphMaterial[];
  getMaterialByName(name: string): SceneGraphMaterial;
  thumbnailsById?: ThumbnailMap;
}

interface ThreeNode {
  isMesh: boolean;
  material?: ThreeMaterial;
  geometry?: { clone(): ThreeNode["geometry"] };
  traverse(callback: (node: ThreeNode) => void): void;
}

interface ThreeMaterial {
  clone(): ThreeMaterial;
  map?: { clone(): ThreeMaterial["map"]; needsUpdate: boolean };
}

// --- Thumbnail & Texture Types ---

interface ThumbnailEntry {
  objectUrl: string;
  texture: GltfTexture;
  size: number;
  id: string;
}

type ThumbnailMap = Map<string, ThumbnailEntry>;

interface TextureChannel {
  label: string;
  value: string;
}

interface SelectOption {
  label: string;
  value: string;
}

// --- Material Data Types ---

interface TextureRef {
  name: string | null;
  uri: string | null;
}

interface MaterialChannelData {
  texture: TextureRef;
  factor?: number[];
}

interface MaterialData {
  baseColor: MaterialChannelData;
  metallicRoughness: MaterialChannelData;
  normal: { texture: TextureRef };
  emissive: MaterialChannelData;
  occlusion: { texture: TextureRef };
}

type MaterialsDataMap = Record<string, MaterialData>;

// --- Applied Textures Types ---

interface AppliedTextureEntry {
  texture?: { name?: string; url?: string };
  factor?: number[] | string | null;
}

type AppliedChannelsMap = Record<string, AppliedTextureEntry>;
type AppliedTexturesMap = Record<string, AppliedChannelsMap>;

// --- ModelReader Class ---

class ModelReader extends EventEmitter {
  model: HTMLModelViewerElement;
  copy: (HTMLModelViewerElement & { thumbnailsById?: ThumbnailMap }) | null;
  thumbnailsById: ThumbnailMap;
  thumbnail_size: number;
  textures: Record<string, string>;
  texturesArray: string[];
  textureChannels: TextureChannel[];
  defaultMaterialData: MaterialsDataMap | null;
  initialized: boolean;
  sizes: Record<string, string>;
  readyCallbacks: Array<() => void>;
  isReady: boolean;
  modelUrl: string;

  constructor(model: HTMLModelViewerElement) {
    super()
    window.model = model;
    this.model = model;
    this.copy = null;
    this.thumbnailsById = new Map();
    this.thumbnail_size = 256;
    this.textures = {};
    this.texturesArray = [];
    this.textureChannels = [];
    this.defaultMaterialData = null;
    // this.init();
    this.initialized = false;
    this.sizes = {};
    this.readyCallbacks = [];
    this.isReady = false;
    this.modelUrl = "";

    if (this.model.loaded) {
      this.onLoad();
    } else {
      this.model.addEventListener("load", this.onLoad.bind(this));
    }
  }

  initialize(): void {
    this.isReady = true;
    this.readyCallbacks.forEach((callback) => callback());
    this.readyCallbacks = [];
  }

  onReady(callback: () => void): void {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  async onLoad(): Promise<void> {
    this.modelUrl = this.model.src;
    this.getDefaultMaterialData();

    this.thumbnailsById = await this.createThumbnails();

    if (window.pagenow) {
      const loaded = await this.loadModelWithoutAppending(this.model.src + "?" + Date.now()) as HTMLModelViewerElement & { thumbnailsById?: ThumbnailMap };
      this.copy = loaded;
      const thumbnailsById = await this.createThumbnails(new Map(), (this.copy as HTMLModelViewerElement).model?.materials);
      this.copy.thumbnailsById = thumbnailsById;
      this.dispatchEvent('ready');
    }
    this.initialize();
  }

  getTextureId(gltfImage: GltfImage): string {
    return gltfImage.uri ?? gltfImage.bufferView?.toString() ?? "";
  }

  /**
   * Retrieves stored textures, generating them if not already available.
   */
  async getTextures(): Promise<Record<string, string>> {
    if (Object.keys(this.textures).length === 0 && this.model) {
      await this.createThumbnails();
    }
    return this.textures;
  }

  async getBlobFileSize(blobUrl: string): Promise<number | null> {
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) throw new Error("Failed to fetch the Blob URL");

      const blob = await response.blob();
      return blob.size; // Size in bytes
    } catch (error) {
      console.error("Error getting Blob file size:", error);
      return null;
    }
  }

  /**
   * Stores texture thumbnails in the cache.
   */
  async pushThumbnail(thumbnailsById: ThumbnailMap, textureInfo: TextureInfo | null): Promise<string | null> {
    const { texture } = textureInfo || {};
    if (!texture || !texture.source) return null;

    const id = this.getTextureId(texture.source);
    if (!thumbnailsById.has(id)) {
      const objectUrl = await texture.source.createThumbnail(this.thumbnail_size, this.thumbnail_size);
      const size = await this.getBlobFileSize(objectUrl);
      thumbnailsById.set(id, { objectUrl, texture, size: size ?? 0, id });
      if (!this.textures[id]) {
        this.texturesArray.push(id);
        this.textures[id] = objectUrl;
        this.sizes[id + "_" + size] = objectUrl;
      }
    }
    return id;
  }

  async createThumbnails(
    thumbnailsById?: ThumbnailMap,
    materials: SceneGraphMaterial[] | undefined = this.model.model?.materials
  ): Promise<ThumbnailMap> {
    if (!thumbnailsById) {
      thumbnailsById = new Map();
    }
    for (const material of materials || []) {
      await material.ensureLoaded();
      const { pbrMetallicRoughness, normalTexture, emissiveTexture, occlusionTexture } = material;
      const { baseColorTexture, metallicRoughnessTexture } = pbrMetallicRoughness;
      await this.pushThumbnail(thumbnailsById, normalTexture);
      await this.pushThumbnail(thumbnailsById, emissiveTexture);
      await this.pushThumbnail(thumbnailsById, occlusionTexture);
      await this.pushThumbnail(thumbnailsById, baseColorTexture);
      await this.pushThumbnail(thumbnailsById, metallicRoughnessTexture);
    }
    return thumbnailsById;
  }

  getAllMaterialData(): MaterialsDataMap {
    if (!this.model.model) {
      console.warn("Model not loaded yet.");
      return {};
    }

    const materialsData: MaterialsDataMap = {};

    this.model.model.materials.forEach(async (material: SceneGraphMaterial) => {
      await material.ensureLoaded();

      const materialName = material.name || `Material_${Math.random().toString(36).substr(2, 5)}`;

      materialsData[materialName] = {
        baseColor: {
          texture: {
            name: material.pbrMetallicRoughness.baseColorTexture?.texture?.source.name || null,
            uri: material.pbrMetallicRoughness.baseColorTexture?.texture?.source.uri || null,
          },
          factor: material.pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1],
        },
        metallicRoughness: {
          texture: {
            name: material.pbrMetallicRoughness.metallicRoughnessTexture?.texture?.source.name || null,
            uri: material.pbrMetallicRoughness.metallicRoughnessTexture?.texture?.source.uri || null,
          },
          factor: [material.pbrMetallicRoughness.metallicFactor || 1, material.pbrMetallicRoughness.roughnessFactor || 1],
        },
        normal: {
          texture: {
            uri: material.normalTexture?.texture?.source.uri || null,
            name: material.normalTexture?.texture?.source.name || null,
          },
        },
        emissive: {
          texture: {
            name: material.emissiveTexture?.texture?.source.name || null,
            uri: material.emissiveTexture?.texture?.source.uri || null,
          },
          factor: material.emissiveFactor || [0, 0, 0],
        },
        occlusion: {
          texture: {
            name: material.occlusionTexture?.texture?.source.name || null,
            uri: material.occlusionTexture?.texture?.source.uri || null,
          },
        },
      };
    });

    return materialsData;
  }

  getDefaultMaterialData(): MaterialsDataMap | null {
    if (!this.defaultMaterialData) {
      this.defaultMaterialData = this.getAllMaterialData();
    }
    return this.defaultMaterialData;
  }

  /**
   * Updates the texture and factor of a material for a specific channel.
   */
  async updateMaterialTextureAndFactor(
    material: SceneGraphMaterial,
    channel: string,
    factor: number[] | string | null,
    textureUri: string | GltfTexture | null = null,
    textureName: string = `texture_${Date.now()}`
  ): Promise<void> {
    if (!this.model?.model || !material) {
      console.warn("Model or Material not found.");
      return;
    }

    if (factor) {
      if (channel === "baseColor") material.pbrMetallicRoughness.setBaseColorFactor(rgbaStringToFactor(factor as string));
      if (channel === "metallicRoughness") {
        const factorArr = factor as number[];
        material.pbrMetallicRoughness.setMetallicFactor(factorArr[0]);
        material.pbrMetallicRoughness.setRoughnessFactor(factorArr[1]);
      }
      if (channel === "emissive") material.setEmissiveFactor(rgbaStringToFactor(factor as string));
    }

    if (textureUri === "default") {
      if (channel.includes("base") || channel.includes("metallic")) {
        const copyMaterial = (this.copy as HTMLModelViewerElement).model?.getMaterialByName(material.name) as SceneGraphMaterial;
        const texture = (copyMaterial.pbrMetallicRoughness as Record<string, any>)[channel + "Texture"].texture;
        (material.pbrMetallicRoughness as Record<string, any>)[channel + "Texture"].setTexture(texture);
      } else {
        const copyMaterial = (this.copy as HTMLModelViewerElement).model?.getMaterialByName(material.name) as SceneGraphMaterial;
        const texture = (copyMaterial as Record<string, any>)[channel + "Texture"].texture;
        (material as Record<string, any>)[channel + "Texture"].setTexture(texture);
      }
      console.log(`Removed texture from '${channel}' of material '${material.name}'.`);
      return;
    }

    // Handle removing texture if textureUri is null
    if (!textureUri) {
      if (channel.includes("base") || channel.includes("metallic")) {
        (material.pbrMetallicRoughness as Record<string, any>)[channel + "Texture"].setTexture(null);
      } else {
        (material as Record<string, any>)[channel + "Texture"].setTexture(null);
      }
      console.log(`Removed texture from '${channel}' of material '${material.name}'.`);
      return;
    }

    // Create and apply new texture
    try {
      if (typeof textureUri === "string") {
        textureUri = await this.model.createTexture(textureUri) as GltfTexture;
        textureUri.name = textureName;
      }

      if (channel.includes("base") || channel.includes("metallic")) {
        (material.pbrMetallicRoughness as Record<string, any>)[channel + "Texture"].setTexture(textureUri);
      } else {
        (material as Record<string, any>)[channel + "Texture"].setTexture(textureUri);
      }

      console.log(`Applied new texture ${textureName} to '${channel}' of material '${material.name}'.`);
    } catch (error) {
      console.error("Error creating texture:", error);
    }
  }

  /**
   * Applies textures and factors to materials based on the provided applied textures object.
   */
  async applyTexture(
    appliedTextures: AppliedTexturesMap | null,
    materialName: string | null = null,
    channel: string | null = null
  ): Promise<void> {
    window.modelReader = this;
    if (!appliedTextures) return;

    if (materialName && channel) {
      const { name, url } = appliedTextures[materialName]?.[channel]?.texture || {} as { name?: string; url?: string };
      const material = this.model?.model?.getMaterialByName(materialName) as SceneGraphMaterial;
      let textureImage: string | GltfTexture | null = url || this.getTextureByName(name);
      if (!appliedTextures[materialName]?.[channel]?.texture) {
        textureImage = "default";
      }
      const factor = appliedTextures[materialName]?.[channel]?.factor || null;
      this.updateMaterialTextureAndFactor(material, channel, factor as number[] | string | null, textureImage, name);
      return;
    }

    Object.entries(appliedTextures).forEach(([matName, channels]: [string, AppliedChannelsMap]) => {
      const material = this.model?.model?.getMaterialByName(matName) as SceneGraphMaterial | undefined;
      if (!material) {
        console.warn(`Material '${matName}' not found.`);
        return;
      }

      Object.keys(channels).forEach((ch: string) => {
        const { name, url } = channels[ch]?.texture || {} as { name?: string; url?: string };
        let textureImage: string | GltfTexture | null = url || this.getTextureByName(name);
        if (!channels[ch]?.texture) {
          textureImage = "default";
        }
        const factor = channels[ch]?.factor || null;

        this.updateMaterialTextureAndFactor(material, ch, factor as number[] | string | null, textureImage, name);
      });
    });
  }

  async shakeMaterialFactor(material: SceneGraphMaterial | string, duration: number = 500): Promise<void> {
    if (!material) return;
    if (typeof material === "string") {
      material = this.getMaterialByName(material);
    }
    const originalFactor = material.pbrMetallicRoughness.baseColorFactor.slice();
    material.pbrMetallicRoughness.setBaseColorFactor([1, 0, 0, 1]);
    setTimeout(() => {
      (material as SceneGraphMaterial).pbrMetallicRoughness.setBaseColorFactor(originalFactor);
    }, duration);
  }

  /**
   * Retrieves the URI of a texture by name.
   */
  getTextureURIByName(name: string): string | null {
    return name.includes("blob") ? name : this.textures[name] || null;
  }

  getMaterialByName(name: string): SceneGraphMaterial {
    return this.model.model.getMaterialByName(name);
  }

  getTexturesArray(): string[] {
    return this.texturesArray;
  }

  getTextureChannels(): TextureChannel[] {
    return [
      {
        label: "Base Color",
        value: "baseColor",
      },
      {
        label: "Metallic Roughness",
        value: "metallicRoughness",
      },
      {
        label: "Normal Map",
        value: "normal",
      },
      {
        label: "Emissive",
        value: "emissive",
      },
      {
        label: "Occlusion",
        value: "occlusion",
      },
    ];
  }

  getMaterialsNameForSelectControl(): SelectOption[] {
    if (!this.model.loaded) {
      console.warn("Model not loaded yet");
      return [];
    }
    if (Array.isArray(this.model.model.materials)) {
      return [{ label: 'None', value: '' }, ...this.model.model.materials.map((item: SceneGraphMaterial) => {
        //@ts-ignore
        const label = item.name.replace("_mtl", "").replaceAll("_", " ");
        return { label, value: item.name };
      })];
    }
    return [];
  }

  getFirstMaterialName(): string | null {
    if (!this.model.loaded || !this.model.model) {
      console.warn("Model not loaded yet");
      return null;
    }
    if (Array.isArray(this.model.model.materials)) {
      return this.model.model.materials[0].name;
    }
    return null;
  }

  getTextureById(textureId: string): ThumbnailEntry | undefined {
    return this.thumbnailsById.get(textureId);
  }

  async downloadTexture(textureId: string, size: number = 512): Promise<void> {
    const entry = this.getTextureById(textureId);
    const texture = entry?.texture ?? null;
    if (!texture) {
      console.error("Texture not found!");
      return;
    }
    const objectUrl = await texture.source.createThumbnail(size, size);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = objectUrl;

    image.onload = () => {
      ctx.drawImage(image, 0, 0, size, size);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `texture_${textureId}.png`;
      link.click();
    };

    image.onerror = () => {
      console.error("Failed to load texture image.");
    };
  }

  deepCloneModel(): ThreeNode {
    const clonedModel: ThreeNode = this.model.originalModel.clone(true);

    clonedModel.traverse((node: ThreeNode) => {
      if (node.isMesh) {
        if (node.material) {
          node.material = node.material.clone();
        }

        if (node.geometry) {
          node.geometry = node.geometry.clone();
        }

        if (node.material?.map) {
          node.material.map = node.material.map.clone();
          if (node.material.map) {
            node.material.map.needsUpdate = true;
          }
        }
      }
    });

    return clonedModel;
  }

  async loadModelWithoutAppending(src: string): Promise<HTMLModelViewerElement> {
    return new Promise((resolve, reject) => {
      const modelViewer = document.createElement("model-viewer") as unknown as HTMLModelViewerElement;
      modelViewer.src = src;
      modelViewer.setAttribute("loading", "eager");
      modelViewer.style.display = "none";
      modelViewer.style.height = "0";
      document.body.appendChild(modelViewer as unknown as HTMLElement);

      modelViewer.addEventListener("load", () => {
        resolve(modelViewer);
      });

      modelViewer.addEventListener("error", (e: Event) => {
        reject(new Error(`Model failed to load: ${(e as ErrorEvent).message}`));
      });
    });
  }

  /**
   * Retrieves the texture by name from the copy or thumbnails.
   */
  getTextureByName(textureName: string | undefined): GltfTexture | null {
    if (!textureName) return null;

    try {
      if (this.copy?.thumbnailsById) {
        return this.copy.thumbnailsById.get(textureName)?.texture ?? null;
      }
      if (this.thumbnailsById) {
        return this.thumbnailsById.get(textureName)?.texture ?? null;
      }
    } catch (error) {
      console.error((error as Error).message, textureName);
    }
    return null;
  }

  createCopy(): void {
    // const
  }
}

export default ModelReader;
