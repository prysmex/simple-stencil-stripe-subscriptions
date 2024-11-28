//eslint-disable-next-line no-unused-vars
import { Component, Prop, h, Element, Event, EventEmitter } from '@stencil/core';
import { ProductWithPrice } from '../pricing-table';
import { Translations } from '../../../utils/locale';
import classNames from 'classnames';

@Component({
  tag: 'one-product',
  styleUrl: 'one-product.css',
  shadow: true,
})
export class OneProduct {
  @Prop() product: ProductWithPrice;
  @Prop() translations: Translations;
  @Prop() quantity = 1;
  @Prop() currency: string = 'mxn';
  @Prop() alwaysShowMonthly: boolean = true;
  @Element() element: HTMLElement;

  @Event() productClicked: EventEmitter<ProductWithPrice>;

  productClickedHandler(product: ProductWithPrice) {
    this.productClicked.emit(product);
  }

  getFeatures(product: ProductWithPrice) {
    const features = product.metadata[`features_${this.element.lang || 'en'}`];
    if (features === undefined) {
      return [];
    }
    return features.split(';');
  }

  getHeader() {
    if (this.product.highlight) {
      return (
        <div class="flex items-center justify-between gap-x-4">
          <h3 id="tier-startup" class="text-lg font-semibold leading-8 text-blue-600">
            {this.product.name}
          </h3>
          <p class="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600 whitespace-nowrap">{this.translations.most_popular}</p>
        </div>
      );
    }
    return (
      <h3 id="tier-startup" class="text-lg font-semibold leading-8 text-gray-900">
        {this.product.name}
      </h3>
    );
  }

  calculateTotalCostFor(seats: number) {
    const tiers = this.product.price.currency_options[this.currency].tiers!;

    let totalCost = 0;
    //Agregate graduated pricing
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i]!;
      const previousTier = tiers[i - 1];
      const previousTierUpTo = previousTier && i > 0 ? (typeof previousTier.up_to === 'string' && previousTier.up_to === 'inf' ? 0 : previousTier.up_to) : 0;

      if ((typeof tier.up_to === 'string' && tier.up_to === 'inf') || seats < tier.up_to) {
        totalCost += (seats - previousTierUpTo) * tier.unit_amount;
        break;
      } else {
        totalCost += (tier.up_to - previousTierUpTo) * tier.unit_amount;
      }
    }

    return totalCost;
  }

  calculateTierPrice() {
    if (this.product.price.tiers_mode === 'graduated') {
      const tiers = this.product.price.currency_options[this.currency].tiers!;
      let tierWithHigherUnitAmount = tiers.find(tier => this.quantity <= tier.up_to);
      if (!tierWithHigherUnitAmount) {
        const infTier = tiers.find(tier => {
          const a = typeof tier.up_to === 'string' && tier.up_to === 'inf';
          const b = !tier.up_to && tier.up_to !== 0;
          return a || b;
        });
        return Number(infTier.unit_amount / 100);
      }
      return Number(this.calculateTotalCostFor(this.quantity) / this.quantity / 100);
    } else {
      const tiers = this.product.price.currency_options[this.currency].tiers!;
      const tier = tiers.find(tier => this.quantity <= tier.up_to);
      if (tier) {
        return tier.unit_amount / 100;
      }
    }
  }

  getDescription(product: ProductWithPrice) {
    const metadataDescription = product.metadata[`description_${this.element.lang || 'en'}`];
    if (product.description || metadataDescription) {
      return <p class="mt-4 text-sm leading-6 text-gray-600">{metadataDescription ? metadataDescription : product.description}</p>;
    }
  }

  getFormatter(maximumFractionDigits = 2) {
    if (this.currency === 'usd') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits });
    } else if (this.currency === 'mxn') {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits });
    }
  }

  get interval() {
    return this.product.price.recurring!.interval;
  }

  getTooltip(priceAmount: number, displayPriceAmount: number | string) {
    if (priceAmount === 0) {
      return this.translations.free_tooltip;
    }
    if (this.interval === 'month') {
      return `${displayPriceAmount} ${this.translations.unit} ${this.translations.time.month.toLocaleLowerCase?.()} x ${this.quantity} ${this.translations.units}`;
    }

    const formatter = this.getFormatter();
    let displayPriceAmounts = formatter.format(priceAmount / 12);
    return `${displayPriceAmounts} ${this.translations.yearly_tooltip_help} ${this.translations.unit} ${this.translations.time.month.toLocaleLowerCase?.()} x ${this.quantity} ${
      this.translations.units
    } x 12 ${this.translations.recurrances.months.toLocaleLowerCase?.()}`;
  }

  render() {
    const product = this.product;
    const interval = this.interval;
    let priceAmount = 0;

    if (product.price.billing_scheme === 'tiered') {
      priceAmount = this.calculateTierPrice();
    } else {
      priceAmount = product.price.unit_amount / 100;
    }

    let displayPriceAmount: number | string = priceAmount;

    if (interval === 'year' && this.alwaysShowMonthly) {
      displayPriceAmount = priceAmount / 12;
    }

    const formatter = this.getFormatter();
    displayPriceAmount = formatter.format(displayPriceAmount);

    const total = formatter.format(Number(priceAmount * this.quantity));

    const features = this.getFeatures(product);
    const translatedInterval = this.translations.time[product.price.recurring!.interval].toLowerCase();
    const unit = this.translations.unit.toLowerCase();
    const highlighted = !!product.highlight;

    const containerClasses = classNames('rounded-3xl p-8 ring-1 ring-gray-200 h-full', {
      'bg-blue-50 ring-blue-500': highlighted,
    });

    const idForCallToAction = `${(product.name || '').replace(' ', '')}-${product.id}-call-to-action`;

    return (
      <div class={containerClasses}>
        {this.getHeader()}
        {this.getDescription(product)}
        <p class="mt-6 flex items-baseline gap-x-1">
          <span class="text-4xl font-bold tracking-tight text-gray-900">{displayPriceAmount}</span>
        </p>
        <p>
          <span class="text-sm font-semibold leading-6 text-gray-600">{unit}</span>
        </p>

        <p>
          <div class="group flex relative">
            <div class="text-sm font-bold tracking-tight text-gray-900 flex flex-row ">
              <div>
                {total} {translatedInterval}{' '}
              </div>
              {priceAmount > 0 && (
                <svg class="w-4 ml-1" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  ></path>
                </svg>
              )}
            </div>

            <span
              class="group-hover:opacity-100 transition-opacity bg-gray-800 px-1 text-sm text-gray-100 rounded-md absolute opacity-0 mx-auto -top-14 left-5 w-10/12"
            >
              <div class="p-2 w-full">
                <span>{this.getTooltip(priceAmount, displayPriceAmount)}</span>
              </div>
            </span>
          </div>
        </p>
        <button
          onClick={() => this.productClickedHandler(product)}
          id={idForCallToAction}
          {...(product.call_to_action || {})}
          class="mt-6 w-full block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          <slot name="callToAction" />
        </button>
        <ul role="list" class="mt-8 space-y-3 text-sm leading-6 xl:mt-10 text-gray-600">
          {features.map(feature => {
            return (
              <li class="flex gap-x-3">
                <svg class="h-6 w-5 flex-none text-blue-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clip-rule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
