export const slugify = (text) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// Returns `base`, or `base-2`, `base-3`... whichever is not taken yet.
export const uniqueSlug = async (Model, title) => {
    const base = slugify(title) || 'post';
    let slug = base;
    let n = 1;
    while (await Model.exists({ slug })) {
        n += 1;
        slug = `${base}-${n}`;
    }
    return slug;
};
