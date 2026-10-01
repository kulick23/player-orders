@cds.external
@path: '/integration/players'
service PlayerIntegrationService {
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
}
