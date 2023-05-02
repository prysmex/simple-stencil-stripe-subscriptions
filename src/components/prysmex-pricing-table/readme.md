# my-component



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute | Description  | Type                                                                                                                                                                                                                                                                                                      | Default     |
| --------------- | --------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `extraProducts` | --        |              | `Product[]`                                                                                                                                                                                                                                                                                               | `[]`        |
| `products`      | --        | The products | `Product[]`                                                                                                                                                                                                                                                                                               | `[]`        |
| `translations`  | --        |              | `{ recurrances: { day: string; days: string; week: string; weeks: string; month: string; months: string; year: string; years: string; }; time: { day: string; days: string; week: string; weeks: string; month: string; months: string; year: string; years: string; }; actions: { buy_now: string; }; }` | `undefined` |


## Dependencies

### Depends on

- [one-product](one-product)
- [highlighted-product](highlighted-product)

### Graph
```mermaid
graph TD;
  prysmex-pricing-table --> one-product
  prysmex-pricing-table --> highlighted-product
  style prysmex-pricing-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
