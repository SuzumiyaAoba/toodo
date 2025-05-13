# TODO 管理 API 仕様書

## 概要
この API は、TODO 管理アプリケーションのバックエンドとして機能します。以下のエンドポイントを提供し、TODO の作成、取得、更新、削除をサポートします。

## エンドポイント

### 1. TODO の作成
- **URL**: `/todos`
- **メソッド**: `POST`
- **リクエストボディ**:
  ```json
  {
    "title": "string",
    "description": "string",
    "status": "string" // e.g., "pending", "completed"
  }
  ```
- **レスポンス**:
  - **201 Created**: 作成された TODO の詳細

### 2. TODO の一覧取得
- **URL**: `/todos`
- **メソッド**: `GET`
- **レスポンス**:
  - **200 OK**: TODO のリスト

### 3. TODO の詳細取得
- **URL**: `/todos/{id}`
- **メソッド**: `GET`
- **レスポンス**:
  - **200 OK**: 指定された TODO の詳細
  - **404 Not Found**: TODO が見つからない場合

### 4. TODO の更新
- **URL**: `/todos/{id}`
- **メソッド**: `PUT`
- **リクエストボディ**:
  ```json
  {
    "title": "string",
    "description": "string",
    "status": "string"
  }
  ```
- **レスポンス**:
  - **200 OK**: 更新された TODO の詳細
  - **404 Not Found**: TODO が見つからない場合

### 5. TODO の削除
- **URL**: `/todos/{id}`
- **メソッド**: `DELETE`
- **レスポンス**:
  - **204 No Content**: 削除成功
  - **404 Not Found**: TODO が見つからない場合

## エラーレスポンス
- **400 Bad Request**: リクエストが不正な場合
- **500 Internal Server Error**: サーバーエラーが発生した場合