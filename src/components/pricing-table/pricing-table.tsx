//eslint-disable-next-line no-unused-vars
import { Component, Prop, Element, h, State, Watch } from '@stencil/core';
import { getComponentClosestLanguage, getLocaleComponentStrings, replaceSubstringsWithObject, Translations } from '../../utils/locale';
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
    [key: string]: string;
    features_es?: string;
    features_en?: string;
  };
  call_to_action?: {
    label?: string;
    disabled?: boolean;
  };
  highlight?: boolean;
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
  tag: 'pricing-table',
  styleUrl: 'pricing-table.css',
  shadow: true,
})
export class PricingTable {
  @Element() element: HTMLElement;

  /**
   * The products
   */
  @Prop() products: Product[] = [];
  @Prop() prices: Price[] = [];
  @Prop() extraProducts: Product[] = [];

  @Prop() translations: Translations;

  @State() selectedRecurrence: PreparedRecurrence;

  _translations?: Translations;

  preparedData: PreparedData;

  @Watch('products')
  productsChanged() {
    const { products, _translations: translations, prices } = this;
    this.preparedData = this.prepareData({ products, translations, prices });
  }

  async componentWillLoad() {
    const defaultTranslations = getLocaleComponentStrings(this.element);
    if (!this.translations) {
      this._translations = defaultTranslations;
    } else {
      this._translations = merge<Translations, Partial<Translations>>(defaultTranslations, this.translations);
    }

    this.preparedData = this.prepareData({ products: this.products, translations: this._translations, prices: this.prices });
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

  prepareData({ products, translations, prices }: { products: Product[]; translations: Translations; prices: Price[] }): PreparedData {
    //we need to get all different recurrances, making sure to avoid duplicates (e.g. 1 month, 3 months, 6 months, 1 year)
    let productsWithPrices = products.map(p => {
      return {
        ...p,
        prices: prices.filter(price => {
          return price.product === p.id;
        }),
      };
    });

    const recurrances = this.prepareRecurrences(productsWithPrices, translations);

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

  getButtonLabel(product: ProductWithPrice) {
    const { _translations: translations } = this;

    const freeTrialDays = product.price.recurring?.trial_period_days;

    if (product.call_to_action?.label) {
      if (freeTrialDays) {
        return replaceSubstringsWithObject(product.call_to_action.label, {
          numberOfDays: freeTrialDays.toString(),
        });
      }
      return product.call_to_action.label;
    }

    if (freeTrialDays) {
      return replaceSubstringsWithObject(translations.free_trial, {
        numberOfDays: freeTrialDays.toString(),
      });
    }

    return translations.actions.buy_now;
  }

  render() {
    const { _translations: translations, selectedRecurrence } = this;
    const preparedProducts = this.preparedData;

    let recurrancesCount = 0;
    preparedProducts.recurrances.forEach(r => {
      recurrancesCount += r.length;
    });
    /**
     * grid-cols-1
     * grid-cols-2
     * grid-cols-3
     * grid-cols-4
     * grid-cols-5
     */
    return (
      <div class="bg-white font-sans bold">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="mt-16 flex justify-center">
            <fieldset class={`grid grid-cols-${recurrancesCount} gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200`}>
              {this.renderLabels(selectedRecurrence, preparedProducts.recurrances)}
            </fieldset>
          </div>

          <div class="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {selectedRecurrence?.products?.map?.(product => {
              return (
                <one-product product={product} translations={translations} lang={getComponentClosestLanguage(this.element)}>
                  <div slot="callToAction">{this.getButtonLabel(product)}</div>
                </one-product>
              );
            })}

            {this.extraProducts.map(product => {
              return (
                <highlighted-product product={product} lang={getComponentClosestLanguage(this.element)}>
                  <div slot="callToAction">{product.call_to_action?.label ? product.call_to_action?.label : translations?.actions.contact_sales}</div>
                </highlighted-product>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
