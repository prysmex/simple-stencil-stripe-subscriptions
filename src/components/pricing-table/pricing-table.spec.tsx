import { describe, expect, h, it, render, vi } from '@stencil/vitest';
import { cardSummary, clone, demoData, pricingTableHtml, productCards, recurrenceLabels, renderPricingTable, shadow } from '../../../test/helpers';

describe('pricing-table', () => {
  it('renders one tab per recurrence, shortest interval first', async () => {
    const { table } = await renderPricingTable();

    const labels = recurrenceLabels(table);
    expect(labels).toEqual(['Monthly', 'Yearly']);
    expect(shadow(table).querySelector('fieldset').className).toContain('grid-cols-2');
  });

  it('shows the yearly discount badge', async () => {
    const { table } = await renderPricingTable();

    const yearly = shadow(table).querySelector('label[htmlFor="1_year"], label[for="1_year"]');
    expect(yearly.textContent).toContain('Save 16%');
  });

  it('selects the first recurrence and orders its products by price', async () => {
    const { table } = await renderPricingTable();

    expect(productCards(table).map(cardSummary)).toEqual([
      { name: 'Free', price: '$0', callToAction: 'Buy Now' },
      { name: 'Teams', price: '$29', callToAction: 'Buy Now' },
      { name: 'Teams Pro', price: '$49', callToAction: 'Buy Now' },
    ]);
  });

  it('switches products when another recurrence is picked', async () => {
    const { table, waitForChanges } = await renderPricingTable();

    const yearly = shadow(table).querySelector('#\\31_year') as HTMLInputElement;
    yearly.dispatchEvent(new Event('change'));
    await waitForChanges();

    // yearly prices are shown per month by default (290 / 12)
    expect(productCards(table).map(card => cardSummary(card).price)).toEqual(['$0', '$24.17', '$40.83']);
    expect(shadow(table).querySelector('label.bg-blue-600 span').textContent).toBe('Yearly');
  });

  it('shows the full yearly price when alwaysShowMonthly is false', async () => {
    const { table, waitForChanges } = await renderPricingTable({ alwaysShowMonthly: false });

    (shadow(table).querySelector('#\\31_year') as HTMLInputElement).dispatchEvent(new Event('change'));
    await waitForChanges();

    expect(productCards(table).map(card => cardSummary(card).price)).toEqual(['$0', '$290', '$490']);
  });

  it('recalculates graduated prices when the quantity changes', async () => {
    const { table, waitForChanges } = await renderPricingTable();

    const input = shadow(shadow(table).querySelector('tiered-input')).querySelector('input');
    input.value = '20';
    input.dispatchEvent(new Event('input'));
    await waitForChanges();

    // Teams: 14 seats at $29 + 6 seats at $22 = $538 -> $26.90 per seat
    const teams = productCards(table)[1];
    expect(cardSummary(teams).price).toBe('$26.9');
    expect(shadow(teams).querySelector('.text-sm.font-bold').textContent).toContain('$538');
  });

  describe('matches what Stripe bills', () => {
    async function teamsAt(seats: number, data = demoData()) {
      const { table, waitForChanges } = await renderPricingTable(data);
      const input = shadow(shadow(table).querySelector('tiered-input')).querySelector('input');
      input.value = String(seats);
      input.dispatchEvent(new Event('input'));
      await waitForChanges();

      const teams = productCards(table)[1];
      return { price: cardSummary(teams).price, total: shadow(teams).querySelector('.text-sm.font-bold').textContent };
    }

    // Teams, monthly: $29 up to 14 seats, $22 up to 24, ..., $6.30 up to 999, then $5.20 with no limit (`up_to: null`)
    it.each([
      [14, '$29', '$406'],
      [15, '$28.53', '$428'],
      [998, '$9.84', '$9,822.1'],
      [999, '$9.84', '$9,828.4'],
      [1000, '$9.83', '$9,833.6'],
      [2000, '$7.52', '$15,033.6'],
    ])('graduated, %i seats', async (seats, price, total) => {
      const teams = await teamsAt(seats);

      expect(teams.price).toBe(price);
      expect(teams.total).toContain(total);
    });

    it('volume, past the last limited tier', async () => {
      const data = demoData();
      data.prices.forEach(price => price.tiers_mode === 'graduated' && (price.tiers_mode = 'volume'));
      const teams = await teamsAt(2000, data);

      expect(teams.price).toBe('$5.2');
      expect(teams.total).toContain('$10,400');
    });
  });

  it('formats prices in the requested currency', async () => {
    const { table } = await renderPricingTable({ currency: 'mxn' });

    expect(productCards(table).map(card => cardSummary(card).price)).toEqual(['$0', '$559', '$949']);
  });

  it('follows changes to the currency prop', async () => {
    const { table, waitForChanges } = await renderPricingTable({ currency: 'mxn' });

    table.currency = 'usd';
    await waitForChanges();

    expect(productCards(table).map(card => cardSummary(card).price)).toEqual(['$0', '$29', '$49']);
  });

  it('can hide the quantity and currency inputs', async () => {
    const { table } = await renderPricingTable({ hideTieredInput: true });

    expect(shadow(table).querySelector('tiered-input')).toBeNull();
    expect(shadow(table).querySelector('select#currency')).toBeNull();
  });

  it('renders extra products as highlighted cards with a contact sales CTA', async () => {
    const { table } = await renderPricingTable();

    const highlighted = shadow(table).querySelectorAll('highlighted-product');
    expect(highlighted.length).toBe(1);
    expect(shadow(highlighted[0]).querySelector('h3').textContent).toBe('Enterprise');
    expect(shadow(highlighted[0]).querySelector('.text-4xl').textContent).toBe('Custom');
    expect(highlighted[0].querySelector('button').textContent).toBe('Contact Sales');
  });

  it('renders the footer', async () => {
    const { table } = await renderPricingTable();

    expect(shadow(table).querySelector('p.mt-6.text-xs').innerHTML).toContain('Prices shown excludes taxes');
  });

  describe('call to action', () => {
    function withTeamsMonthly(edit: (data: ReturnType<typeof demoData>) => void) {
      const data = demoData();
      edit(data);
      return data;
    }

    it('offers a free trial when the price has trial days', async () => {
      const data = withTeamsMonthly(({ prices }) => {
        prices.find(p => p.id === 'price_1NfA43JwhrNkNEurUwMwKiRz').recurring.trial_period_days = 14;
      });
      const { table } = await renderPricingTable(data);

      expect(cardSummary(productCards(table)[1]).callToAction).toBe('Start your 14-day free trial');
    });

    it('uses the product call_to_action label, interpolating trial days', async () => {
      const data = withTeamsMonthly(({ prices, products }) => {
        prices.find(p => p.id === 'price_1NfA43JwhrNkNEurUwMwKiRz').recurring.trial_period_days = 30;
        products.find(p => p.name === 'Teams').call_to_action = { label: 'Try {numberOfDays} days' };
      });
      const { table } = await renderPricingTable(data);

      expect(cardSummary(productCards(table)[1]).callToAction).toBe('Try 30 days');
    });

    it('passes call_to_action attributes to the button', async () => {
      const data = withTeamsMonthly(({ products }) => {
        products.find(p => p.name === 'Teams').call_to_action = { label: 'Current plan', disabled: true };
      });
      const { table } = await renderPricingTable(data);

      const teams = productCards(table)[1];
      const button = shadow(teams).querySelector('button');
      expect(button).toHaveAttribute('disabled');
      expect(button.id).toBe('Teams-prod_OS4CaS6Km2zyGS-call-to-action');
      expect(cardSummary(teams).callToAction).toBe('Current plan');
    });
  });

  describe('i18n', () => {
    it('uses the closest lang attribute', async () => {
      const { table } = await renderPricingTable({ lang: 'es' });

      const labels = recurrenceLabels(table);
      expect(labels).toEqual(['Mensual', 'Anual']);
      expect(cardSummary(productCards(table)[0]).callToAction).toBe('Comprar Ahora');
    });

    it('matches regional languages and falls back to English', async () => {
      const regional = await renderPricingTable({ lang: 'es-MX' });
      expect(cardSummary(productCards(regional.table)[0]).callToAction).toBe('Comprar Ahora');

      const unsupported = await renderPricingTable({ lang: 'fr' });
      expect(cardSummary(productCards(unsupported.table)[0]).callToAction).toBe('Buy Now');
    });

    it('merges translation overrides without leaking them into other instances', async () => {
      const custom = await renderPricingTable({ translations: { actions: { buy_now: 'Subscribe' } } });
      expect(cardSummary(productCards(custom.table)[0]).callToAction).toBe('Subscribe');
      // untouched keys keep their defaults
      expect(shadow(custom.table).querySelector('fieldset label > span').textContent).toBe('Monthly');

      const plain = await renderPricingTable();
      expect(cardSummary(productCards(plain.table)[0]).callToAction).toBe('Buy Now');
    });
  });

  describe('recommending extra products by seats', () => {
    async function setQuantity(table: HTMLElement, waitForChanges: () => Promise<void>, value: string) {
      const input = shadow(shadow(table).querySelector('tiered-input')).querySelector('input');
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await waitForChanges();
    }

    function enterprise(table: HTMLElement) {
      const card = shadow(table).querySelector('highlighted-product') as HTMLHighlightedProductElement;
      return { card, container: shadow(card).querySelector('div'), text: shadow(card).textContent };
    }

    it('lights up once the seats reach the threshold', async () => {
      const { table, waitForChanges } = await renderPricingTable({ recommendExtraProductsFrom: 50 });

      expect(enterprise(table).card.recommended).toBe(false);
      expect(enterprise(table).text).not.toContain('Recommended');

      await setQuantity(table, waitForChanges, '49');
      expect(enterprise(table).card.recommended).toBe(false);

      await setQuantity(table, waitForChanges, '50');
      const { card, container, text } = enterprise(table);
      expect(card.recommended).toBe(true);
      expect(card).toHaveClass('order-first');
      expect(container).toHaveClass('ring-blue-500');
      expect(container).not.toHaveClass('ring-gray-900');
      expect(text).toContain('Recommended');
      expect(text).toContain('For teams of 50+ users, we recommend talking with us.');

      await setQuantity(table, waitForChanges, '10');
      expect(enterprise(table).card.recommended).toBe(false);
      expect(enterprise(table).text).not.toContain('we recommend talking with us');
    });

    it('is translated', async () => {
      const { table, waitForChanges } = await renderPricingTable({ lang: 'es', recommendExtraProductsFrom: 25 });

      await setQuantity(table, waitForChanges, '30');
      expect(enterprise(table).text).toContain('Recomendado');
      expect(enterprise(table).text).toContain('Para equipos de 25 usuarios o más, te recomendamos hablar con nosotros.');
    });

    it('never lights up without a threshold', async () => {
      const { table, waitForChanges } = await renderPricingTable();

      await setQuantity(table, waitForChanges, '5000');
      expect(enterprise(table).card.recommended).toBe(false);
    });

    it('accepts the threshold as an attribute', async () => {
      const { root, waitForChanges } = await render<HTMLPricingTableElement>(pricingTableHtml('currency="usd" recommend-extra-products-from="20"'));

      await setQuantity(root, waitForChanges, '20');
      expect(enterprise(root).card.recommended).toBe(true);
    });
  });

  it('emits productClicked with the product and its selected price', async () => {
    const { table, waitForChanges } = await renderPricingTable();
    const spy = vi.fn();
    table.addEventListener('productClicked', spy);

    shadow(productCards(table)[1]).querySelector('button').click();
    await waitForChanges();

    expect(spy).toHaveBeenCalledTimes(1);
    const detail = spy.mock.calls[0][0].detail;
    expect(detail.name).toBe('Teams');
    expect(detail.price.id).toBe('price_1NfA43JwhrNkNEurUwMwKiRz');
  });

  it('renders products that are set after the first render', async () => {
    const { table, waitForChanges } = await renderPricingTable({ products: [], prices: [], extraProducts: [] });
    expect(productCards(table)).toHaveLength(0);

    const data = demoData();
    table.products = data.products;
    table.prices = data.prices;
    await waitForChanges();

    expect(productCards(table).map(card => cardSummary(card).name)).toEqual(['Free', 'Teams', 'Teams Pro']);
  });

  it('keeps the selected recurrence when products change', async () => {
    const { table, waitForChanges } = await renderPricingTable();
    (shadow(table).querySelector('#\\31_year') as HTMLInputElement).dispatchEvent(new Event('change'));
    await waitForChanges();

    table.products = clone(table.products);
    await waitForChanges();

    expect(shadow(table).querySelector('label.bg-blue-600 span').textContent).toBe('Yearly');
  });

  it('accepts its data as JSON attributes', async () => {
    const { root } = await render<HTMLPricingTableElement>(pricingTableHtml());

    expect(productCards(root).map(card => cardSummary(card).name)).toEqual(['Free', 'Teams', 'Teams Pro']);
    expect(shadow(root).querySelectorAll('highlighted-product')).toHaveLength(1);
  });

  it('renders product cards without data instead of throwing', async () => {
    const one = await render(<one-product />);
    expect(shadow(one.root).querySelector('div')).toBeNull();

    const highlighted = await render(<highlighted-product />);
    expect(shadow(highlighted.root).querySelector('div')).toBeNull();
  });

  it('renders an empty table without data', async () => {
    const { root } = await render(<pricing-table />);

    expect(productCards(root)).toHaveLength(0);
    expect(shadow(root).querySelectorAll('fieldset label')).toHaveLength(0);
  });
});
