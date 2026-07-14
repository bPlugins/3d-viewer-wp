<?php
/**
 * Deletes all content created by the e2e suite (titles prefixed "E2E-3DV").
 * Run via: npm run test:e2e:clean   (studio wp eval-file …)
 */

$post_types = ['post', 'page', 'bp3d-model-viewer', 'attachment', 'product'];

$q = new WP_Query([
    'post_type'      => $post_types,
    'post_status'    => 'any',
    's'              => 'E2E-3DV',
    'posts_per_page' => 200,
    'fields'         => 'ids',
]);

$deleted = 0;
foreach ($q->posts as $id) {
    $title = get_the_title($id);
    if (strpos($title, 'E2E-3DV') !== 0) {
        continue; // only delete our own prefixed content
    }
    wp_delete_post($id, true);
    $deleted++;
}

// E2E media uploads (attachment titles/filenames starting with e2e-)
$media = new WP_Query([
    'post_type'      => 'attachment',
    'post_status'    => 'any',
    'posts_per_page' => 200,
    'fields'         => 'ids',
    's'              => 'e2e-cube',
]);
foreach ($media->posts as $id) {
    wp_delete_attachment($id, true);
    $deleted++;
}

WP_CLI::success("Deleted {$deleted} e2e items.");
