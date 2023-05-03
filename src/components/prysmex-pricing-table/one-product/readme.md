# one-product



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute | Description | Type                                                                                                                                                                                                                                                                                                                             | Default     |
| -------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `product`      | --        |             | `ProductWithPrice`                                                                                                                                                                                                                                                                                                               | `undefined` |
| `translations` | --        |             | `{ recurrances: { day: string; days: string; week: string; weeks: string; month: string; months: string; year: string; years: string; }; time: { day: string; days: string; week: string; weeks: string; month: string; months: string; year: string; years: string; }; actions: { buy_now: string; contact_sales: string; }; }` | `undefined` |


## Events

| Event            | Description | Type                            |
| ---------------- | ----------- | ------------------------------- |
| `productClicked` |             | `CustomEvent<ProductWithPrice>` |


## Dependencies

### Used by

 - [prysmex-pricing-table](..)

### Graph
```mermaid
graph TD;
  prysmex-pricing-table --> one-product
  style one-product fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
