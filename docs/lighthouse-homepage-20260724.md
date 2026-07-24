# Production homepage Lighthouse receipt — 2026-07-24

- URL: <https://portfolio-site-seven-murex.vercel.app/>
- Fetch time: `2026-07-24T08:26:25.975Z`
- Lighthouse: `13.4.1`
- Performance: `92`
- Accessibility: `100`
- Best Practices: `100`
- SEO: `100`
- First Contentful Paint: `2.2 s`
- Largest Contentful Paint: `2.6 s`
- Total Blocking Time: `40 ms`
- Cumulative Layout Shift: `0`
- Speed Index: `4.5 s`

Command:

```sh
npx lighthouse https://portfolio-site-seven-murex.vercel.app \
  --output=json \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags='--headless --no-sandbox' \
  --quiet
```

This receipt describes the public Production alias while it served runtime merge commit
`c1c5a11bfc6057b92e521c19270f569a880d69c2` through successful GitHub Production deployment
`5585933491`. The raw report remained local and was not committed because it contains no additional
recruiter-facing evidence.
