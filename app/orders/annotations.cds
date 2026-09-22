using PlayerOrderService as service from '../../srv/order-service';
annotate service.SalesOrders with @(
    UI.CreateHidden : {
        $edmJson : {
            $Not : {
                $Path : '/PlayerOrderService.EntityContainer/Configuration/canCreateOrder'
            }
        }
    },
    UI.UpdateHidden : {
        $edmJson : {
            $Not : {
                $Path : '/PlayerOrderService.EntityContainer/Configuration/canUpdateOrder'
            }
        }
    },
    UI.DeleteHidden : {
        $edmJson : {
            $Not : {
                $Path : '/PlayerOrderService.EntityContainer/Configuration/canDeleteOrder'
            }
        }
    },
        UI.HeaderInfo : {
        $Type : 'UI.HeaderInfoType',
        TypeName : 'Sales Order',
        TypeNamePlural : 'Sales Orders',
        Title : {
            $Type : 'UI.DataField',
            Value : customer.displayName,
        },
        Description : {
            $Type : 'UI.DataField',
            Value : status.description,
        },
    },
      UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Customer',
                Value : customer_ID,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Order Date',
                Value : orderDate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Status',
                Value : status.description,
                Criticality : status.criticality,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Total Amount',
                Value : totalAmount,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Payment Method',
                Value : paymentMethod,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Discount',
                Value : discountAmount,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Note',
                Value : note,
            },
        ],
    },
        UI.Identification : [
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'PlayerOrderService.submitOrder',
            Label : 'Submit Order',
            ![@UI.Hidden] : {
                $edmJson : {
                    $Not : {
                        $Path : '/PlayerOrderService.EntityContainer/Configuration/canSubmitOrder'
                    }
                }
            },
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'PlayerOrderService.markAsPaid',
            Label : 'Mark as Paid',
            ![@UI.Hidden] : {
                $edmJson : {
                    $Not : {
                        $Path : '/PlayerOrderService.EntityContainer/Configuration/canMarkAsPaid'
                    }
                }
            },
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'PlayerOrderService.fulfillOrder',
            Label : 'Fulfill Order',
            ![@UI.Hidden] : {
                $edmJson : {
                    $Not : {
                        $Path : '/PlayerOrderService.EntityContainer/Configuration/canFulfillOrder'
                    }
                }
            },
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'PlayerOrderService.cancelOrder',
            Label : 'Cancel Order',
            ![@UI.Hidden] : {
                $edmJson : {
                    $Not : {
                        $Path : '/PlayerOrderService.EntityContainer/Configuration/canCancelOrder'
                    }
                }
            },
        },
    ],
     UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'OrderDetails',
            Label : 'Order Details',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'OrderItems',
            Label : 'Order Items',
            Target : 'items/@UI.LineItem',
        },
                {
            $Type : 'UI.CollectionFacet',
            ID : 'ProcessingHistory',
            Label : 'Processing History',
            Facets : [
                {
                    $Type : 'UI.ReferenceFacet',
                    ID : 'Payments',
                    Label : 'Payments',
                    Target : 'payments/@UI.LineItem',
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    ID : 'Fulfillments',
                    Label : 'Fulfillment Log',
                    Target : 'fulfillments/@UI.LineItem',
                },
            ],
        },
    ],
    UI.SelectionFields : [
    customer_ID,
    status_code,
    orderDate,
    totalAmount,
    paymentMethod,
],
  UI.LineItem : [
    {
        $Type : 'UI.DataField',
        Label : 'Customer',
        Value : customer.displayName,
    },
    {
        $Type : 'UI.DataField',
        Label : 'Order Date',
        Value : orderDate,
    },
    {
        $Type : 'UI.DataField',
        Label : 'Status',
        Value : status.description,
        Criticality : status.criticality,
    },
    {
        $Type : 'UI.DataField',
        Label : 'Total Amount',
        Value : totalAmount,
    },
    {
        $Type : 'UI.DataField',
        Label : 'Payment Method',
        Value : paymentMethod,
    },
    {
        $Type : 'UI.DataField',
        Label : 'Discount',
        Value : discountAmount,
    },
],
);

annotate service.SalesOrders with {
    customer @(
        Common.Text : customer.displayName,
        Common.TextArrangement : #TextOnly,
        Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Customers',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : customer_ID,
                ValueListProperty : 'ID',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'displayName',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'email',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'playerId',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'segment',
            },
        ],
        }
    );
};

annotate service.SalesOrders with {
    status @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'OrderStatuses',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : status_code,
                ValueListProperty : 'code',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'description',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'criticality',
            },
        ],
    }
};

annotate service.SalesOrderItems with @(
    UI.HeaderInfo : {
        $Type : 'UI.HeaderInfoType',
        TypeName : 'Order Item',
        TypeNamePlural : 'Order Items',
        Title : {
            $Type : 'UI.DataField',
            Value : product.name,
        },
        Description : {
            $Type : 'UI.DataField',
            Value : lineAmount,
        },
    },

    UI.FieldGroup #ItemDetails : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Product',
                Value : product_ID,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Quantity',
                Value : quantity,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Unit Price',
                Value : unitPrice,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Line Amount',
                Value : lineAmount,
            },
        ],
    },

    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'ItemDetails',
            Label : 'Item Details',
            Target : '@UI.FieldGroup#ItemDetails',
        },
    ],

    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Product',
            Value : product_ID,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Quantity',
            Value : quantity,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Unit Price',
            Value : unitPrice,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Line Amount',
            Value : lineAmount,
        },
    ],
);
annotate service.Payments with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Provider',
            Value : provider,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Date',
            Value : transactionDate,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Amount',
            Value : amount,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Status',
            Value : status,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Message',
            Value : message,
        },
    ],
);
annotate service.FulfillmentLogs with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Product',
            Value : product.name,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Fulfilled At',
            Value : fulfilledAt,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Result',
            Value : result,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Message',
            Value : message,
        },
    ],
);
annotate service.SalesOrders with actions {
    submitOrder @(
        Common.SideEffects : {
            TargetProperties : [
                'in/status_code'
            ],
            TargetEntities : [
                'in/status'
            ]
        }
    );

    markAsPaid @(
        Common.SideEffects : {
            TargetProperties : [
                'in/status_code',
                'in/paymentMethod'
            ],
            TargetEntities : [
                'in/status',
                'in/payments'
            ]
        }
    );

    fulfillOrder @(
        Common.SideEffects : {
            TargetProperties : [
                'in/status_code'
            ],
            TargetEntities : [
                'in/status',
                'in/items',
                'in/fulfillments'
            ]
        }
    );

    cancelOrder @(
        Common.SideEffects : {
            TargetProperties : [
                'in/status_code',
                'in/note'
            ],
            TargetEntities : [
                'in/status'
            ]
        }
    );
};
annotate service.SalesOrders with actions {
    submitOrder @Core.OperationAvailable : {
        $edmJson : {
            $Eq : [
                { $Path : 'in/status_code' },
                { $String : 'NEW' }
            ]
        }
    };

    markAsPaid @Core.OperationAvailable : {
        $edmJson : {
            $Eq : [
                { $Path : 'in/status_code' },
                { $String : 'SUBMITTED' }
            ]
        }
    };

    fulfillOrder @Core.OperationAvailable : {
        $edmJson : {
            $Eq : [
                { $Path : 'in/status_code' },
                { $String : 'PAID' }
            ]
        }
    };

    cancelOrder @Core.OperationAvailable : {
        $edmJson : {
            $Or : [
                {
                    $Eq : [
                        { $Path : 'in/status_code' },
                        { $String : 'NEW' }
                    ]
                },
                {
                    $Eq : [
                        { $Path : 'in/status_code' },
                        { $String : 'SUBMITTED' }
                    ]
                }
            ]
        }
    };
};
annotate service.SalesOrders with {
    customer       @title : 'Customer';
    status         @title : 'Status';
    orderDate      @title : 'Order Date';
    totalAmount    @title : 'Total Amount';
    paymentMethod  @title : 'Payment Method';
    discountAmount @title : 'Discount';
    note           @title : 'Note';
};

annotate service.SalesOrderItems with {
    product @(
        title : 'Product',
        Common.Text : product.name,
        Common.TextArrangement : #TextOnly,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'GameProducts',
            SearchSupported : true,
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : product_ID,
                    ValueListProperty : 'ID',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'name',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'type',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'price',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'stockQuantity',
                },
            ],
        }
    );

    quantity   @title : 'Quantity';
    unitPrice  @title : 'Unit Price' @readonly;
    lineAmount @title : 'Line Amount' @readonly;
};

annotate service.SalesOrderItems with @Common.SideEffects #CalculateAmounts : {
    SourceProperties : [
        product_ID,
        quantity,
    ],
    TargetProperties : [
        'unitPrice',
        'lineAmount',
    ],
};
