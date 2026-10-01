using { playerorders as db } from '../db/schema';

@path: '/integration/orders'
@requires: 'system-user'
service OrderIntegrationService {
  function getPlayerOrderSummary(playerID: String(36)) returns OrderSummary;

  type OrderSummary {
    orderCount     : Integer;
    totalSpent     : Decimal(10,2);
    paidOrderCount : Integer;
    lastOrderDate  : DateTime;
  }
}
