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
          <p class="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">{this.translations.most_popular}</p>
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
      return Number((this.calculateTotalCostFor(this.quantity) / this.quantity / 100).toFixed(2));
    } else {
      const tiers = this.product.price.currency_options[this.currency].tiers!;
      const tier = tiers.find(tier => this.quantity <= tier.up_to);
      if (tier) {
        return tier.unit_amount / 100;
      }
    }
  }

  render() {
    const product = this.product;
    let priceAmount = 0;

    if (product.price.billing_scheme === 'tiered') {
      priceAmount = this.calculateTierPrice();
    } else {
      priceAmount = product.price.unit_amount / 100;
    }

    const features = this.getFeatures(product);
    const translatedInterval = this.translations.time[product.price.recurring!.interval].toLowerCase();
    const highlighted = !!product.highlight;

    const containerClasses = classNames('rounded-3xl p-8 ring-1 xl:p-10 ring-gray-200 h-full', {
      'bg-blue-50 ring-blue-500': highlighted,
    });

    return (
      <div class={containerClasses}>
        {this.getHeader()}
        <p class="mt-4 text-sm leading-6 text-gray-600">{product.description}</p>
        <p class="mt-6 flex items-baseline gap-x-1">
          <span class="text-4xl font-bold tracking-tight text-gray-900">${priceAmount}</span>
          <span class="text-sm font-semibold leading-6 text-gray-600">{translatedInterval}</span>
        </p>
        <button
          onClick={() => this.productClickedHandler(product)}
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
