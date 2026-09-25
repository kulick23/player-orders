using {playerorders as db} from '../db/schema';

@path: '/orders'
@requires: 'authenticated-user'
service PlayerOrderService {

    @odata.singleton
    @cds.persistence.skip
    entity Configuration {
        key ID              : String;
            canCreateOrder  : Boolean;
            canUpdateOrder  : Boolean;
            canDeleteOrder  : Boolean;
            canSubmitOrder  : Boolean;
            canMarkAsPaid   : Boolean;
            canFulfillOrder : Boolean;
            canCancelOrder  : Boolean;
    }

    @odata.draft.enabled
    @restrict: [
        { grant: 'CREATE',                         to: ['Customer', 'SalesAdmin'] },
        { grant: ['READ', 'UPDATE', 'DELETE'],     to: 'Customer', where: 'customer.playerId = $user.playerId' },
        { grant: ['submitOrder', 'cancelOrder'],   to: 'Customer', where: 'customer.playerId = $user.playerId' },
        { grant: ['READ', 'UPDATE', 'DELETE'],     to: 'SalesAdmin' },
        { grant: ['submitOrder', 'markAsPaid', 'cancelOrder'], to: 'SalesAdmin' },
        { grant: ['READ', 'fulfillOrder'],         to: 'WarehouseManager' }
    ]
    entity SalesOrders     as projection on db.SalesOrder
        actions {
            action submitOrder()                           returns SalesOrders;
            action markAsPaid(paymentProvider: String(50)) returns SalesOrders;
            action fulfillOrder()                          returns SalesOrders;
            action cancelOrder(reason: String(300))        returns SalesOrders;
        };

    @restrict: [
        { grant: '*',    to: 'Customer', where: 'order.customer.playerId = $user.playerId' },
        { grant: '*',    to: 'SalesAdmin' },
        { grant: 'READ', to: 'WarehouseManager' }
    ]
    entity SalesOrderItems as projection on db.SalesOrderItem;

    @restrict: [
        { grant: 'READ', to: 'Customer', where: 'playerId = $user.playerId' },
        { grant: '*',    to: 'SalesAdmin' },
        { grant: 'READ', to: 'WarehouseManager' }
    ]
    entity Customers as projection on db.Customer;

    @restrict: [
        { grant: 'READ',             to: 'Customer' },
        { grant: '*',                to: 'SalesAdmin' },
        { grant: ['READ', 'UPDATE'], to: 'WarehouseManager' }
    ]
    entity GameProducts as projection on db.GameProduct;

    @readonly
    entity OrderStatuses as projection on db.OrderStatus;

    @restrict: [
        { grant: 'READ', to: 'Customer', where: 'order.customer.playerId = $user.playerId' },
        { grant: 'READ', to: 'SalesAdmin' },
        { grant: 'READ', to: 'WarehouseManager' }
    ]
    entity Payments as projection on db.PaymentTransaction;

    @restrict: [
        { grant: 'READ', to: 'Customer', where: 'order.customer.playerId = $user.playerId' },
        { grant: 'READ', to: 'SalesAdmin' },
        { grant: 'READ', to: 'WarehouseManager' }
    ]
    entity FulfillmentLogs as projection on db.FulfillmentLog;
}
