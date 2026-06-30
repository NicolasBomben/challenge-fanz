import {
  getAllBuyers,
  getBuyerById,
  getBuyerByEmail,
  getOrdersByBuyer,
} from "@/lib/store";
import type { CommandContext, CommandResult, CommandHandler } from "../types";
import { readString, requireEntity } from "../helpers";

//Lista todos los compradores de la cuenta. Solo lectura.
function listBuyers(ctx: CommandContext): CommandResult {
  const buyers = getAllBuyers(ctx.state);
  return {
    ok: true,
    data: buyers,
    message: `Found ${buyers.length} buyer(s).`,
  };
}

// Devuelve un comprador (por id o por email) junto con sus órdenes. Solo lectura.
function getBuyer(ctx: CommandContext): CommandResult {
  const email = readString(ctx.parsed.flags, "email");

  // Búsqueda por email
  if (email !== undefined) {
    const buyer = getBuyerByEmail(ctx.state, email);
    if (!buyer) {
      return { ok: false, error: `Buyer with email "${email}" not found.` };
    }
    const orders = getOrdersByBuyer(ctx.state, buyer.id);
    return {
      ok: true,
      data: { buyer, orders },
      message: `Buyer ${buyer.id} has ${orders.length} order(s).`,
    };
  }

  // Búsqueda por id
  const found = requireEntity(ctx, getBuyerById, "buyer");
  if (!found.ok) return found.error;

  const orders = getOrdersByBuyer(ctx.state, found.id);
  return {
    ok: true,
    data: { buyer: found.entity, orders },
    message: `Buyer ${found.id} has ${orders.length} order(s).`,
  };
}

export const buyerCommands: Record<string, CommandHandler> = {
  list: listBuyers,
  get: getBuyer,
};
