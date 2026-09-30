import cds, { Request } from "@sap/cds";

const { SELECT } = cds.ql;

export async function customerIDFor(req: Request) {
  const rawPlayerID = req.user.attr?.playerId as
    | string
    | string[]
    | undefined;
  const playerID = Array.isArray(rawPlayerID) ? rawPlayerID[0] : rawPlayerID;

  if (!playerID) {
    return req.reject(403, "The Customer role requires a playerId attribute");
  }

  const customer = await cds.tx(req).run(
    SELECT.one
      .from("playerorders.Customer")
      .columns("ID")
      .where({ playerId: playerID }),
  );

  if (!customer) {
    return req.reject(403, "No customer is linked to the current user");
  }

  return customer.ID as string;
}
