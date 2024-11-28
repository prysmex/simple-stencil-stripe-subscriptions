import { Component, Prop, h, Event, EventEmitter, Element } from '@stencil/core';
import { Product } from '../pricing-table';

@Component({
  tag: 'highlighted-product',
  styleUrl: 'highlighted-product.css',
  shadow: true,
})
export class HighlightedProduct {
  @Prop() product: Product;
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
    const features = this.getFeatures(product);

    const idForCallToAction = `${(product.name || '').replace(' ', '')}-${product.id}-call-to-action`;
    return (
      <div class="rounded-3xl p-8 ring-1 xl:p-10 bg-gray-900 ring-gray-900 h-full">
        <h3 id="tier-enterprise" class="text-lg font-semibold leading-8 text-white">
          {product.name}
        </h3>
        {this.getDescription(product)}
        <p class="mt-6 flex items-baseline gap-x-1">
          <span class="text-4xl font-bold tracking-tight text-white">{product.price_label}</span>
        </p>
        <span class="text-sm font-semibold leading-6 text-gray-300">{product.interval_label}</span>
        <button
          onClick={() => this.productClickedHandler(product)}
          id={idForCallToAction}
          {...(product.call_to_action || {})}
          class="mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white disabled:opacity-50"
        >
          <slot name="callToAction" />
        </button>
        <ul role="list" class="mt-8 space-y-3 text-sm leading-6 xl:mt-10 text-gray-300">
          {features.map(feature => {
            return (
              <li class="flex gap-x-3">
                <svg class="h-6 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
