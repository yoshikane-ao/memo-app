import type {
  ForwardOrder,
  GameState,
  PlayerId,
  PlayerState,
  StockKey,
  TradeAction,
  TradeMode,
} from '../types';

export const FORWARD_ORDER_LEAD_TURNS = 2;
export const FORWARD_ORDER_FEE_RATE = 0.03;

export function calculateForwardOrderFee(orderAmount: number): number {
  if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(orderAmount * FORWARD_ORDER_FEE_RATE));
}

export function canPlaceForwardOrder(
  player: PlayerState,
  orderAmount: number,
): {
  allowed: boolean;
  reason?: string;
  fee: number;
  requiredCash: number;
} {
  const fee = calculateForwardOrderFee(orderAmount);
  const requiredCash = orderAmount + fee;
  if (orderAmount <= 0) {
    return { allowed: false, reason: '注文額を指定してください。', fee, requiredCash };
  }
  if (player.cash < requiredCash) {
    return {
      allowed: false,
      reason: `予約注文には注文額 ${orderAmount.toLocaleString('ja-JP')} 円＋予約料 ${fee.toLocaleString('ja-JP')} 円が必要です。`,
      fee,
      requiredCash,
    };
  }
  return { allowed: true, fee, requiredCash };
}

export interface PlaceForwardOrderInput {
  playerId: PlayerId;
  stockKey: StockKey;
  tradeAction: TradeAction;
  tradeMode: TradeMode;
  orderAmount: number;
  placedTurn: number;
  idHint: number;
}

export function createForwardOrder(input: PlaceForwardOrderInput): ForwardOrder {
  return {
    id: `forward-${input.idHint}`,
    playerId: input.playerId,
    stockKey: input.stockKey,
    tradeAction: input.tradeAction,
    tradeMode: input.tradeMode,
    orderAmount: input.orderAmount,
    reservationFee: calculateForwardOrderFee(input.orderAmount),
    placedTurn: input.placedTurn,
    triggerTurn: input.placedTurn + FORWARD_ORDER_LEAD_TURNS,
    status: 'pending',
  };
}

export function collectDueForwardOrders(state: GameState): ForwardOrder[] {
  return state.forwardOrders.filter(
    (order) => order.status === 'pending' && order.triggerTurn <= state.turn,
  );
}

export function cancelForwardOrder(state: GameState, orderId: string): ForwardOrder | null {
  const order = state.forwardOrders.find((item) => item.id === orderId);
  if (!order || order.status !== 'pending') {
    return null;
  }
  order.status = 'canceled';
  return order;
}

export function markForwardOrderSettled(order: ForwardOrder): void {
  order.status = 'settled';
}
