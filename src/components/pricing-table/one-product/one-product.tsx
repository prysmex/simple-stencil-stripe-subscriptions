//eslint-disable-next-line no-unused-vars
import { Component, Prop, h, Element, Event, EventEmitter } from '@stencil/core';
import { ProductWithPrice } from '../pricing-table';
import { Translations } from '../../../utils/locale';
import { seatPrice } from '../../../utils/pricing';
import classNames from 'classnames';

@Component({
  tag: 'one-product',
  styleUrl: 'one-product.css',
  scoped: true,
})
export class OneProduct {
  @Prop() product: ProductWithPrice;
  @Prop() translations: Translations;
  @Prop() quantity = 1;
  @Prop() currency: string = 'mxn';
  @Prop() alwaysShowMonthly: boolean = true;
  @Prop() callToActionLabel?: string;
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
          <h3 id={`tier-${this.product.id}`} class="text-lg font-semibold leading-8 text-blue-600">
            {this.product.name}
          </h3>
          <p class="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600 whitespace-nowrap">{this.translations.most_popular}</p>
        </div>
      );
    }
    return (
      <h3 id={`tier-${this.product.id}`} class="text-lg font-semibold leading-8 text-gray-900">
        {this.product.name}
      </h3>
    );
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
    // standalone (custom elements) builds can upgrade this before pricing-table hands over its props
    if (!this.product?.price || !this.translations) {
      return null;
    }
    const product = this.product;
    const interval = this.interval;
    const priceAmount = seatPrice(product.price, this.currency, this.quantity);

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

    const containerClasses = classNames('rounded-3xl p-8 ring-1 h-full', {
      'bg-blue-50 ring-blue-500': highlighted,
      'ring-gray-200': !highlighted,
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

        {/* only <span>s inside the <p>: a <div> would be invalid HTML, which browsers split apart when parsing server-rendered markup */}
        <p>
          <span class="group flex relative">
            <span class="text-sm font-bold tracking-tight text-gray-900 flex flex-row ">
              <span>
                {total} {translatedInterval}{' '}
              </span>
              {priceAmount > 0 && (
                <svg class="w-4 ml-1" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  ></path>
                </svg>
              )}
            </span>

            <span class="group-hover:opacity-100 transition-opacity bg-gray-800 px-1 text-sm text-gray-100 rounded-md absolute opacity-0 mx-auto -top-14 left-5 w-10/12">
              <span class="block p-2 w-full">
                <span>{this.getTooltip(priceAmount, displayPriceAmount)}</span>
              </span>
            </span>
          </span>
        </p>
        <button
          onClick={() => this.productClickedHandler(product)}
          id={idForCallToAction}
          {...(product.call_to_action || {})}
          class="mt-6 w-full block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {this.callToActionLabel}
        </button>
        <ul role="list" class="mt-8 space-y-3 text-sm leading-6 xl:mt-10 text-gray-600">
          {features.map(feature => {
            return (
              <li class="flex gap-x-3">
                <svg class="h-6 w-5 flex-none text-blue-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  {/* drawn once by pricing-table */}
                  <use href="#pricing-table-check" />
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
