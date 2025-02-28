# xFoundry Logo Files

This directory contains SVG logo files for the xFoundry application.

## Available Logo Files

The following SVG files are available in this directory:

1. `xFoundry Blue 900 (1).svg` - Full horizontal logo with text in blue
2. `xFoundry Logo.svg` - Full horizontal logo with text in white
3. `X Icon Blue.svg` - X icon only in blue
4. `X Icon White.svg` - X icon only in white

## SVG Requirements

For best results:
- Use clean, optimized SVG files
- Ensure SVGs have appropriate viewBox attributes
- Remove any unnecessary metadata or comments
- Test that they scale properly at different sizes

## Using the Logos

After adding these files, update the Logo component in `/components/Logo.js`:
1. Uncomment the `<object>` tag section for SVG usage, or
2. Uncomment the `<Image>` component section for Next.js Image optimization

## Why SVG?

SVG files are preferred over PNG because they:
- Scale perfectly to any size without losing quality
- Have smaller file sizes
- Load faster
- Look crisp on all screen resolutions and devices
- Can be styled with CSS
- Work well with dark/light mode