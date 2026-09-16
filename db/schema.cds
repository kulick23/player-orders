using { cuid, managed } from '@sap/cds/common';

namespace playerorders;

entity Customer : cuid, managed {
  displayName : String(100) @mandatory;
  email       : String(100);
  playerId    : String(36);
  segment     : String(30);
  totalSpent  : Decimal(10,2) default 0;

  orders      : Composition of many SalesOrder on orders.customer = $self;
}

entity GameProduct : cuid, managed {
  name          : String(100) @mandatory;
  description   : String(300);
  type          : String(30);
  price         : Decimal(10,2) @mandatory;
  active        : Boolean default true;
  stockRelevant : Boolean default false;
  stockQuantity : Integer default 0;
}

entity OrderStatus {
  key code    : String(20);
  description : String(100);
  criticality : Integer;
}

entity SalesOrder : cuid, managed {
  customer       : Association to Customer @mandatory;
  orderDate      : DateTime;
  status         : Association to OrderStatus;
  totalAmount    : Decimal(10,2) default 0;
  paymentMethod  : String(30);
  discountAmount : Decimal(10,2) default 0;
  note           : String(300);

  items          : Composition of many SalesOrderItem on items.order = $self;
  payments       : Composition of many PaymentTransaction on payments.order = $self;
  fulfillments   : Composition of many FulfillmentLog on fulfillments.order = $self;
}

entity SalesOrderItem : cuid, managed {
  order      : Association to SalesOrder;
  product    : Association to GameProduct @mandatory;
  quantity   : Integer default 1 @assert.range: [1, 999];
  unitPrice  : Decimal(10,2);
  lineAmount : Decimal(10,2);
}

entity PaymentTransaction : cuid, managed {
  order           : Association to SalesOrder;
  provider        : String(50);
  transactionDate : DateTime;
  amount          : Decimal(10,2);
  status          : String(30);
  message         : String(300);
}

entity FulfillmentLog : cuid, managed {
  order       : Association to SalesOrder;
  product     : Association to GameProduct;
  fulfilledAt : DateTime;
  result      : String(30);
  message     : String(300);
}