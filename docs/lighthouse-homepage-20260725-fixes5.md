# Production homepage Lighthouse receipt — fixes5

- URL: <https://portfolio-site-seven-murex.vercel.app/>
- Verification time: `2026-07-25 00:02 Asia/Shanghai` / `2026-07-24 16:02 UTC`
- Lighthouse: `13.4.1`
- Performance: `98`
- Accessibility: `100`
- Best Practices: `100`
- SEO: `100`
- First Contentful Paint: `1.5 s`
- Largest Contentful Paint: `1.5 s`
- Total Blocking Time: `30 ms`
- Cumulative Layout Shift: `0`

Command:

```sh
npx lighthouse https://portfolio-site-seven-murex.vercel.app \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json \
  --chrome-flags='--headless --no-sandbox --disable-gpu' \
  --quiet
```

This receipt describes the public Production alias while it served runtime merge commit
`29466dd7e0f11f9a69db3d87694929e03287ceb1` through Ready Vercel deployment
`dpl_8twyKAbaEJMiqUgFKx8Pwb18xgLV`. The raw JSON report remained local because it adds no
recruiter-facing evidence beyond this public-safe summary.
