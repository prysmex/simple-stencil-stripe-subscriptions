//eslint-disable-next-line no-unused-vars
import { Component, Prop, Element, h, State, Watch } from '@stencil/core';
import { getLocaleComponentStrings, Translations } from '../../utils/locale';
import classNames from 'classnames';
import { merge } from 'lodash-es';

export interface Recurrance {
  interval_count: number;
  trial_period_days: number;
  interval: string | 'day' | 'week' | 'month' | 'year';
}

export interface Tier {
  flat_amount?: number;
  flat_amount_decimal?: string;
  unit_amount?: number;
  unit_amount_decimal?: string;
  up_to?: number;
}

export interface Price {
  [key: string]: any;
  id: string;
  active: boolean;
  currency: string;
  recurring?: Recurrance;
  type: string | 'one_time' | 'recurring';
  unit_amount: number;
  is_subscribed?: boolean;
  tiers?: Tier[];
}

export interface Product {
  [key: string]: any;
  id: string;
  active: boolean;
  name: string;
  description: string;
  prices: Price[];
  metadata: {
    features: string;
  };
  call_to_action_label?: string;
  highlight?: boolean;
  onClick: (_product: ProductWithPrice) => void;
}

export interface ProductWithPrice extends Product {
  price: Price;
}

export interface PreparedRecurrence {
  interval: string;
  interval_count: number;
  label: string;
  products: ProductWithPrice[];
}

export interface PreparedData {
  recurrances: PreparedRecurrence[][];
}

@Component({
  tag: 'prysmex-pricing-table',
  styleUrl: 'prysmex-pricing-table.css',
  shadow: true,
})
export class PrysmexPricingTable {
  @Element() element: HTMLElement;

  /**
   * The products
   */
  @Prop() products: Product[] = [];
  @Prop() extraProducts: Product[] = [];

  @Prop() translations: Translations;

  @State() selectedRecurrence: PreparedRecurrence;

  _translations?: Translations;

  preparedData: PreparedData;

  @Watch('products')
  productsChanged() {
    const { products, _translations: translations } = this;
    this.preparedData = this.prepareData(products, translations);
  }

  async componentWillLoad() {
    const defaultTranslations = getLocaleComponentStrings(this.element);
    if (!this.translations) {
      this._translations = defaultTranslations;
    } else {
      this._translations = merge<Translations, Partial<Translations>>(defaultTranslations, this.translations);
    }
    this.preparedData = this.prepareData(this.products, this._translations);
    this.selectedRecurrence = this.getFirst();
  }

  generateRecurrenceLabel(recurrance: Partial<PreparedRecurrence>, translations: Translations) {
    if (recurrance.interval_count === 1) {
      return translations.recurrances[recurrance.interval!];
    } else {
      return `${recurrance.interval_count} ${translations.recurrances[`${recurrance.interval}s`]}`;
    }
  }

  prepareRecurrences(products: Product[], translations: Translations): PreparedRecurrence[][] {
    interface RecurrenceMap {
      [key: string]: {
        [key: number]: PreparedRecurrence;
      };
    }
    const recurrencesByInterval = products.reduce((acc, product) => {
      const prices = product.prices.filter(price => price.active);
      prices.forEach(price => {
        if (price.recurring) {
          if (acc[price.recurring.interval]) {
            acc[price.recurring.interval][price.recurring.interval_count] = {
              interval: price.recurring.interval,
              interval_count: price.recurring.interval_count,
              label: this.generateRecurrenceLabel(price.recurring, translations),
              products: [
                ...(acc[price.recurring.interval][price.recurring.interval_count]?.products || []),
                {
                  ...product,
                  price,
                },
              ],
            };
          } else {
            acc[price.recurring.interval] = {};
            acc[price.recurring.interval][price.recurring.interval_count] = {
              interval: price.recurring.interval,
              interval_count: price.recurring.interval_count,
              label: this.generateRecurrenceLabel(price.recurring, translations),
              products: [
                {
                  ...product,
                  price,
                },
              ],
            };
          }
        }
      });
      return acc;
    }, {} as RecurrenceMap);

    /**
     * {
     *   1_day: {
     *    interval: 'day',
     *    interval_count: 1,
     *    label: 'day',
     *    products: [];
     *   }
     * }
     *
     *
     * {
     *  day: {
     *   1: {
     *    interval: 'day',
     *    interval_count: 1,
     *    label: 'day',
     *    products: [];
     *   },
     *  }
     * }

     */

    const order = ['day', 'week', 'month', 'year'];
    const intervalsAsArray: { [key: number]: PreparedRecurrence }[] = [];

    order.forEach(interval => {
      if (recurrencesByInterval[interval]) {
        intervalsAsArray.push(recurrencesByInterval[interval]);
      }
    });

    const fullyOrdered = intervalsAsArray.map((interval: { [key: number]: {} }) => {
      const ordered = Object.keys(interval)
        .map(key => interval[key])
        .sort((a, b) => {
          if (a.interval_count < b.interval_count) {
            return -1;
          } else if (a.interval_count > b.interval_count) {
            return 1;
          } else {
            return 0;
          }
        });
      return ordered;
    });

    //I need to sort now by the product price
    fullyOrdered.forEach((interval: PreparedRecurrence[]) => {
      interval.forEach((recurrence: PreparedRecurrence) => {
        recurrence.products.sort((a, b) => {
          const aPrice = a.price.tiers ? a.price.tiers[0].unit_amount : a.price.unit_amount;
          const bPrice = b.price.tiers ? b.price.tiers[0].unit_amount : b.price.unit_amount;

          if (aPrice! < bPrice!) {
            return -1;
          } else if (aPrice! > bPrice!) {
            return 1;
          } else {
            return 0;
          }
        });
      });
    });

    return fullyOrdered;
  }

  prepareData(products: Product[], translations): PreparedData {
    //we need to get all different recurrances, making sure to avoid duplicates (e.g. 1 month, 3 months, 6 months, 1 year)
    const recurrances = this.prepareRecurrences(products, translations);

    products.map(p => {
      let product = JSON.parse(JSON.stringify(p)) as Product;
      product.prices = product.prices.filter(price => price.active);
      if ((!product.features || product.features.length === 0) && product.metadata.features) {
        product.features = product.metadata.features.split(';');
      }
      return product;
    });

    let grid = {
      recurrances,
    };

    return grid;
  }

  renderLabels(selectedRecurrence: PreparedRecurrence, recurrances: PreparedData['recurrances']) {
    let labels: any[] = [];
    recurrances.forEach(interval => {
      interval.forEach(rec => {
        const classes = classNames('cursor-pointer rounded-full px-2.5 py-1', {
          'bg-blue-600 text-white': selectedRecurrence === rec,
        });
        labels.push(
          <label class={classes} htmlFor={`${rec.interval_count}_${rec.interval}`}>
            <input
              id={`${rec.interval_count}_${rec.interval}`}
              type="radio"
              name="payment_interval"
              onChange={_e => {
                this.selectedRecurrence = rec;
              }}
              value={`${rec.interval_count}_${rec.interval}`}
              class="sr-only"
            />
            <span>{rec.label}</span>
            {/*eslint-disable-next-line prettier/prettier*/}
          </label>,
        );
      });
    });

    return labels;
  }

  getFirst() {
    return this.preparedData.recurrances[0]?.[0];
  }

  render() {
    const { _translations: translations, selectedRecurrence } = this;
    const preparedProducts = this.preparedData;

    /**
     * grid-cols-1
     * grid-cols-2
     * grid-cols-3
     * grid-cols-4
     */
    return (
      <div class="bg-white font-sans bold">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="mt-16 flex justify-center">
            <fieldset
              class={`grid grid-cols-${preparedProducts.recurrances.length} gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200`}
            >
              {this.renderLabels(selectedRecurrence, preparedProducts.recurrances)}
            </fieldset>
          </div>

          <div class="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {selectedRecurrence?.products?.map?.(product => {
              return (
                <one-product product={product} translations={translations} onClick={product => product.onClick(product)}>
                  <div slot="callToAction">{product.call_to_action_label ? product.call_to_action_label : translations?.actions.buy_now}</div>
                </one-product>
              );
            })}

            {this.extraProducts.map(product => {
              return <highlighted-product product={product} onClick={product => product.onClick(product)} />;
            })}
          </div>
        </div>
      </div>
    );
  }
}
