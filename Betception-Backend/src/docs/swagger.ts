import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import type { Express, RequestHandler } from 'express';

const components = {
  schemas: {
    RegisterInput: {
      type: 'object',
      required: ['email', 'password', 'username'],
      properties: {
        email: { type: 'string', format: 'email', example: 'demo@example.com' },
        password: { type: 'string', minLength: 8, example: 'Geheim123!' },
        username: { type: 'string', minLength: 3, maxLength: 32, example: 'demouser' },
      },
    },
    LoginInput: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'demo@example.com' },
        password: { type: 'string', minLength: 8, example: 'Geheim123!' },
      },
    },
    AuthResponse: {
      type: 'object',
      required: ['accessToken'],
      properties: {
        accessToken: { type: 'string', description: 'JWT access token to be sent via Authorization header.' },
      },
    },
    MessageResponse: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', example: 'Registered' },
      },
    },
    ValidationErrorResponse: {
      type: 'object',
      required: ['errors'],
      properties: {
        errors: {
          type: 'object',
          required: ['fieldErrors', 'formErrors'],
          properties: {
            fieldErrors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            formErrors: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    TokenUser: {
      type: 'object',
      required: ['sub', 'email', 'username'],
      properties: {
        sub: { type: 'string', description: 'User id' },
        email: { type: 'string', format: 'email' },
        username: { type: 'string' },
      },
    },
    CurrentUserResponse: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { $ref: '#/components/schemas/TokenUser' },
      },
    },
    UserProfile: {
      type: 'object',
      required: ['id', 'username', 'email', 'balance', 'xp', 'level'],
      properties: {
        id: { type: 'string' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        balance: {
          type: 'string',
          description: 'Decimal string with two fractional digits.',
          example: '1234.56',
        },
        xp: { type: 'integer' },
        level: { type: 'integer' },
      },
    },
    UserProfileResponse: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { $ref: '#/components/schemas/UserProfile' },
      },
    },
    WalletSummary: {
      type: 'object',
      required: ['id', 'username', 'balance', 'xp', 'level', 'lastDailyRewardAt'],
      properties: {
        id: { type: 'string' },
        username: { type: 'string' },
        balance: {
          type: 'number',
          format: 'double',
          description: 'Numeric balance rounded to two decimals.',
          example: 1234.56,
        },
        xp: { type: 'integer' },
        level: { type: 'integer' },
        lastDailyRewardAt: {
          type: 'string',
          format: 'date',
          nullable: true,
          description: 'Last day (UTC) a daily reward was claimed.',
        },
      },
    },
    WalletTransaction: {
      type: 'object',
      required: ['id', 'kind', 'amount', 'createdAt'],
      properties: {
        id: { type: 'string' },
        kind: {
          type: 'string',
          enum: ['deposit', 'withdraw', 'bet_place', 'bet_win', 'bet_refund', 'adjustment', 'reward'],
        },
        amount: {
          type: 'number',
          format: 'double',
          description: 'Transaction amount rounded to two decimals (negative for debits).',
        },
        refTable: { type: 'string', nullable: true },
        refId: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    WalletTransactionsResponse: {
      type: 'object',
      required: ['page', 'pageSize', 'total', 'items'],
      properties: {
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1 },
        total: { type: 'integer', minimum: 0 },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/WalletTransaction' },
        },
      },
    },
    WalletAdjustmentInput: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: { type: 'number', format: 'double', minimum: 0.01 },
        reference: { type: 'string', maxLength: 32, nullable: true },
      },
    },
    WalletAdjustmentResponse: {
      type: 'object',
      required: ['message', 'balance', 'transactionId'],
      properties: {
        message: { type: 'string' },
        balance: { type: 'number', format: 'double' },
        transactionId: { type: 'string' },
      },
    },
    PowerupType: {
      type: 'object',
      required: ['id', 'code', 'title', 'description', 'minLevel', 'price', 'effect'],
      properties: {
        id: { type: 'integer' },
        code: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        minLevel: { type: 'integer' },
        price: {
          type: 'number',
          format: 'double',
          description: 'Power-up price rounded to two decimals.',
        },
        effect: { type: 'object', additionalProperties: true, nullable: true },
      },
    },
    PowerupListResponse: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/PowerupType' },
        },
      },
    },
    PurchasePowerupInput: {
      type: 'object',
      required: ['typeId', 'quantity'],
      properties: {
        typeId: { type: 'integer', minimum: 1 },
        quantity: { type: 'integer', minimum: 1, maximum: 99, default: 1 },
      },
    },
    PurchasePowerupResponse: {
      type: 'object',
      required: ['message', 'balance', 'quantity'],
      properties: {
        message: { type: 'string', example: 'Power-up purchased' },
        balance: { type: 'number', format: 'double' },
        quantity: { type: 'integer', minimum: 0 },
      },
    },
    ConsumePowerupInput: {
      type: 'object',
      required: ['typeId'],
      properties: {
        typeId: { type: 'integer', minimum: 1 },
        quantity: { type: 'integer', minimum: 1, maximum: 10, default: 1 },
        roundId: {
          type: 'string',
          nullable: true,
          description: 'Optional round to link the effect to.',
        },
      },
    },
    ConsumePowerupResponse: {
      type: 'object',
      required: ['message', 'consumed', 'remaining', 'powerup'],
      properties: {
        message: { type: 'string', example: 'Power-up activated' },
        consumed: { type: 'integer', minimum: 1 },
        remaining: { type: 'integer', minimum: 0 },
        roundId: { type: 'string', nullable: true },
        powerup: {
          type: 'object',
          required: ['id', 'code', 'title'],
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            title: { type: 'string' },
            effect: { type: 'object', additionalProperties: true, nullable: true },
          },
        },
      },
    },
    BlackjackCard: {
      type: 'object',
      required: ['id', 'rank', 'suit', 'drawOrder'],
      properties: {
        id: { type: 'string' },
        rank: {
          type: 'string',
          enum: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
        },
        suit: { type: 'string', enum: ['C', 'D', 'H', 'S'] },
        drawOrder: { type: 'integer', minimum: 1 },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    BlackjackHand: {
      type: 'object',
      required: ['id', 'ownerType', 'status', 'cards'],
      properties: {
        id: { type: 'string' },
        ownerType: { type: 'string', enum: ['dealer', 'player'] },
        status: {
          type: 'string',
          enum: ['active', 'stood', 'busted', 'blackjack', 'surrendered', 'settled'],
        },
        handValue: { type: 'integer', nullable: true },
        cards: {
          type: 'array',
          items: { $ref: '#/components/schemas/BlackjackCard' },
        },
      },
    },
    BlackjackSideBet: {
      type: 'object',
      required: ['id', 'type', 'amount', 'status', 'targetContext'],
      properties: {
        id: { type: 'string' },
        type: { type: 'string', example: 'FIRST_CARD_COLOR' },
        amount: { type: 'number', format: 'double' },
        status: {
          type: 'string',
          enum: ['placed', 'won', 'lost', 'refunded', 'void'],
        },
        odds: { type: 'number', format: 'double', nullable: true },
        predictedColor: { type: 'string', enum: ['RED', 'BLACK'], nullable: true },
        predictedSuit: { type: 'string', enum: ['C', 'D', 'H', 'S'], nullable: true },
        predictedRank: {
          type: 'string',
          enum: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
          nullable: true,
        },
        targetContext: {
          type: 'string',
          enum: ['FIRST_PLAYER_CARD', 'FIRST_DEALER_CARD'],
        },
        settledAmount: { type: 'number', format: 'double', nullable: true },
        settledAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    BlackjackMainBet: {
      type: 'object',
      required: ['id', 'amount', 'status'],
      properties: {
        id: { type: 'string' },
        amount: { type: 'number', format: 'double' },
        status: {
          type: 'string',
          enum: ['placed', 'won', 'lost', 'push', 'refunded', 'void'],
        },
        payoutMultiplier: { type: 'number', format: 'double', nullable: true },
        settledAmount: { type: 'number', format: 'double', nullable: true },
        settledAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    BlackjackRound: {
      type: 'object',
      required: ['id', 'status', 'mainBet', 'playerHand', 'dealerHand', 'sideBets'],
      properties: {
        id: { type: 'string' },
        status: {
          type: 'string',
          enum: ['created', 'dealing', 'in_progress', 'settled', 'aborted'],
        },
        startedAt: { type: 'string', format: 'date-time', nullable: true },
        endedAt: { type: 'string', format: 'date-time', nullable: true },
        mainBet: { $ref: '#/components/schemas/BlackjackMainBet' },
        playerHand: { $ref: '#/components/schemas/BlackjackHand' },
        dealerHand: { $ref: '#/components/schemas/BlackjackHand' },
        sideBets: {
          type: 'array',
          items: { $ref: '#/components/schemas/BlackjackSideBet' },
        },
      },
    },
    BlackjackSideBetPlacement: {
      type: 'object',
      required: ['typeId', 'amount'],
      properties: {
        typeId: { type: 'integer', minimum: 1 },
        amount: { type: 'number', format: 'double', minimum: 0.01 },
        predictedColor: { type: 'string', enum: ['RED', 'BLACK'], nullable: true },
        predictedSuit: { type: 'string', enum: ['C', 'D', 'H', 'S'], nullable: true },
        predictedRank: {
          type: 'string',
          enum: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
          nullable: true,
        },
        targetContext: {
          type: 'string',
          enum: ['FIRST_PLAYER_CARD', 'FIRST_DEALER_CARD'],
          nullable: true,
        },
      },
    },
    StartRoundInput: {
      type: 'object',
      required: ['betAmount'],
      properties: {
        betAmount: { type: 'number', format: 'double', minimum: 1 },
        sideBets: {
          type: 'array',
          items: { $ref: '#/components/schemas/BlackjackSideBetPlacement' },
          default: [],
        },
      },
    },
    BlackjackRoundResponse: {
      type: 'object',
      required: ['round'],
      properties: {
        round: { $ref: '#/components/schemas/BlackjackRound' },
      },
    },
    FairnessRound: {
      type: 'object',
      required: ['roundId', 'status', 'serverSeedHash'],
      properties: {
        roundId: { type: 'string' },
        status: {
          type: 'string',
          enum: ['created', 'dealing', 'in_progress', 'settled', 'aborted'],
        },
        createdAt: { type: 'string', format: 'date-time' },
        startedAt: { type: 'string', format: 'date-time', nullable: true },
        endedAt: { type: 'string', format: 'date-time', nullable: true },
        serverSeedHash: { type: 'string', nullable: true },
        serverSeed: { type: 'string', nullable: true },
        revealedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    FairnessRoundResponse: {
      type: 'object',
      required: ['round'],
      properties: {
        round: { $ref: '#/components/schemas/FairnessRound' },
      },
    },
    FairnessHistoryResponse: {
      type: 'object',
      required: ['page', 'pageSize', 'total', 'items'],
      properties: {
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1 },
        total: { type: 'integer', minimum: 0 },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/FairnessRound' },
        },
      },
    },
    InventoryItem: {
      type: 'object',
      required: ['id', 'quantity', 'acquiredAt', 'type'],
      properties: {
        id: { type: 'string' },
        quantity: { type: 'integer' },
        acquiredAt: { type: 'string', format: 'date-time' },
        type: { allOf: [{ $ref: '#/components/schemas/PowerupType' }], nullable: true },
      },
    },
    InventoryResponse: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/InventoryItem' },
        },
      },
    },
    DailyRewardResponse: {
      type: 'object',
      required: ['claimedAmount', 'balance', 'eligibleAt'],
      properties: {
        claimedAmount: { type: 'number', format: 'double' },
        balance: { type: 'number', format: 'double' },
        eligibleAt: { type: 'string', format: 'date-time' },
      },
    },
    LeaderboardBalanceItem: {
      type: 'object',
      required: ['rank', 'userId', 'username', 'balance'],
      properties: {
        rank: { type: 'integer', minimum: 1 },
        userId: { type: 'string' },
        username: { type: 'string' },
        balance: {
          type: 'number',
          format: 'double',
          description: 'Current wallet balance rounded to two decimals.',
        },
      },
    },
    LeaderboardLevelItem: {
      type: 'object',
      required: ['rank', 'userId', 'username', 'level', 'xp'],
      properties: {
        rank: { type: 'integer', minimum: 1 },
        userId: { type: 'string' },
        username: { type: 'string' },
        level: { type: 'integer' },
        xp: { type: 'integer' },
      },
    },
    LeaderboardWinningsItem: {
      type: 'object',
      required: ['rank', 'userId', 'netWinnings7d'],
      properties: {
        rank: { type: 'integer', minimum: 1 },
        userId: { type: 'string' },
        netWinnings7d: {
          type: 'number',
          format: 'double',
          description: 'Net winnings over the past 7 days.',
        },
      },
    },
    LeaderboardBalanceResponse: {
      type: 'object',
      required: ['total', 'limit', 'offset', 'currentUserRank', 'items'],
      properties: {
        total: { type: 'integer', minimum: 0 },
        limit: { type: 'integer', minimum: 1 },
        offset: { type: 'integer', minimum: 0 },
        currentUserRank: { type: 'integer', nullable: true },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/LeaderboardBalanceItem' },
        },
      },
    },
    LeaderboardLevelResponse: {
      type: 'object',
      required: ['total', 'limit', 'offset', 'currentUserRank', 'items'],
      properties: {
        total: { type: 'integer', minimum: 0 },
        limit: { type: 'integer', minimum: 1 },
        offset: { type: 'integer', minimum: 0 },
        currentUserRank: { type: 'integer', nullable: true },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/LeaderboardLevelItem' },
        },
      },
    },
    LeaderboardWinningsResponse: {
      type: 'object',
      required: ['total', 'limit', 'offset', 'currentUserRank', 'items'],
      properties: {
        total: { type: 'integer', minimum: 0 },
        limit: { type: 'integer', minimum: 1 },
        offset: { type: 'integer', minimum: 0 },
        currentUserRank: { type: 'integer', nullable: true },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/LeaderboardWinningsItem' },
        },
      },
    },
  },
  securitySchemes: {
    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
  },
} as const;

const limitOffsetParameters = [
  {
    in: 'query',
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    description: 'Number of rows to include.',
  },
  {
    in: 'query',
    name: 'offset',
    required: false,
    schema: { type: 'integer', minimum: 0, default: 0 },
    description: 'Number of rows to skip (for pagination).',
  },
] as const;

const paths = {
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Simple health probe',
      security: [],
      responses: {
        200: {
          description: 'Service is up.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', example: 'ok' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Create a new player account',
      description: 'Fresh accounts automatically receive the configured starting balance (default 1000). Override via `NEW_USER_INITIAL_BALANCE`.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Registered successfully.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        400: {
          description: 'Invalid payload.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } },
          },
        },
        409: {
          description: 'Email or username already exists.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Authenticate and receive an access token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Credentials valid.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
          },
        },
        400: {
          description: 'Invalid payload.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } },
          },
        },
        401: {
          description: 'Invalid credentials.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Exchange a refresh token cookie for a new access token',
      description: 'Requires a valid `refresh_token` cookie set by the login endpoint.',
      security: [],
      responses: {
        200: {
          description: 'New access token issued.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
          },
        },
        401: {
          description: 'Missing or invalid refresh token.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Invalidate the active refresh session',
      description: 'Clears the `refresh_token` cookie and deletes the stored session.',
      security: [],
      responses: {
        204: { description: 'Successfully logged out.' },
      },
    },
  },
  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Return the authenticated token payload',
      responses: {
        200: {
          description: 'Current authenticated user.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CurrentUserResponse' } },
          },
        },
        401: {
          description: 'Missing or invalid bearer token.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Fetch a public profile by id',
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'User id (numeric string).',
        },
      ],
      responses: {
        200: {
          description: 'Public profile data.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserProfileResponse' } },
          },
        },
        404: {
          description: 'User not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/wallet': {
    get: {
      tags: ['Wallet'],
      summary: 'Return wallet summary for the authenticated user',
      responses: {
        200: {
          description: 'Wallet overview.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/WalletSummary' } },
          },
        },
        404: {
          description: 'User not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/wallet/transactions': {
    get: {
      tags: ['Wallet'],
      summary: 'Paginated wallet transaction history',
      parameters: [
        {
          in: 'query',
          name: 'page',
          required: false,
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number (1-indexed).',
        },
        {
          in: 'query',
          name: 'limit',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Page size.',
        },
      ],
      responses: {
        200: {
          description: 'Transactions returned.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/WalletTransactionsResponse' } },
          },
        },
      },
    },
  },
  '/wallet/deposit': {
    post: {
      tags: ['Wallet'],
      summary: 'Record a deposit',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/WalletAdjustmentInput' } },
        },
      },
      responses: {
        201: {
          description: 'Deposit recorded.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/WalletAdjustmentResponse' } },
          },
        },
        404: {
          description: 'User not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/wallet/withdraw': {
    post: {
      tags: ['Wallet'],
      summary: 'Record a withdrawal',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/WalletAdjustmentInput' } },
        },
      },
      responses: {
        201: {
          description: 'Withdrawal recorded.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/WalletAdjustmentResponse' } },
          },
        },
        400: {
          description: 'Insufficient balance or invalid request.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        404: {
          description: 'User not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/fairness/rounds/{roundId}': {
    get: {
      tags: ['Fairness'],
      summary: 'Display server seed information for a round',
      parameters: [
        {
          in: 'path',
          name: 'roundId',
          required: true,
          schema: { type: 'string' },
          description: 'Round identifier.',
        },
      ],
      responses: {
        200: {
          description: 'Fairness payload for the round.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/FairnessRoundResponse' } },
          },
        },
        404: {
          description: 'Round missing.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/fairness/rounds/history': {
    get: {
      tags: ['Fairness'],
      summary: 'List recently settled rounds with revealed seeds',
      parameters: [
        {
          in: 'query',
          name: 'page',
          required: false,
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        {
          in: 'query',
          name: 'limit',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      ],
      responses: {
        200: {
          description: 'History page.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/FairnessHistoryResponse' } },
          },
        },
      },
    },
  },
  '/shop/powerups': {
    get: {
      tags: ['Shop'],
      summary: 'List available power-ups',
      security: [],
      responses: {
        200: {
          description: 'Available power-ups.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PowerupListResponse' } },
          },
        },
      },
    },
  },
  '/shop/powerups/purchase': {
    post: {
      tags: ['Shop'],
      summary: 'Buy a power-up for the authenticated user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PurchasePowerupInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Purchase successful.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PurchasePowerupResponse' } },
          },
        },
        400: {
          description: 'Invalid payload or insufficient balance.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        403: {
          description: 'Player level too low.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        404: {
          description: 'Power-up or user missing.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/inventory/powerups': {
    get: {
      tags: ['Inventory'],
      summary: 'List owned power-ups for the authenticated user',
      responses: {
        200: {
          description: 'Inventory items.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/InventoryResponse' } },
          },
        },
      },
    },
  },
  '/powerups/consume': {
    post: {
      tags: ['Powerups'],
      summary: 'Consume a power-up from inventory',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ConsumePowerupInput' } },
        },
      },
      responses: {
        201: {
          description: 'Consumption recorded.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ConsumePowerupResponse' } },
          },
        },
        400: {
          description: 'Power-up cannot be consumed (e.g. insufficient stock).',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        403: {
          description: 'Round not owned by the user.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        404: {
          description: 'Inventory item or round missing.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/rewards/daily/claim': {
    post: {
      tags: ['Rewards'],
      summary: 'Claim the daily login reward',
      responses: {
        200: {
          description: 'Reward granted.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/DailyRewardResponse' } },
          },
        },
        409: {
          description: 'Reward already claimed today.',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/MessageResponse' },
                  {
                    type: 'object',
                    required: ['eligibleAt'],
                    properties: { eligibleAt: { type: 'string', format: 'date-time' } },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  '/leaderboard/balance': {
    get: {
      tags: ['Leaderboard'],
      summary: 'Top balances leaderboard',
      parameters: [...limitOffsetParameters],
      responses: {
        200: {
          description: 'Leaderboard page.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LeaderboardBalanceResponse' } },
          },
        },
      },
    },
  },
  '/leaderboard/level': {
    get: {
      tags: ['Leaderboard'],
      summary: 'Top player levels leaderboard',
      parameters: [...limitOffsetParameters],
      responses: {
        200: {
          description: 'Leaderboard page.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LeaderboardLevelResponse' } },
          },
        },
      },
    },
  },
  '/leaderboard/winnings': {
    get: {
      tags: ['Leaderboard'],
      summary: 'Top net winnings (7d) leaderboard',
      parameters: [...limitOffsetParameters],
      responses: {
        200: {
          description: 'Leaderboard page.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LeaderboardWinningsResponse' } },
          },
        },
      },
    },
  },
  '/round/start': {
    post: {
      tags: ['Blackjack'],
      summary: 'Start a new Blackjack round',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/StartRoundInput' } },
        },
      },
      responses: {
        201: {
          description: 'Round created and cards dealt.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/BlackjackRoundResponse' } },
          },
        },
        400: {
          description: 'Invalid payload or insufficient balance.',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/ValidationErrorResponse' },
                  { $ref: '#/components/schemas/MessageResponse' },
                ],
              },
            },
          },
        },
        409: {
          description: 'Player already has an active round.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/round/hit/{roundId}': {
    post: {
      tags: ['Blackjack'],
      summary: 'Draw an additional card for the player',
      parameters: [
        {
          in: 'path',
          name: 'roundId',
          required: true,
          schema: { type: 'string' },
          description: 'Round identifier.',
        },
      ],
      responses: {
        200: {
          description: 'Updated round state.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/BlackjackRoundResponse' } },
          },
        },
        400: {
          description: 'Hand no longer accepts hits.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        404: {
          description: 'Round not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        409: {
          description: 'Round is not active.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/round/stand/{roundId}': {
    post: {
      tags: ['Blackjack'],
      summary: 'Stand and let the dealer finish the hand',
      parameters: [
        {
          in: 'path',
          name: 'roundId',
          required: true,
          schema: { type: 'string' },
          description: 'Round identifier.',
        },
      ],
      responses: {
        200: {
          description: 'Dealer hand resolved.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/BlackjackRoundResponse' } },
          },
        },
        400: {
          description: 'Player hand cannot stand.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        404: {
          description: 'Round not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        409: {
          description: 'Round is already settled or inactive.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/round/{roundId}': {
    get: {
      tags: ['Blackjack'],
      summary: 'Fetch the current round snapshot',
      parameters: [
        {
          in: 'path',
          name: 'roundId',
          required: true,
          schema: { type: 'string' },
          description: 'Round identifier.',
        },
      ],
      responses: {
        200: {
          description: 'Current round.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/BlackjackRoundResponse' } },
          },
        },
        404: {
          description: 'Round not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
  '/round/settle/{roundId}': {
    post: {
      tags: ['Blackjack'],
      summary: 'Finalize payouts for a round',
      parameters: [
        {
          in: 'path',
          name: 'roundId',
          required: true,
          schema: { type: 'string' },
          description: 'Round identifier.',
        },
      ],
      responses: {
        200: {
          description: 'Round settled.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/BlackjackRoundResponse' } },
          },
        },
        400: {
          description: 'Round cannot be settled yet.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        404: {
          description: 'Round not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
        409: {
          description: 'Round already settled.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } },
          },
        },
      },
    },
  },
} as const;

type SwaggerOptions = {
  middlewares?: RequestHandler[];
};

export function setupSwagger(app: Express, options?: SwaggerOptions) {
  const spec = swaggerJSDoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'BetCeption API',
        version: '1.0.0',
        description:
          'Interactive documentation for BetCeption. Use the Authorize button to paste a JWT access token to try secured endpoints.',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local development server' }],
      tags: [
        { name: 'Auth', description: 'Authentication and session endpoints.' },
        { name: 'Users', description: 'User profile endpoints.' },
        { name: 'Wallet', description: 'Wallet summary and history.' },
        { name: 'Shop', description: 'Power-up catalog and purchases.' },
        { name: 'Inventory', description: 'Player-owned power-ups.' },
        { name: 'Fairness', description: 'Provably-fair seed transparency endpoints.' },
        { name: 'Powerups', description: 'Power-up activation and runtime usage.' },
        { name: 'Rewards', description: 'Daily rewards and bonuses.' },
        { name: 'Blackjack', description: 'Blackjack round lifecycle endpoints.' },
        { name: 'Leaderboard', description: 'Competitive rankings.' },
        { name: 'System', description: 'Operational utilities.' },
      ],
      components,
      security: [{ bearerAuth: [] }],
      paths,
    },
    apis: ['src/**/*.router.ts'],
  });

  const guards = options?.middlewares ?? [];
  app.use('/docs', ...guards, swaggerUi.serve, swaggerUi.setup(spec));
}
