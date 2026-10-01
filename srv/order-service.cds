using {playerorders as db} from '../db/schema';

@path: '/orders'
@requires: 'authenticated-user'
service PlayerOrderService {

    type InventorySummary {
        totalProducts      : Integer;
        activeProducts     : Integer;
        trackedProducts    : Integer;
        outOfStockProducts : Integer;
        lowStockProducts   : Integer;
        totalStockUnits    : Integer;
    }

    type CRMPlayerProfile {
        ID            : UUID;
        displayName   : String(100);
        email         : String(100);
        vipTier       : String(20);
        averageRating : Decimal(2,1);
        statusCode    : String(20);
    }

    @requires: ['Customer', 'SalesAdmin', 'WarehouseManager']
    function getInventorySummary() returns InventorySummary;

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
            canCreateProduct : Boolean;
            canReplenishStock : Boolean;
            canManageProductImage : Boolean;
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
    entity Customers as projection on db.Customer
        actions {
            function crmProfile() returns CRMPlayerProfile;
        };

    @restrict: [
        { grant: 'READ',             to: 'Customer' },
        { grant: '*',                to: 'SalesAdmin' },
        { grant: ['READ', 'CREATE', 'UPDATE', 'replenishStock', 'setImage'], to: 'WarehouseManager' }
    ]
    entity GameProducts as projection on db.GameProduct {
        *,
        virtual null as stockStatus : String(20)
    }
        actions {
            action replenishStock(quantity: Integer) returns GameProducts;
            action setImage(
                image: LargeBinary,
                imageType: String(100),
                imageName: String(255)
            ) returns GameProducts;
        };

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
