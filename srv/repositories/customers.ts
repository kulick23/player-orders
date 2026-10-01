import cds, { Transaction } from "@sap/cds";
import type { Customer } from "#cds-models/playerorders";

const { SELECT } = cds.ql;
const CUSTOMER = "playerorders.Customer";

export function findCustomer(tx: Transaction, ID: string) {
  return tx.run(
    SELECT.one.from(CUSTOMER).where({ ID }),
  ) as Promise<Customer | undefined>;
}

export function findCustomerByPlayerID(tx: Transaction, playerId: string) {
  return tx.run(
    SELECT.one.from(CUSTOMER).where({ playerId }),
  ) as Promise<Customer | undefined>;
}
