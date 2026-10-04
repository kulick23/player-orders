@cds.external
@path: '/integration/players'
service PlayerIntegrationService {
  type OrderIssueReceipt {
    ID         : UUID;
    statusCode : String(20);
  }

  @readonly
  @cds.persistence.skip
  entity Players {
    key ID            : UUID;
        displayName   : String(100);
        email         : String(100);
        vipTier       : String(20);
        averageRating : Decimal(2,1);
        statusCode    : String(20);
  }

  action reportOrderIssue(
    orderID      : UUID,
    playerID     : UUID,
    categoryCode : String(30),
    rating       : Integer,
    description  : String(1000),
    orderDate    : DateTime,
    orderTotal   : Decimal(10,2)
  ) returns OrderIssueReceipt;
}
