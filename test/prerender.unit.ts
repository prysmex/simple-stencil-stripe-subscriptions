import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prerenderHtml, prerenderPages, pricingTableAttributes, slimPlans } from '../prerender/index.mjs';
import { demoData } from './data';

const visibleText = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

describe('pricingTableAttributes', () => {
  it('serializes props as attributes', () => {
    expect(pricingTableAttributes({ currency: 'usd', recommendExtraProductsFrom: 50, hideTieredInput: true, alwaysShowMonthly: false, translations: undefined })).toBe(
      'currency="usd" recommend-extra-products-from="50" hide-tiered-input always-show-monthly="false"',
    );
  });

  it('escapes JSON so it survives in an attribute', () => {
    const attribute = pricingTableAttributes({ products: [{ name: 'Tom & "Jerry"' }] });
    expect(attribute).toBe('products="[{&quot;name&quot;:&quot;Tom &amp; \\&quot;Jerry\\&quot;&quot;}]"');
  });
});

describe('slimPlans', () => {
  it('renders the same table with less data', async () => {
    const full = demoData();
    const slim = slimPlans({ products: [...full.products, ...full.extraProducts], prices: full.prices });
    const render = (data: ReturnType<typeof demoData>) =>
      prerenderHtml('<pricing-table></pricing-table>', { ...data, currency: 'usd' }, { fullDocument: false }).then(html =>
        html
          .replace(/ (products|prices|extra-products)="[^"]*"/g, '')
          // hydration ids count up with every render
          .replace(/(s-id="|c-id=")\d+/g, '$1')
          .replace(/<!--([a-z])\.\d+/g, '<!--$1.'),
      );

    const slimData = { products: slim.products.slice(0, -1), extraProducts: slim.products.slice(-1), prices: slim.prices } as ReturnType<typeof demoData>;
    expect(await render(slimData)).toBe(await render(full));
    expect(JSON.stringify(slimData).length).toBeLessThan(JSON.stringify(full).length);
  });

  it('keeps the ids click handlers use', () => {
    const { products, prices } = demoData();
    const slim = slimPlans({ products, prices });

    expect(slim.products.map(p => p.id)).toEqual(products.map(p => p.id));
    expect(slim.prices.map(p => [p.id, p.product])).toEqual(prices.map(p => [p.id, p.product]));
  });
});

describe('prerenderHtml', () => {
  it('fills the table in a full page', async () => {
    const page = '<!DOCTYPE html><html lang="en"><head><title>Pricing</title></head><body><pricing-table></pricing-table></body></html>';
    const html = await prerenderHtml(page, { ...demoData(), currency: 'usd' });

    expect(html).toContain('<template shadowrootmode="open">');
    expect(html).toContain('<title>Pricing</title>');
    const text = visibleText(html);
    for (const expected of ['Teams Pro', '$29', 'Buy Now', 'Contact Sales']) {
      expect(text).toContain(expected);
    }
  });

  it('round-trips the data through the attributes', async () => {
    const data = demoData();
    const html = await prerenderHtml('<pricing-table></pricing-table>', { ...data, currency: 'usd' }, { fullDocument: false });

    const products = html
      .match(/ products="([^"]*)"/)![1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    expect(JSON.parse(products)).toEqual(data.products);
  });

  it('keeps dollar signs in the data intact', async () => {
    const data = demoData();
    data.extraProducts[0].price_label = 'From $$1,000 ($& more)';
    const html = await prerenderHtml('<pricing-table></pricing-table>', { ...data, currency: 'usd' }, { fullDocument: false });

    expect(visibleText(html)).toContain('From $$1,000 ($&amp; more)');
  });

  it('fails without a table', async () => {
    await expect(prerenderHtml('<main></main>', {})).rejects.toThrow('no <pricing-table>');
  });
});

describe('prerenderPages', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pricing-prerender-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes one prerendered file per page', async () => {
    await writeFile(join(dir, 'pricing.html'), '<html><head></head><body><pricing-table></pricing-table></body></html>');
    const { products, prices } = demoData();

    const written = await prerenderPages(
      {
        pages: [
          { template: 'pricing.html', output: 'out/en/index.html', props: { products, prices, currency: 'usd' } },
          { template: 'pricing.html', output: 'out/es/index.html', props: async () => ({ products, prices, currency: 'mxn', translations: { actions: { buy_now: 'Comprar' } } }) },
        ],
      },
      { cwd: dir, log: () => {} },
    );

    expect(written).toEqual([join(dir, 'out/en/index.html'), join(dir, 'out/es/index.html')]);
    expect(visibleText(await readFile(written[0], 'utf8'))).toContain('$29');
    const spanish = visibleText(await readFile(written[1], 'utf8'));
    expect(spanish).toContain('$559');
    expect(spanish).toContain('Comprar');
  });
});
