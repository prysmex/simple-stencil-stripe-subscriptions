//eslint-disable-next-line no-unused-vars
import { Component, Prop, h } from '@stencil/core';
import { Translations } from '../../../utils/locale';

@Component({
  tag: 'tiered-input',
  styleUrl: 'tiered-input.css',
  shadow: true,
})
export class OneProduct {
  @Prop() label: Translations['tiered_input']['label'];
  @Prop() quantity = 1;
  @Prop() changeQuantity: (e) => void;

  render() {
    return (
      <div>
        <label htmlFor="quantity" class="block text-sm font-medium leading-6 text-gray-900">
          {this.label}
        </label>
        <div class="mt-2">
          <input
            type="number"
            name="quantity"
            id="quantity"
            value={this.quantity}
            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            onInput={this.changeQuantity}
            aria-describedby="quantity-description"
          />
        </div>
      </div>
    );
  }
}
