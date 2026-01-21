## Overview

This project is an **Express + TypeScript data integration service** for an e‑commerce platform.  
It ingests customer and order data from CSV files into MongoDB and exposes report APIs for querying aggregated information.

Key features:

- **CSV ingestion**: Upload customers and orders via `/api/upload/customers` and `/api/upload/orders`.
- **Reporting APIs**: Retrieve per‑customer summaries and customer orders reports with filters.
- **MongoDB + Mongoose**: Schemas with indexes tuned for common queries.
- **Swagger/OpenAPI docs**: Interactive docs at `/api-docs`.
- **Robust middleware**: Centralised error handling, logging, rate limiting, and validation.

## Setup

### Prerequisites

- Node.js (LTS or current)
- `pnpm`
- MongoDB (or use Docker Compose, see below)

### Environment variables

Create a `.env` file (or otherwise provide env vars) with at least:

- **`MONGODB_URI`**: connection string for the main database.
- **`MONGODB_URI_TEST`**: connection string for the test database.
- **`PORT`**: HTTP port for the API (e.g. `8011`).
- **`HOST`**: host/interface to bind (e.g. `0.0.0.0`).
- **`CORS_ORIGIN`**: allowed CORS origin(s), e.g. `http://localhost:3000` or `*`.

### Install dependencies

```bash
pnpm install
```

### Run locally (without Docker)

```bash
# start dev server with tsx
pnpm start:dev
```

The API will be available at `http://localhost:<PORT>/api` and Swagger UI at `http://localhost:<PORT>/api-docs`.

### Run with Docker Compose

This repo includes a `docker-compose.yml` that starts:

- **`mongo`**: MongoDB 7 running as a **single-node replica set** (`rs0`) suitable for transactions.
- **`api`**: The Express API container built from `Dockerfile`.

Start the stack:

```bash
docker compose up --build
```

By default:

- API: `http://localhost:8011/api`
- Swagger UI: `http://localhost:8011/api-docs`
- MongoDB: `mongodb://localhost:27017`

Replica-set–aware URIs used by the API:

- `MONGODB_URI=mongodb://mongo:27017/express-data-integration?replicaSet=rs0`
- `MONGODB_URI_TEST=mongodb://mongo:27017/express-data-integration-test?replicaSet=rs0`

## API surface

### CSV upload endpoints

- **`POST /api/upload/customers`**
  - Form-data upload with key `file` containing a `customers_sample.csv` file.
  - Imports customer records into MongoDB.

- **`POST /api/upload/orders`**
  - Form-data upload with key `file` containing an `orders_sample.csv` file.
  - Imports order records into MongoDB.

### Reporting endpoints

- **`GET /api/customers/:customerId/summary`**
  - Returns a summary for a single customer and their orders.
  - Path params:
    - `customerId` (number) – customer identifier.

- **`GET /api/reports/customer-orders`**
  - Returns a list of customers with aggregated order statistics.
  - Query params:
    - `country` (optional) – filter customers by country.
    - `minSpent` (optional, number) – filter out customers whose total spend is below this amount.

### API documentation (Swagger / OpenAPI)

- **Route**: `GET /api-docs`
- The spec is generated using `swagger-autogen` and served by `swagger-ui-express`.

Regenerate the OpenAPI document:

```bash
pnpm swagger:gen
```

This reads [`src/docs/swagger-base.json`](src/docs/swagger-base.json), scans the router/controllers, and writes the merged spec to [`src/docs/swagger-output.json`](src/docs/swagger-output.json).

## Testing

### Unit tests

Unit tests use **Vitest** and **mocked repositories** (no real MongoDB connection required):

- Services depend on repository interfaces (`ICustomerRepository`, `IOrderRepository`) and are injected in tests.
- Report and order service tests mock repository methods with `vi.fn()` to control responses.

Run tests:

```bash
pnpm test
```

Run tests with coverage:

```bash
pnpm test:cov
```

### Transaction handling

- A helper `withTransaction` in [`src/common/utils/withTransaction.ts`](src/common/utils/withTransaction.ts) wraps operations in a MongoDB transaction using `mongoose.startSession()` and `session.withTransaction(...)`.
- CSV import services (`CustomerService.importFromCSV`, `OrderService.importFromCSV`) use this helper so bulk inserts are transactional when MongoDB is running as a replica set (as configured in `docker-compose.yml`).

## Database & indexing

- **Customers**
  - Model: [`src/api/customer/customerModel.ts`](src/api/customer/customerModel.ts)
  - Key indexes:
    - `customer_id` (unique)
    - `email`
    - compound index `{ country: 1, signup_date: -1 }` for reporting by country and signup date.

- **Orders**
  - Model: [`src/api/order/orderModel.ts`](src/api/order/orderModel.ts)
  - Key indexes:
    - `order_id` (unique)
    - `customer_id`
    - compound index `{ customer_id: 1, order_date: -1 }` for time‑ordered per‑customer queries.
    - compound index `{ customer_id: 1, status: 1 }` to optimise status‑filtered lookups.

These indexes support the reporting queries that aggregate by `customer_id` and optionally filter by attributes like `country`.

## Project structure

```code
├── Dockerfile
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── README.md
├── src
│   ├── api
│   │   ├── customer
│   │   │   ├── __tests__
│   │   │   ├── customerController.ts
│   │   │   ├── customerModel.ts
│   │   │   ├── customerRepository.ts
│   │   │   └── customerService.ts
│   │   ├── order
│   │   │   ├── __tests__
│   │   │   ├── orderController.ts
│   │   │   ├── orderModel.ts
│   │   │   ├── orderRepository.ts
│   │   │   └── orderService.ts
│   │   ├── report
│   │   │   ├── __tests__
│   │   │   ├── dto
│   │   │   ├── reportController.ts
│   │   │   └── reportService.ts
│   │   └── router.ts
│   ├── common
│   │   ├── config
│   │   ├── middleware
│   │   └── utils
│   ├── docs
│   │   ├── swagger-base.json
│   │   ├── swagger-output.json
│   │   └── swaggerGen.ts
│   ├── index.ts
│   └── server.ts
├── tsconfig.json
└── vite.config.mts
```

## Architecture & design

- **Layering**
  - Controllers handle HTTP specifics and delegate to services.
  - Services encapsulate business logic (CSV parsing, validation, aggregation).
  - Repositories wrap Mongoose models behind interfaces for easy mocking.
  - Shared utilities provide logging, error handling, validation, and transactions.

- **Validation**
  - DTOs for request params/query (e.g. `ReportQueryDTO`, `CustomerIdParamDTO`) and middleware `validateDto` ensure inputs are validated at the edge.

- **Error handling & logging**
  - Centralised error middleware in `common/middleware`.
  - `pino`/`pino-http` logging wired via `server.ts`.

High-level request flow:

```mermaid
flowchart LR
  Client -->|HTTP| ApiRouter
  ApiRouter --> Controllers
  Controllers --> Services
  Services --> Repositories
  Repositories --> MongoDB
```

## Using the Postman collection

Import the Postman collection JSON from `postman/express-data-integration-service.postman_collection.json` into Postman and set a collection variable:

- `baseUrl` = `http://localhost:8011/api` (or your chosen host/port).

The collection includes:

- Sample CSV upload requests for customers and orders.
- Example calls for the reporting endpoints with different query parameter combinations.

## Sample CSV data

Sample CSV files live under the `samples` directory:

- `samples/customers_sample.csv`
- `samples/orders_sample.csv`

You can:

- Upload them directly via the `/api/upload/customers` and `/api/upload/orders` endpoints using Postman/form-data.
- Use them as templates for creating your own datasets with the same columns.

