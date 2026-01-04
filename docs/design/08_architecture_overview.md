# アーキテクチャ概要図

## 目的

DDD ベースのレイヤ構成とコンテキスト関係を可視化する。レイヤードアーキテクチャを採用する。

## レイヤ構成

```mermaid
graph TD
  subgraph Presentation["Presentation"]
    Handler["tRPC Handler (app/api/trpc/[trpc])"]
    Routers["tRPC Routers (server/presentation/trpc)"]
    DTO["DTO / Schemas (server/presentation/dto)"]
    PMappers["DTO Mappers (server/presentation/mappers)"]
    SA["Server Actions"]
  end

  subgraph Application["Application"]
    Container["Service Container"]
    Services["Application Services"]
  end

  subgraph Domain["Domain"]
    Entities["Aggregates (Roots)<br/>- 永続化単位・外部公開のルート"]
    InternalEntities["Entities<br/>- 集約内部の要素"]
    ValueObjects["Value Objects<br/>- 不変の値"]
    Policies["Policies / Domain Services<br/>- ルール判定"]
    Factories["Factories<br/>- 生成ロジック"]
  end

  subgraph Infrastructure["Infrastructure"]
    Repos["Repositories"]
    Mappers["Mappers"]
    Client["DB Client"]
  end

  DB[(Database)]

  Handler --> Routers
  Routers --> Container
  SA --> Container
  Routers --> DTO
  Routers --> PMappers
  Container --> Services
  Services --> Entities
  Services --> Policies
  Services --> Factories
  Services --> Repos
  Entities --> InternalEntities
  Entities --> ValueObjects
  InternalEntities --> ValueObjects
  Policies --> ValueObjects
  Factories --> Entities
  Factories --> ValueObjects
  Repos --> Mappers
  Mappers --> Factories
  Mappers --> ValueObjects
  Mappers --> Client
  Client --> DB
```

## Bounded Context の関係

```mermaid
graph LR
  Circle["Circle Context"]
  CircleSession["CircleSession Context"]
  Match["Match Context"]
  Auth["Auth Context"]

  CircleSession --> Circle
  Match --> CircleSession
  Auth -.-> Circle
  Auth -.-> CircleSession
  Auth -.-> Match
```

## 実装上の配置（参考）

- Presentation
  - `app/api/trpc/[trpc]/route.ts`
  - `server/presentation/*`
  - `app/api/auth/[...nextauth]/route.ts`
- Application
  - `server/application/*`
  - `server/application/service-container.ts`（現状の Composition Root）
- Domain
  - `server/domain/models/*`
  - `server/domain/models/*/*-repository.ts`
  - `server/domain/services/*`
  - `server/domain/services/*/*-repository.ts`
  - `server/domain/common/*`
- Infrastructure
  - `server/infrastructure/repository/*`
  - `server/infrastructure/mappers/*`
  - `server/infrastructure/db.ts`

## 補足

- リポジトリはマッパー経由で Prisma と接続する方針（Authz 含む）
- Composition Root は依存関係逆転の対応で Infrastructure へ移動予定
