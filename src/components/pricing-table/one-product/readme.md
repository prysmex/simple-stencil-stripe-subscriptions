# one-product



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute             | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default     |
| ------------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `alwaysShowMonthly` | `always-show-monthly` |             | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `true`      |
| `currency`          | `currency`            |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `'mxn'`     |
| `product`           | --                    |             | `ProductWithPrice`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined` |
| `quantity`          | `quantity`            |             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `1`         |
| `translations`      | --                    |             | `{ most_popular: string; tiered_input: { label: string; description: string; }; currency: string; currencies: { mxn: string; usd: string; }; recurrances: { day: string; days: string; week: string; weeks: string; month: string; months: string; year: string; years: string; }; free_trial: string; units: string; unit: string; free_tooltip: string; time: { day: string; days: string; week: string; weeks: string; month: string; months: string; year: string; years: string; }; actions: { buy_now: string; contact_sales: string; }; discount_badge_for_yearly: string; footer: string; }` | `undefined` |


## Events

| Event            | Description | Type                            |
| ---------------- | ----------- | ------------------------------- |
| `productClicked` |             | `CustomEvent<ProductWithPrice>` |


## Dependencies

### Used by

 - [pricing-table](..)

### Graph
```mermaid
graph TD;
  pricing-table --> one-product
  style one-product fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
