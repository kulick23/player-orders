import cds, { Transaction } from "@sap/cds";
import type { GameProduct } from "#cds-models/playerorders";

const { SELECT, UPDATE } = cds.ql;
const GAME_PRODUCT = "playerorders.GameProduct";

export function findGameProduct(tx: Transaction, ID: string) {
  return tx.run(
    SELECT.one.from(GAME_PRODUCT).where({ ID }),
  ) as Promise<GameProduct | undefined>;
}

export function findGameProductID(tx: Transaction, ID: string) {
  return tx.run(
    SELECT.one.from(GAME_PRODUCT).columns("ID").where({ ID }),
  ) as Promise<Pick<GameProduct, "ID"> | undefined>;
}

export function listGameProductStock(tx: Transaction) {
  return tx.run(
    SELECT.from(GAME_PRODUCT).columns(
      "active",
      "stockRelevant",
      "stockQuantity",
    ),
  ) as Promise<GameProduct[]>;
}

export async function updateGameProduct(
  tx: Transaction,
  ID: string,
  data: Partial<GameProduct>,
) {
  await tx.run(UPDATE.entity(GAME_PRODUCT).set(data).where({ ID }));
}
