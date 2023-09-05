# my-component



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute             | Description  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default     |
| ------------------- | --------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `alwaysShowMonthly` | `always-show-monthly` |              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `true`      |
| `currency`          | `currency`            |              | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `'mxn'`     |
| `extraProducts`     | --                    |              | `Product[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `[]`        |
| `hideTieredInput`   | `hide-tiered-input`   |              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `false`     |
| `prices`            | --                    |              | `Price[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `[]`        |
| `products`          | --                    | The products | `Product[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `[]`        |
| `translations`      | --                    |              | `{ most_popular: string; tiered_input: { label: string; description: string; }; currency: string; currencies: { mxn: string; usd: string; }; recurrances: { day: string; days: string; week: string; weeks: string; month: string; months: string; year: string; years: string; }; free_trial: string; units: string; unit: string; free_tooltip: string; time: { day: string; days: string; week: string; weeks: string; month: string; months: string; year: string; years: string; }; actions: { buy_now: string; contact_sales: string; }; discount_badge_for_yearly: string; footer: string; }` | `undefined` |


## Dependencies

### Depends on

- [tiered-input](tiered-input)
- [one-product](one-product)
- [highlighted-product](highlighted-product)

### Graph
```mermaid
graph TD;
  pricing-table --> tiered-input
  pricing-table --> one-product
  pricing-table --> highlighted-product
  style pricing-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
