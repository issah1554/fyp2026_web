# API Endpoints

This document lists the available HTTP endpoints exposed by the Django application router and tracks both backend implementation status and frontend integration status.

Backend status values:

- `Planned`: endpoint is documented as future work and is not implemented yet.
- `In progress`: endpoint exists or is being integrated, but the behavior is not complete.
- `Working`: endpoint is implemented in the application router.

Frontend status values:

- `Integrated`: endpoint is used by the frontend application.
- `Not integrated`: endpoint is not currently used by the frontend application.

## Auth

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register/` | Register new user and send email verification token. | None | Working | Integrated |
| POST | `/api/v1/auth/login/` | Login with username/email and password. Returns access and refresh tokens. | None | Working | Integrated |
| POST | `/api/v1/auth/token/refresh/` | Refresh access token using refresh token. | None | Working | Integrated |
| POST | `/api/v1/auth/email/verify/` | Verify registered user email with token. | None | Working | Not integrated |
| POST | `/api/v1/auth/email/resend/` | Resend email verification token. | None | Working | Not integrated |
| POST | `/api/v1/auth/password/reset/request/` | Request password reset link by email. | None | Working | Integrated |
| POST | `/api/v1/auth/password/reset/confirm/` | Reset password with token. | None | Working | Integrated |
| GET | `/api/v1/auth/me/` | Get current authenticated user profile. | Bearer token | Working | Not integrated |
| POST | `/api/v1/auth/logout/` | Logout acknowledged; client discards tokens. | Bearer token | Working | Integrated |

## Users

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/users/` | List managed users. | Admin bearer token | Working | Integrated |
| POST | `/api/v1/users/` | Create managed user. | Admin bearer token | Working | Integrated |
| GET | `/api/v1/users/{user_id}/` | Get managed user by public ID. | Admin bearer token | Working | Not integrated |
| PATCH | `/api/v1/users/{user_id}/` | Update managed user by public ID. | Admin bearer token | Working | Integrated |
| DELETE | `/api/v1/users/{user_id}/` | Delete managed user by public ID. | Admin bearer token | Working | Integrated |

## Roles and Permissions

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/users/roles/` | List roles and assigned permissions. | Admin bearer token | Working | Integrated |
| POST | `/api/v1/users/roles/` | Create custom role with optional `permission_ids`. | Admin bearer token | Working | Integrated |
| GET | `/api/v1/users/roles/{role_id}/` | Get role by public ID or code. | Admin bearer token | Working | Not integrated |
| PUT | `/api/v1/users/roles/{role_id}/` | Update role metadata and optional `permission_ids`. System role codes cannot be changed. | Admin bearer token | Working | Integrated |
| PATCH | `/api/v1/users/roles/{role_id}/` | Replace permissions assigned to a role using `permission_ids`. | Admin bearer token | Working | Not integrated |
| DELETE | `/api/v1/users/roles/{role_id}/` | Delete custom role. System roles and roles assigned to users cannot be deleted. | Admin bearer token | Working | Integrated |
| GET | `/api/v1/users/permissions/` | List read-only system-defined permissions. Supports `search`. | Admin bearer token | Working | Integrated |
| GET | `/api/v1/users/permissions/{permission_id}/` | Get system permission by public ID. | Admin bearer token | Working | Not integrated |

## Commodity Categories

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/commodities/categories/` | List commodity categories. | Bearer token | Working | Integrated |
| POST | `/api/v1/commodities/categories/` | Create commodity category. | Admin bearer token | Working | Integrated |
| GET | `/api/v1/commodities/categories/{category_id}/` | Get commodity category by public ID. | Bearer token | Working | Not integrated |
| PATCH | `/api/v1/commodities/categories/{category_id}/` | Update commodity category by public ID. | Admin bearer token | Working | Integrated |
| DELETE | `/api/v1/commodities/categories/{category_id}/` | Delete commodity category by public ID. | Admin bearer token | Working | Integrated |

## Commodity Units

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/commodities/units/` | List commodity measurement units such as Kilogram, Tonne, Crate, and Bag. | Bearer token | Working | Integrated |
| POST | `/api/v1/commodities/units/` | Create commodity unit with `name`, `symbol`, and optional `description`. | Admin bearer token | Working | Integrated |
| GET | `/api/v1/commodities/units/{unit_id}/` | Get commodity unit by public ID. | Bearer token | Working | Not integrated |
| PATCH | `/api/v1/commodities/units/{unit_id}/` | Update commodity unit by public ID. | Admin bearer token | Working | Integrated |
| DELETE | `/api/v1/commodities/units/{unit_id}/` | Delete commodity unit by public ID. Linked commodities keep their stored unit symbol. | Admin bearer token | Working | Integrated |

## Commodities

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/commodities/` | List commodities. Supports `search`, `category_id`, `page`, and `page_size`. | Bearer token | Working | Integrated |
| POST | `/api/v1/commodities/` | Create commodity. Accepts optional `unit_id` and `category_ids`. | Admin bearer token | Working | Integrated |
| GET | `/api/v1/commodities/{commodity_id}/` | Get commodity by public ID. | Bearer token | Working | Not integrated |
| PATCH | `/api/v1/commodities/{commodity_id}/` | Update commodity by public ID. | Admin bearer token | Working | Integrated |
| DELETE | `/api/v1/commodities/{commodity_id}/` | Delete commodity by public ID. | Admin bearer token | Working | Integrated |

## Administrative Areas

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/areas/` | List administrative areas. Supports `level`, `search`, `parent_id`, `page`, and `page_size` query parameters. | None | Working | Integrated |
| POST | `/api/v1/areas/` | Create administrative area. Regions must not include a parent. Districts require a region parent. Wards require a district parent. | Admin bearer token | Working | Integrated |
| POST | `/api/v1/areas/bulk` | Bulk import administrative areas by path. Finds existing areas or creates missing parents automatically. | Admin bearer token | Working | Integrated |
| GET | `/api/v1/areas/{area_id}/` | Get administrative area by public ID. | None | Working | Not integrated |
| PATCH | `/api/v1/areas/{area_id}/` | Update administrative area by public ID. | Admin bearer token | Working | Integrated |
| DELETE | `/api/v1/areas/{area_id}/` | Delete administrative area by public ID. | Admin bearer token | Working | Integrated |

## Commodity Listings

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/listings/` | List commodity listings. Supports `commodity_id`, `area_id`, and `status` filters. | None | Working | Not integrated |
| POST | `/api/v1/listings/` | Create commodity listing. Allowed for farmers, entrepreneurs, staff, and admins. | Bearer token | Working | Not integrated |
| GET | `/api/v1/listings/{listing_id}/` | Get commodity listing by public ID. | None | Working | Not integrated |
| PATCH | `/api/v1/listings/{listing_id}/` | Update commodity listing by public ID. Owner, staff, or admin only. | Bearer token | Working | Not integrated |
| DELETE | `/api/v1/listings/{listing_id}/` | Delete commodity listing by public ID. Owner, staff, or admin only. | Bearer token | Working | Not integrated |

## Orders

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/orders/` | List orders visible to the authenticated user. Admins see all orders. | Bearer token | Working | Not integrated |
| POST | `/api/v1/orders/` | Place an order. | Bearer token | Working | Not integrated |
| GET | `/api/v1/orders/{order_id}/` | Get order by public ID. Order buyer, listing seller, staff, or admin only. | Bearer token | Working | Not integrated |
| PATCH | `/api/v1/orders/{order_id}/` | Update order by public ID. Order buyer, listing seller, staff, or admin only. | Bearer token | Working | Not integrated |

## API Documentation

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/schema/` | OpenAPI schema. | None | Working | Not integrated |
| GET | `/api/docs/` | Swagger UI documentation. | None | Working | Not integrated |

## Admin

| Method | Path | Notes | Auth | Backend status | Frontend status |
| --- | --- | --- | --- | --- | --- |
| GET | `/admin/` | Django admin site. | Django admin session | Working | Not integrated |
