# Player Orders

Player Orders is an SAP CAP application for managing digital game orders. It combines a TypeScript CAP service, SAP HANA Cloud persistence, XSUAA authorization, and a SAP Fiori elements UI.

## Business Flow

An order moves through the following lifecycle:

1. A customer or sales administrator creates a `NEW` order.
2. The customer or sales administrator submits it.
3. A sales administrator records a successful payment.
4. A warehouse manager or sales administrator fulfills the paid items.
5. A customer or sales administrator may cancel an order before payment.

Every transition is validated by the service. Payments and fulfillment results are stored as immutable processing history.

## Architecture

| Layer | Technology | Location |
| --- | --- | --- |
| UI | SAP Fiori elements / UI5 | `app/orders` |
| Application router | SAP Approuter | `app/router` |
| Service | SAP CAP Node.js with TypeScript | `srv` |
| Data model | CDS | `db` |
| Local database | SQLite | CAP development profile |
| Cloud database | SAP HANA Cloud / HDI | `mta.yaml` |
| Authentication | Mock users locally, XSUAA in production | `package.json`, `xs-security.json` |

## Data Model

The main entities are:

- `Customers`: player identity and segmentation data.
- `GameProducts`: products, prices, and stock.
- `SalesOrders`: order header, status, totals, payment method, and note.
- `SalesOrderItems`: products and quantities belonging to an order.
- `Payments`: payment processing history.
- `FulfillmentLogs`: fulfillment results for each order item.
- `OrderStatuses`: status descriptions and UI criticality.

## Roles

| Role | Main permissions |
| --- | --- |
| `Customer` | Reads only their own customer record and orders, creates and edits orders, submits or cancels eligible orders |
| `SalesAdmin` | Reads and manages all orders, records payments, fulfills orders, and cancels eligible orders |
| `WarehouseManager` | Reads all orders and products, updates stock, and fulfills paid orders |

The Fiori UI reads a transient `Configuration` singleton from the CAP service. This hides controls that the signed-in role cannot use while the CAP authorization rules remain the final security boundary.

## Local Setup

Requirements:

- Node.js 20 or newer
- npm

Install dependencies and start the application:

```sh
npm ci
npm run watch-orders
```

The development profile uses these mock users:

| Username | Password | Role |
| --- | --- | --- |
| `customer` | `customer` | `Customer` |
| `sales` | `sales` | `SalesAdmin` |
| `warehouse` | `warehouse` | `WarehouseManager` |

## Tests

Run the CAP integration tests with:

```sh
npm test
```

The suite covers authentication, row-level customer isolation, role permissions, UI capabilities, order transitions, payment history, fulfillment logs, stock changes, and invalid operations.

Useful validation commands:

```sh
npx tsc --noEmit
npx cds compile srv/order-service.cds --to edmx
npm run build --workspace app/orders
```

## SAP BTP Deployment

The multi-target application contains the CAP service, HDI deployer, approuter, Fiori application content, XSUAA service, and HTML5 application repository services.

Build and deploy it with:

```sh
mbt build
cf deploy mta_archives/player-orders_1.0.0.mtar
```

After deployment:

1. Create role collections for `Customer`, `SalesAdmin`, and `WarehouseManager`.
2. For each customer role, set the `playerId` attribute to the business player's ID.
3. Assign users to the appropriate role collections.
4. Open the approuter route shown by `cf apps`, then use `/playerordersorders/index.html`.

Do not assign operational roles to the same test user when validating role separation. A user with several roles receives the combined permissions of those roles.

## Project Structure

```text
app/orders/       Fiori elements application and annotations
app/router/       SAP Approuter configuration
db/               CDS domain model and seed data
srv/              OData service, authorization, and lifecycle handlers
test/             CAP integration tests
mta.yaml          SAP BTP deployment descriptor
xs-security.json  XSUAA scopes, roles, and attributes
```

## Demonstration Scenario

1. Sign in as a customer and verify that only the customer's own order is visible.
2. Submit the `NEW` order.
3. Sign in as a sales administrator and mark the order as paid.
4. Sign in as a warehouse manager and fulfill the order.
5. Check the Processing History tab for the payment and fulfillment records.
