# 3D Viewer — Guided Setup Video Script

A 75-second screencast for **step 1 of the guided setup wizard** (`src/admin/onboarding/steps.tsx`, the `welcome` step). It answers the only question a brand-new user has: *what does this plugin do, and what do I click first?*

Everything below is checked against the real UI — menu items, field labels, and the shortcode format are quoted exactly as they appear in 1.9.1. Say them the way the screen says them; a video that renames things is worse than no video.

- **Runtime:** 75 s (a 45 s cut is at the end)
- **Voiceover:** ~185 words, unhurried
- **Frame:** 1920×1080, WP admin at 100 % zoom, browser chrome cropped out
- **Where it plays:** inside the wizard, in a modal, on click — so it must work with the sound off

---

## Shot list

| Time | On screen | Voiceover | Caption |
|---|---|---|---|
| **0:00–0:07** | Published page, front end. Cursor drags a chair model round 180°, scrolls to zoom. No admin UI yet. | "This is a 3D model living on a WordPress page. Your visitors can spin it, zoom in, and look at it from any angle." | *Interactive 3D — no plugin knowledge needed* |
| **0:07–0:14** | Cut to admin. Click **3D Viewer** in the sidebar, then **Add New**. | "Here's how it got there. In the 3D Viewer menu, click Add New." | `3D Viewer › Add New` |
| **0:14–0:27** | Title field: type "Relaxation Chair". In the **3D Viewer Settings** box, **Model** tab, click **Upload Source** and pick a `.glb` from the media library. The live preview panel fills with the model. | "Give it a name, then upload your file under 3D Source. GLB and GLTF work straight away — for STL, OBJ, or FBX, switch the format on first in 3D Viewer, Settings." | *GLB · GLTF ready · more formats in Settings* |
| **0:27–0:36** | **Settings** tab of the same box. Toggle **Moving Controls**, **Enable Zoom**, **Full Screen Button**; the preview reacts. | "The Settings tab controls how visitors interact — rotating, zooming, fullscreen. Watch the preview as you go." | — |
| **0:36–0:45** | Click **Publish**. Cut to the models list; highlight the **ShortCode** column and click copy — `[3d_viewer id="12"]` lands on the clipboard. | "Publish, and your model gets a shortcode. Paste it into any post, page, or widget." | `[3d_viewer id="12"]` |
| **0:45–0:58** | New page in the block editor. Type `/3D Model Viewer`, insert the block, choose the same file, tweak one option in the sidebar. | "Prefer blocks? Type slash, 3D Model Viewer, and build it right in the editor. Elementor users get a Model Viewer widget that works the same way." | *Gutenberg · Elementor · Shortcode* |
| **0:58–1:07** | Split or quick cut: the published page with the model spinning, then a WooCommerce product page where the 3D viewer sits in place of the product image. | "It's responsive, works on mobile, and on a WooCommerce store it can replace the product image entirely." | — |
| **1:07–1:15** | Back in the admin: hover **Help & Demos**, then the wizard's **Continue** button. | "That's the whole thing. Live demos are under Help and Demos — now let's finish setting you up." | *Continue the setup ›* |

---

## Recording checklist

- **Model:** something recognisable and light — a chair, a shoe, a camera. Under 5 MB so nothing stalls on screen. Avoid a spinning cube; it reads as a tech demo, not a product.
- **Clean site:** a fresh install with a default theme. No other plugin notices in the frame, and no half-finished content in the models list.
- **Cursor:** enable click highlighting. Move deliberately — a viewer is following your pointer, not your intent.
- **Cuts over waiting:** never film an upload progress bar or a page load. Cut to the finished state.
- **Blur:** the site URL and any admin username if the recording site isn't a throwaway.
- **No music.** The clip plays inside an admin screen; a backing track is startling there.
- **Captions burned in.** Most people open this with the sound off — the captions column above is the minimum, and a full subtitle track is better.

---

## 45-second cut

Same footage, for a tighter attention budget. Drop the Settings-tab shot and the WooCommerce shot:

1. **0:00–0:07** — front-end model, dragged and zoomed. *"This is a 3D model on a WordPress page — visitors can spin it and zoom in."*
2. **0:07–0:22** — 3D Viewer › Add New, upload the file, preview fills in. *"In the 3D Viewer menu, click Add New and upload your file. GLB and GLTF work straight away; other formats switch on in Settings."*
3. **0:22–0:34** — Publish, copy `[3d_viewer id="12"]`. *"Publish, and you get a shortcode to paste anywhere — or use the 3D Model Viewer block instead."*
4. **0:34–0:45** — published page, then Continue. *"That's it. Let's finish setting you up."*

---

## Attaching it to the wizard

The welcome step currently inherits `media.video` — the marketing clip on the Help & Demos page. Giving it its own `video` overrides that:

```tsx
{
    key: 'welcome',
    title: __('Welcome to 3D Viewer', '3d-viewer'),
    video: {
        url: 'https://youtu.be/YOUR_ID',
        isYoutube: true,
        title: __('3D Viewer — 75-second setup', '3d-viewer')
    },
    // …
}
```

The step shows a poster thumbnail and only loads the player when the user clicks, so YouTube is never contacted until they ask to watch. `poster` is optional — without it, a YouTube video falls back to its own `hqdefault` thumbnail.

Remove the `video` property and the step quietly falls back to the marketing clip again, so nothing breaks if the asset moves.
