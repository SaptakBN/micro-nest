# Async Communication TODO

## Primary Idea: Notification and Audit Events

Add asynchronous pub/sub communication using RabbitMQ around user lifecycle events. The goal is to learn how async communication works in a distributed system without adding too much product complexity.

The first feature should be a small `notification-service` that reacts to events published by the existing services. Later, an `audit-service` can be added as a second consumer to demonstrate true pub/sub fanout.

## Why This Fits This Project

- Registration, login, and profile update already exist.
- Notification and audit work should not block the main HTTP request.
- RabbitMQ is already present in the infrastructure.
- The feature teaches practical async concepts: publishing, consuming, routing keys, retries, dead-letter queues, idempotency, and eventual consistency.

## Initial Event Flow

```text
Client
  -> API Gateway REST
  -> auth-service / user-service over gRPC
  -> service publishes domain event to RabbitMQ
  -> notification-service consumes event asynchronously
```

## First Events

Start with these events:

```text
user.registered
user.profile_updated
auth.user_logged_in
```

Recommended publishers:

```text
auth-service publishes:
- user.registered
- auth.user_logged_in

user-service publishes:
- user.profile_updated
```

Recommended consumers:

```text
notification-service consumes:
- user.registered
- user.profile_updated

audit-service consumes later:
- user.registered
- user.profile_updated
- auth.user_logged_in
```

## MVP Scope

Build only the notification service first.

When a user registers:

1. `auth-service` completes registration.
2. `auth-service` publishes a `user.registered` event.
3. `notification-service` consumes the event.
4. `notification-service` stores or logs a mock welcome notification.

Example event:

```json
{
  "eventId": "evt_123",
  "eventType": "user.registered",
  "userId": "user_123",
  "email": "user@example.com",
  "fullName": "Example User",
  "occurredAt": "2026-05-02T10:30:00.000Z"
}
```

The notification service does not need to send real emails initially. It can store mock notification records such as:

```text
id
eventId
userId
type
recipientEmail
status
createdAt
```

## Learning Milestones

1. Add a shared RabbitMQ module/library.
2. Publish `user.registered` from `auth-service`.
3. Create `notification-service` as a RabbitMQ consumer.
4. Store or log mock welcome notifications.
5. Add retry behavior for failed notification processing.
6. Add a dead-letter queue for messages that fail too many times.
7. Add idempotency using `eventId` so duplicate messages are safe.
8. Add `user.profile_updated` notification handling.
9. Add an `audit-service` as a second consumer to learn pub/sub fanout.

## Important Concepts To Practice

- Event contracts and payload design
- Exchange types, especially topic exchanges
- Routing keys such as `user.registered`
- Durable queues
- Manual acknowledgements
- Retries
- Dead-letter exchanges and dead-letter queues
- Idempotent consumers
- Eventual consistency
- Observability through logs and stored event records

## Suggested Final Shape

```text
auth-service
  publishes:
    user.registered
    auth.user_logged_in

user-service
  publishes:
    user.profile_updated

notification-service
  consumes:
    user.registered
    user.profile_updated

audit-service
  consumes:
    user.registered
    user.profile_updated
    auth.user_logged_in
```

This keeps the current synchronous gRPC flow intact while adding async side effects where they naturally belong.
