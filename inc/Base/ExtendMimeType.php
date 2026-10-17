<?php

namespace BP3D\Base;

use BP3D\Helper\Utils;

if (!defined('ABSPATH')) {
    exit;
}

class ExtendMimeType
{

    public function register()
    {
        add_filter('upload_mimes', [$this, 'bplugins_stp_mime_types']);
        add_filter('wp_check_filetype_and_ext', [$this, 'bplugins_stp_add_allow_upload_extension_exception'], 10, 5);
        add_action('wp_enqueue_media', [$this, 'restrictModelPickerUploads']);
    }

    /**
     * A media frame whose library is filtered to models (Utils::modelLibraryTypes(), or the block's model/* list) refuses other files on upload too,
     * instead of uploading them and hiding them from the frame.
     */
    public function restrictModelPickerUploads(): void
    {
        $extensions = Utils::modelExtensions();
        // The Advanced viewer's other formats too: the server still decides what may be uploaded, so this never blocks more than it does.
        $accepted = array_values(array_unique(array_merge($extensions, ['ply', 'off', '3dm', 'amf', 'ifc', 'brep', 'brp', 'iges', 'igs', 'stp', 'fcstd', 'bim'])));
        $settings = [
            'extensions' => implode(',', $accepted),
            'accept' => '.' . implode(',.', $accepted),
            'types' => Utils::modelLibraryTypes(),
            'title' => __('3D models', '3d-viewer'),
            /* translators: %s: comma-separated list of 3D model file extensions. */
            'message' => sprintf(__('This is not a 3D model file. Upload one of: %s.', '3d-viewer'), strtoupper(implode(', ', $accepted))),
        ];

        wp_add_inline_script('media-views', '(function (media, settings) {
    var Select = media && media.view && media.view.MediaFrame && media.view.MediaFrame.Select;
    if (!Select || !window.plupload) return;
    var initialize = Select.prototype.initialize;
    Select.prototype.initialize = function () {
        initialize.apply(this, arguments);
        // Only frames filtered to 3D files alone; the block filters by the ticked formats (model/gltf-binary, ...) rather than by `model`.
        var types = [].concat((this.options.library && this.options.library.type) || []);
        var isModel = function (t) { return t === "model" || String(t).indexOf("model/") === 0; };
        if (!types.some(isModel) || !types.every(function (t) { return isModel(t) || settings.types.indexOf(t) > -1; })) return;
        this.on("open", function () {
            var wpUploader = this.uploader && this.uploader.uploader;
            var up = wpUploader && wpUploader.uploader;
            if (!up || !up.setOption) return;
            var $frame = this.$el;
            var accept = function () {
                $frame.find("input[type=file]").attr("accept", settings.accept);
            };
            up.setOption("filters", Object.assign({}, up.getOption("filters"), { mime_types: [{ title: settings.title, extensions: settings.extensions }] }));
            accept();
            if (up.bp3dModelOnly) return;
            up.bp3dModelOnly = true;
            // The file input is created once the uploader initialises, after the frame opens.
            up.bind("PostInit Refresh", accept);
            // Runs before the core handler, whose message for this reads like a server fault.
            up.bind("Error", function (uploader, error) {
                if (error.code !== window.plupload.FILE_EXTENSION_ERROR) return;
                window.wp.Uploader.errors.unshift({ message: settings.message, data: error, file: error.file });
                wpUploader.error(settings.message, error, error.file);
                return false;
            }, null, 100);
        }, this);
    };
})(window.wp && window.wp.media, ' . wp_json_encode($settings) . ');');
    }

    public function getActiveMimeTypes()
    {
        return Utils::getAllowedMimeTypes();
    }

    private function getFilteredMimeTypes(): array
    {
        $all_mimes = $this->getMimeTypes();
        $allowed_keys = $this->getActiveMimeTypes();

        $filtered = [];
        foreach ($allowed_keys as $key) {
            if (isset($all_mimes[$key])) {
                $filtered[$key] = $all_mimes[$key];
            }
        }
        return $filtered;
    }

    public function bplugins_stp_mime_types($mimes)
    {
        return wp_parse_args($mimes, $this->getFilteredMimeTypes());
    }

    public function bplugins_stp_add_allow_upload_extension_exception($data, $file, $filename, $mimes, $real_mime = null)
    {
        // If file extension is 2 or more 
        $f_sp = explode(".", $filename);
        $f_exp_count = count($f_sp);

        if ($f_exp_count <= 1) {
            return $data;
        }

        $ext = strtolower($f_sp[$f_exp_count - 1]);

        $extendedMimes = $this->getFilteredMimeTypes();

        if (isset($extendedMimes[$ext])) {
            // A caller with its own narrower allow-list (another plugin's uploader) keeps core's decision.
            if (!self::extensionAllowed($ext, is_array($mimes) ? $mimes : get_allowed_mime_types())) {
                return $data;
            }

            // A denial has to be spelled out: `$data` carries what core already
            // decided, and core accepts these names because the upload_mimes
            // filter above registered the extension. Returning it would pass
            // the file through rather than block it.
            $reject = ['ext' => false, 'type' => false, 'proper_filename' => false];

            // Hardening: Stop double-extension execution bypass (e.g. script.php.glb)
            $dangerous_extensions = [
                'php', 'php3', 'php4', 'php5', 'php7', 'php8', 
                'phtml', 'phar', 'cgi', 'pl', 'py', 'asp', 'aspx', 
                'jsp', 'exe', 'bat', 'cmd', 'sh', 'js', 'html', 'htm'
            ];
            for ($i = 0; $i < $f_exp_count - 1; $i++) {
                if (in_array(strtolower($f_sp[$i]), $dangerous_extensions, true)) {
                    return $reject;
                }
            }

            // Hardening: Prevent execution bypass if Magic Mime engine matches PHP
            if ($real_mime !== null && strpos(strtolower($real_mime), 'php') !== false) {
                return $reject;
            }

            // Hardening: markup renamed to a model extension would be sniffed as HTML/SVG when served without a content type.
            if (self::isMarkup($file, $real_mime)) {
                return $reject;
            }

            $type = $extendedMimes[$ext];
            $proper_filename = '';
            return compact('ext', 'type', 'proper_filename');
        }
        return $data;
    }

    private function getMimeTypes(): array
    {
        return Utils::SUPPORTED_MIME_TYPES;
    }

    /** Whether $ext is in a core-style mime map whose keys may be `jpg|jpeg|jpe`. */
    private static function extensionAllowed(string $ext, array $mimes): bool
    {
        foreach (array_keys($mimes) as $exts) {
            if (in_array($ext, explode('|', strtolower((string) $exts)), true)) {
                return true;
            }
        }
        return false;
    }

    private static function isMarkup(string $file, ?string $real_mime): bool
    {
        $markup = ['text/html', 'application/xhtml+xml', 'image/svg+xml', 'application/javascript', 'application/x-javascript', 'text/javascript', 'application/ecmascript'];
        if ($real_mime !== null && in_array(strtolower($real_mime), $markup, true)) {
            return true;
        }

        $head = is_readable($file) ? (string) file_get_contents($file, false, null, 0, 1024) : '';
        $utf16 = (bool) preg_match('/^(\xFF\xFE|\xFE\xFF|<\x00|\x00<)/', $head);
        if ($utf16) {
            $head = str_replace("\0", '', $head);
        }

        if (preg_match(self::MARKUP_TAGS, $head)) {
            return true;
        }

        // Served as XML, a model (DAE) is parsed to the end, so it is checked to the end; binary models only face sniffing, which reads the head.
        $text = ltrim((string) preg_replace('/^(\xEF\xBB\xBF|\xFF\xFE|\xFE\xFF)/', '', $head));
        return '' !== $text && '<' === $text[0] && self::xmlHasMarkup($file, $utf16);
    }

    /** Tags no 3D format uses, with or without a namespace prefix (<h:script>); XML models (DAE) have none of them. */
    private const MARKUP_TAGS = '/<\s*(!doctype\s+html|(?:[\w.-]+:)?(html|body|script|iframe|svg|object|embed|img|div|style|a\s+href))\b/i';

    /** Namespaces whose elements a browser renders or runs inside an XML document. */
    private const ACTIVE_XML_NAMESPACES = [
        'http://www.w3.org/1999/xhtml',
        'http://www.w3.org/2000/svg',
        'http://www.w3.org/1998/Math/MathML',
        'http://www.w3.org/1999/XSL/Transform',
    ];

    private static function xmlHasMarkup(string $file, bool $utf16): bool
    {
        if (!class_exists('XMLReader')) {
            return self::rawXmlHasMarkup($file, $utf16);
        }

        $previous = libxml_use_internal_errors(true);
        libxml_clear_errors();
        $reader = new \XMLReader();
        $opened = @$reader->open($file, null, LIBXML_NONET);
        $found = false;
        if ($opened) {
            while (!$found && @$reader->read()) {
                $found = self::isActiveXmlNode($reader);
            }
            $reader->close();
        }
        // Where libxml gave up (a huge text node, bad bytes), a browser's parser may read on.
        $failed = !$opened || libxml_get_errors();
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        return $found || ($failed && self::rawXmlHasMarkup($file, $utf16));
    }

    private static function isActiveXmlNode(\XMLReader $reader): bool
    {
        switch ($reader->nodeType) {
            case \XMLReader::DOC_TYPE:
                // Its entities could spell out anything checked here.
                return true;
            case \XMLReader::PI:
                return 0 === strcasecmp($reader->name, 'xml-stylesheet');
            case \XMLReader::ELEMENT:
                if (in_array($reader->namespaceURI, self::ACTIVE_XML_NAMESPACES, true) || preg_match('/^(html|body|script|iframe|svg|object|embed)$/i', $reader->localName)) {
                    return true;
                }
                $active = false;
                while (!$active && $reader->moveToNextAttribute()) {
                    $declares = 'http://www.w3.org/2000/xmlns/' === $reader->namespaceURI && in_array($reader->value, self::ACTIVE_XML_NAMESPACES, true);
                    $active = $declares || (bool) preg_match('/^on[a-z]+$/i', $reader->localName);
                }
                $reader->moveToElement();
                return $active;
        }
        return false;
    }

    /** Pattern scan of the whole file, for when XMLReader is missing or stopped early. */
    private static function rawXmlHasMarkup(string $file, bool $utf16): bool
    {
        $handle = @fopen($file, 'rb');
        if (!$handle) {
            return false;
        }

        $active = '/<!ENTITY|<\?xml-stylesheet|<[\w:.-]+(?:\s[^<>]*?)?\s(?:[\w.-]+:)?on[a-z]+\s*=|http:\/\/www\.w3\.org\/(1999\/xhtml|2000\/svg|1998\/Math\/MathML|1999\/XSL\/Transform)/i';
        $found = false;
        $carry = '';
        while (!$found && !feof($handle)) {
            $chunk = (string) fread($handle, 1048576);
            $buffer = $carry . ($utf16 ? str_replace("\0", '', $chunk) : $chunk);
            // A PCRE failure (backtrack limit) counts as a match, so a crafted file cannot slip through.
            $found = 0 !== preg_match(self::MARKUP_TAGS, $buffer) || 0 !== preg_match($active, $buffer);
            // Overlap so a match split across two reads is still seen.
            $carry = substr($buffer, -4096);
        }
        fclose($handle);

        return $found;
    }
}

