sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"playerorders/orders/test/integration/pages/SalesOrdersList.gen",
	"playerorders/orders/test/integration/pages/SalesOrdersObjectPage.gen",
	"playerorders/orders/test/integration/pages/SalesOrderItemsObjectPage.gen"
], function (JourneyRunner, SalesOrdersListGenerated, SalesOrdersObjectPageGenerated, SalesOrderItemsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('playerorders/orders') + '/test/flp.html#app-preview',
        pages: {
			onTheSalesOrdersListGenerated: SalesOrdersListGenerated,
			onTheSalesOrdersObjectPageGenerated: SalesOrdersObjectPageGenerated,
			onTheSalesOrderItemsObjectPageGenerated: SalesOrderItemsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

