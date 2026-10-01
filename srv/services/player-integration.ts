import cds, { Request } from "@sap/cds";

import { findCustomer } from "../repositories/customers.js";

interface CRMPlayerProfile {
  ID: string;
  displayName: string | null;
  email: string | null;
  vipTier: string | null;
  averageRating: number | null;
  statusCode: string | null;
}

export async function getCustomerCRMProfile(req: Request) {
  const customerID = String(req.params[0]?.ID ?? "");
  const customer = await findCustomer(cds.tx(req), customerID);
  if (!customer) return req.reject(404, `Customer ${customerID} not found`);
  if (!customer.playerId) {
    return req.reject(404, `Customer ${customerID} is not linked to a CRM player`);
  }

  const crm = await cds.connect.to("PlayerIntegrationService");
  const profile = (await crm.run(
    SELECT.one
      .from("PlayerIntegrationService.Players")
      .where({ ID: customer.playerId }),
  )) as CRMPlayerProfile | undefined;

  if (!profile) {
    return req.reject(404, `CRM player ${customer.playerId} not found`);
  }
  return profile;
}
