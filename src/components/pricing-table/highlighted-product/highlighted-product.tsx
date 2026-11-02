import { Component, Prop, h, Event, EventEmitter, Element } from '@stencil/core';
import { Product } from '../pricing-table';
import classNames from 'classnames';

@Component({
  tag: 'highlighted-product',
  styleUrl: 'highlighted-product.css',
  scoped: true,
})
export class HighlightedProduct {
  @Prop() product: Product;
  /**
   * Lights the card up, e.g. when the selected number of seats is better served by talking to sales
   */
  @Prop() recommended: boolean = false;
  @Prop() recommendedBadge?: string;
  @Prop() recommendedMessage?: string;
  @Prop() callToActionLabel?: string;
  @Element() element: HTMLElement;

  @Event() productClicked: EventEmitter<Product>;

  productClickedHandler(product: Product) {
    this.productClicked.emit(product);
  }

  getFeatures(product: Product) {
    const features = product.metadata[`features_${this.element.lang || 'en'}`];
    if (features === undefined) {
      return [];
    }
    return features.split(';');
  }

  getDescription(product: Product) {
    const metadataDescription = product.metadata[`description_${this.element.lang || 'en'}`];
    if (product.description || metadataDescription) {
      return <p class="mt-4 text-sm leading-6 text-gray-300">{metadataDescription ? metadataDescription : product.description}</p>;
    }
  }

  render() {
    const { product } = this;
    // standalone (custom elements) builds can upgrade this before pricing-table hands over its props
    if (!product) {
      return null;
    }
    const features = this.getFeatures(product);

    const idForCallToAction = `${(product.name || '').replace(' ', '')}-${product.id}-call-to-action`;
    const { recommended } = this;

    const containerClasses = classNames('rounded-3xl p-8 xl:p-10 bg-gray-900 h-full transition-shadow duration-300', {
      'ring-1 ring-gray-900': !recommended,
      'ring-4 ring-blue-500 shadow-2xl shadow-blue-500/40': recommended,
    });
    const buttonClasses = classNames(
      'mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-white disabled:opacity-50',
      {
        'bg-white/10 hover:bg-white/20 focus-visible:outline-white': !recommended,
        'bg-blue-600 shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600': recommended,
      },
    );

    return (
      <div class={containerClasses}>
        <div class="flex items-center justify-between gap-x-4">
          <h3 id="tier-enterprise" class="text-lg font-semibold leading-8 text-white">
            {product.name}
          </h3>
          {recommended && this.recommendedBadge && (
            <p class="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-semibold leading-5 text-white whitespace-nowrap">{this.recommendedBadge}</p>
          )}
        </div>
        {this.getDescription(product)}
        <p class="mt-6 flex items-baseline gap-x-1">
          <span class="text-4xl font-bold tracking-tight text-white">{product.price_label}</span>
        </p>
        <span class="text-sm font-semibold leading-6 text-gray-300">{product.interval_label}</span>
        <div aria-live="polite">{recommended && this.recommendedMessage && <p class="mt-4 text-sm font-medium leading-6 text-blue-200">{this.recommendedMessage}</p>}</div>
        <button onClick={() => this.productClickedHandler(product)} id={idForCallToAction} {...(product.call_to_action || {})} class={buttonClasses}>
          {this.callToActionLabel}
        </button>
        <ul role="list" class="mt-8 space-y-3 text-sm leading-6 xl:mt-10 text-gray-300">
          {features.map(feature => {
            return (
              <li class="flex gap-x-3">
                <svg class="h-6 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
