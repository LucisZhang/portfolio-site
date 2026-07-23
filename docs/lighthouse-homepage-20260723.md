# Production homepage Lighthouse receipt — 2026-07-23

- URL: <https://portfolio-site-seven-murex.vercel.app/>
- Fetch time: `2026-07-23T08:53:20.194Z`
- Lighthouse: `13.4.1`
- Performance: `98`
- Accessibility: `100`
- Best Practices: `100`
- SEO: `100`
- First Contentful Paint: `1.3 s`
- Largest Contentful Paint: `2.2 s`
- Total Blocking Time: `50 ms`
- Cumulative Layout Shift: `0`
- Speed Index: `2.1 s`
- Raw JSON SHA-256:
  `669b7fee14bb7ff7fb0f7a43343446b27cc489639847c84127b5b6a9bd486fbd`

Command:

```sh
npx lighthouse https://portfolio-site-seven-murex.vercel.app \
  --output=json \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags='--headless --no-sandbox' \
  --quiet
```

This receipt describes the public Production alias while it resolved to runtime deployment
`dpl_8U7hHXby6Az4iwLrM81n84Ga2CcP`, whose runtime Git merge commit is
`468f31ba1ce196348caa5e30a76b11ed46a609d4`.
