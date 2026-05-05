<?php



namespace BP3D\Helper;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Block content helper.
 *
 * Provides utilities for retrieving and rendering Gutenberg block
 * content from posts by ID.
 */
class Block
{
    private static ?self $_instance = null;

    public static function instance(): self
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    /**
     * Get the raw post content for a given post ID.
     *
     * @param  int $id  Post ID
     * @return string Post content
     */
    public static function get(int $id): string
    {
        $post = get_post($id);

        return $post ? $post->post_content : '';
    }

    /**
     * Parse and return the first block from a post's content.
     *
     * @param  int $id  Post ID
     * @return array<string, mixed> Parsed block data
     */
    public static function getBlock(int $id): array
    {
        $blocks = parse_blocks(self::get($id));

        return $blocks[0] ?? [];
    }

    /**
     * Render the first block from a post's content.
     *
     * @param  int $id  Post ID
     * @return string Rendered block HTML
     */
    public function render_block(int $id): string
    {
        $block = self::getBlock($id);

        if (empty($block)) {
            return '';
        }

        return render_block($block);
    }
}