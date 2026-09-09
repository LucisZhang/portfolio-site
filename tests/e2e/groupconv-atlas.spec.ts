import { test, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { getProject, featuredProjects, tracks } from '../../src/lib/projects';
import { searchPortfolio } from '../../src/lib/portfolio-search';
import { recruiterQuestionsByRoute } from '../../src/data/recruiter-content';
import { circuitGroups } from '../../src/lib/site-circuit';
import questionBank from '../../src/data/generated/ask-question-bank.json';

test('GroupConv route, navigation, questions and measured evidence', () => {
  const project = getProject('ai', 'groupconv-atlas');
  assert.ok(project);
  assert.ok(featuredProjects.some(p => p.slug === project.slug));
  assert.ok(circuitGroups.some(group => group.members.includes(project.slug)));
  assert.equal(project.repository.status, 'public');
  assert.equal(project.repository.href, 'https://github.com/LucisZhang/groupconv-atlas');
  for (const locale of ['en', 'zh'] as const) {
    assert.equal(recruiterQuestionsByRoute['/projects/groupconv-atlas'][locale].length, 4);
  }

  const summary = JSON.parse(fs.readFileSync('src/data/groupconv-summary.json', 'utf8'));
  for (const baseline of ['k0', 'torch_cuda_tuned']) {
    const shapes = summary.rows
      .filter((row: { baseline: string }) => row.baseline === baseline)
      .reduce((total: number, row: { shapes: number }) => total + row.shapes, 0);
    assert.equal(shapes, 80);
  }
  assert.equal(summary.record_count, 480);
  assert.deepEqual(summary.status_counts, { PASS: 430, UNSUPPORTED: 50 });

  const current = JSON.parse(fs.readFileSync('public/case-studies/groupconv-atlas/rtx4090-atlas.json', 'utf8'));
  const details = JSON.parse(fs.readFileSync('public/case-studies/groupconv-atlas/map-details.json', 'utf8'));
  assert.equal(details.shapes.length, 80);
  for (const row of details.comparisons) {
    const original = current.comparisons.find((comparison: {
      shape_id: string; baseline: string; candidate: string; boundary: string;
    }) => comparison.shape_id === row.shape_id
      && comparison.baseline === row.baseline
      && comparison.candidate === row.candidate
      && comparison.boundary === row.boundary);
    assert.ok(original);
    assert.equal(row.ratio, original.ratio);
    assert.deepEqual(row.ci95, original.ci95);
    assert.equal(row.classification, original.candidate_status === 'UNSUPPORTED' ? 'UNSUPPORTED' : original.classification);
  }
  assert.equal(current.audit_status, 'PASS');
  assert.equal(current.measurement_status, 'COMPLETE');
  assert.ok(current.comparisons.filter((row: { ratio?: number }) => row.ratio)
    .every((row: { batch_count: number }) => row.batch_count === 10));

  const provenance = JSON.parse(fs.readFileSync('public/case-studies/groupconv-atlas/provenance.json', 'utf8'));
  for (const [file, hash] of Object.entries(provenance.files)) {
    const raw = fs.readFileSync(`public/case-studies/groupconv-atlas/${file}`);
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), hash, file);
    assert.ok(!raw.toString().includes('/Users/'), file);
    assert.ok(!raw.toString().includes('/root/'), file);
  }
});

for (const query of ['CUDA grouped convolution', '分组卷积', '分組卷積', 'fenzujuanji', 'GPU 算子优化']) {
  test(`GroupConv search: ${query}`, () => {
    const rows = searchPortfolio(query, tracks, featuredProjects, 'zh');
    assert.equal(rows[0]?.id, 'groupconv-atlas');
  });
}

for (const locale of ['en', 'zh'] as const) {
  test(`GroupConv ${locale} exposes the timing decision and all measured shapes`, async ({ page }) => {
    await page.goto(`/projects/groupconv-atlas?lang=${locale}`);
    await expect(page.locator('#project-title')).toBeVisible();
    await expect(page.locator('[data-exhibit]')).toHaveCount(4);
    const tools = page.locator('.project-rail-tools');
    await expect(tools).toBeVisible();
    const toolsRect = await tools.boundingBox();
    const circuitRect = await page.locator('.circuit-top').boundingBox();
    assert.ok(toolsRect && circuitRect);
    assert.ok(
      toolsRect.x + toolsRect.width <= circuitRect.x
      || toolsRect.y + toolsRect.height <= circuitRect.y
      || toolsRect.y >= circuitRect.y + circuitRect.height,
      'Rail utilities must not overlap circuit navigation',
    );
    const atlas = page.getByTestId('groupconv-atlas');
    const cells = atlas.locator('button[data-state]');
    await expect(cells).toHaveCount(80);
    await expect(atlas.getByRole('table')).not.toBeVisible();

    for (const [state, count] of Object.entries({ WIN: 34, LOSS: 35, TIE: 6, UNCERTAIN: 5 })) {
      await expect(atlas.getByTestId(`atlas-count-${state}`)).toHaveText(String(count));
    }
    const detail = atlas.getByTestId('atlas-detail');
    await expect(detail.getByRole('heading')).toHaveText('N 1 · 7 × 7 · cpg 8');
    await expect(detail).toContainText('1.705×');
    await expect(detail).toContainText('0.764×');
    await expect(detail.locator('[data-state="WIN"]')).toHaveCount(1);
    await expect(detail.locator('[data-state="LOSS"]')).toHaveCount(1);

    await atlas.getByTestId('atlas-api').click();
    await expect(atlas.getByTestId('atlas-api')).toHaveAttribute('aria-pressed', 'true');
    for (const [state, count] of Object.entries({ WIN: 27, LOSS: 50, TIE: 2, UNCERTAIN: 1 })) {
      await expect(atlas.getByTestId(`atlas-count-${state}`)).toHaveText(String(count));
    }
    await expect(detail.getByRole('heading')).toHaveText('N 1 · 7 × 7 · cpg 8');
    await atlas.getByLabel(locale === 'zh' ? '比较对象' : 'Comparison', { exact: true }).selectOption('k0');
    await atlas.getByLabel(locale === 'zh' ? '候选实现' : 'Candidate', { exact: true }).selectOption('k2');
    await expect(cells).toHaveCount(80);
    await expect(cells.filter({ hasText: '—' })).toHaveCount(50);
    await expect(atlas.getByTestId('atlas-count-UNSUPPORTED')).toHaveText('50');
    await atlas.locator('summary').click();
    await expect(atlas.getByRole('table')).toBeVisible();
    await expect(atlas.locator('tbody tr')).toHaveCount(80);
    await expect(atlas.getByRole('cell', { name: 'UNSUPPORTED', exact: true })).toHaveCount(50);
    await expect(page.locator('a[download]')).toHaveAttribute('href', '/case-studies/groupconv-atlas/rtx4090-atlas.json');
  });

  test(`GroupConv ${locale} module selection keeps both timing boundaries visible`, async ({ page }) => {
    await page.goto(`/projects/groupconv-atlas?lang=${locale}#exhibit-03`);
    const block = page.locator('#exhibit-03');
    await expect(block.getByRole('button', { name: 'N=4', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(block).toContainText('1.13849×');
    await expect(block).toContainText('0.67902×');
    await expect(block.locator('[data-state="WIN"]')).toHaveCount(1);
    await expect(block.locator('[data-state="LOSS"]')).toHaveCount(1);
    await block.getByRole('button', { name: 'N=1', exact: true }).click();
    await expect(block).toContainText('1.04879×');
    await expect(block).toContainText('0.66465×');
    await expect(block.locator('[data-state="TIE"]')).toHaveCount(1);
    await expect(block.locator('[data-state="LOSS"]')).toHaveCount(1);
  });

  test(`GroupConv ${locale} report deep link survives delayed map data`, async ({ page }) => {
    let resume: (() => Promise<void>) | undefined;
    await page.route('**/map-details.json', route => { resume = () => route.continue(); });
    await page.goto(`/projects/groupconv-atlas?lang=${locale}#report-architecture`, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => Boolean(resume)).toBe(true);
    await resume!();
    await expect(page.getByTestId('groupconv-atlas').locator('button[data-state]')).toHaveCount(80);
    const heading = page.locator('#report-architecture');
    await expect(heading).toBeFocused();
    await expect.poll(async () => {
      const box = await heading.boundingBox();
      return Boolean(box && box.y >= 56 && box.y < page.viewportSize()!.height - 24);
    }).toBe(true);
  });

  test(`GroupConv ${locale} failed map leaves the report and source accessible`, async ({ page }) => {
    await page.route('**/map-details.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
    await page.goto(`/projects/groupconv-atlas?lang=${locale}`);
    const failure = page.locator('#exhibit-01').getByRole('status');
    await expect(failure).toContainText(locale === 'zh' ? '地图暂时无法加载' : 'The map could not load');
    await expect(failure.getByRole('link')).toHaveAttribute('href', '/case-studies/groupconv-atlas/map-details.json');
    await expect(page.locator('#groupconv-overview')).toContainText('3.87');
    await expect(page.locator('#exhibit-03')).toContainText('1.13849×');
    await expect(page.locator('#report-architecture')).toBeAttached();
    await expect(page.locator('a[download]')).toHaveAttribute('href', '/case-studies/groupconv-atlas/rtx4090-atlas.json');
  });

  test(`GroupConv ${locale} fits a 320px viewport with records expanded`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(`/projects/groupconv-atlas?lang=${locale}`);
    const atlas = page.getByTestId('groupconv-atlas');
    await expect(atlas.locator('button[data-state]')).toHaveCount(80);
    await atlas.locator('summary').click();
    await expect(atlas.getByRole('table')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const first = atlas.getByRole('group', { name: 'N=1', exact: true }).getByRole('button').first();
    await first.click();
    await expect(atlas.getByTestId('atlas-detail').getByRole('heading')).toHaveText('N 1 · 7 × 7 · cpg 1');
    await atlas.getByTestId('atlas-batch-32').click();
    await expect(atlas.getByRole('group', {name:'N=1',exact:true})).not.toBeVisible();
    await expect(atlas.getByRole('group', {name:'N=32',exact:true})).toBeVisible();
    await expect(atlas.getByTestId('atlas-detail').getByRole('heading')).toContainText('N 32');
    await atlas.getByTestId('atlas-batch-1').click();
    await expect(atlas.getByTestId('atlas-detail').getByRole('heading')).toHaveText('N 1 · 7 × 7 · cpg 1');
    await expect(atlas.getByTestId('atlas-count-WIN')).toHaveText('34');
  });
}

test('GroupConv map offers one tab stop per batch and spatial keyboard navigation', async ({ page }) => {
  await page.goto('/projects/groupconv-atlas?lang=en');
  const atlas = page.getByTestId('groupconv-atlas');
  const batch = atlas.getByRole('group', { name: 'N=1', exact: true });
  const otherBatch = atlas.getByRole('group', { name: 'N=32', exact: true, includeHidden: true });
  await expect(batch.locator('button[tabindex="0"]')).toHaveCount(1);
  await expect(otherBatch.locator('button[tabindex="0"]')).toHaveCount(1);
  await batch.locator('button[tabindex="0"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(batch.getByRole('button', { name: /^N 1, H 7, cpg 16:/ })).toBeFocused();
  await expect(atlas.getByTestId('atlas-detail').getByRole('heading')).toHaveText('N 1 · 7 × 7 · cpg 16');
  await page.keyboard.press('ArrowDown');
  await expect(batch.getByRole('button', { name: /^N 1, H 14, cpg 16:/ })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(batch.getByRole('button', { name: /^N 1, H 14, cpg 1:/ })).toBeFocused();
  await page.keyboard.press('End');
  await expect(batch.getByRole('button', { name: /^N 1, H 14, cpg 256:/ })).toBeFocused();
  await expect(batch.locator('button[tabindex="0"]')).toHaveCount(1);
});

for (const locale of ['en', 'zh'] as const) {
  test(`GroupConv ${locale} assistant presets link distinct experiment evidence`, async ({ page }) => {
    let modelCalls = 0;
    await page.route('**/api/assistant', route => { modelCalls += 1; return route.abort(); });
    for (const question of questionBank['/projects/groupconv-atlas'].questions) {
      await page.goto(`/projects/groupconv-atlas?lang=${locale}`);
      await page.getByRole('button', { name: locale === 'zh' ? '询问作品集' : 'Ask Portfolio', exact: true }).click();
      const widget = page.getByTestId('assistant-widget');
      await widget.getByRole('button', { name: question[locale === 'zh' ? 'q_zh' : 'q_en'], exact: true }).click();
      const references = widget.getByTestId('ask-go-index');
      const links = references.getByRole('link');
      await expect(links).toHaveCount(2);
      const destinations = await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!));
      expect(new Set(destinations).size).toBe(2);
      expect(destinations.some(url => /groupconv-atlas\/blob\/[a-f0-9]{40}\/results\/.+#L\d+-L\d+$/.test(url))).toBe(true);
      expect(destinations.every(url => /groupconv-atlas\/blob\/[a-f0-9]{40}\/results\/.+#L\d+-L\d+$/.test(url) || /^\/projects\/groupconv-atlas(?:\?lang=zh)?#exhibit-0[1-4]$/.test(url))).toBe(true);
      const titles = await links.allTextContents();
      expect(new Set(titles).size).toBe(2);
      await expect(references).not.toContainText('README');
      await expect(widget).not.toContainText('Codex');
      expect(await widget.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
    expect(modelCalls).toBe(0);
  });
}
