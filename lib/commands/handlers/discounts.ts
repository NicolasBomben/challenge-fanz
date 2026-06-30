import type { Discount, DiscountType } from "@/lib/types";
import {
  getAllDiscounts,
  getDiscountsByEvent,
  getDiscountById,
  getDiscountByCode,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getEventById,
} from "@/lib/store";
import type { CommandContext, CommandResult, CommandHandler } from "../types";
import {
  readString,
  readNumber,
  readBoolean,
  requireEntity,
  requireRef,
  wantsDryRun,
  requireConfirmation,
  dryRunResult,
} from "../helpers";

// Formato de código: 3-20 alfanuméricos (se guarda en mayúsculas).
const CODE_PATTERN = /^[A-Za-z0-9]{3,20}$/;

//Resuelve el tipo y valor del descuento desde los shorthands del PDF.
function resolveAmount(
  flags: Record<string, string | boolean>,
  { required }: { required: boolean },
): { type?: DiscountType; value?: number; error?: string } {
  const percent = readNumber(flags, "percent");
  if (percent.error) return { error: percent.error };

  const fixed = readNumber(flags, "fixed");
  if (fixed.error) return { error: fixed.error };

  const hasPercent = percent.value !== undefined;
  const hasFixed = fixed.value !== undefined;

  if (hasPercent && hasFixed) {
    return { error: "Use only one of --percent or --fixed, not both." };
  }

  if (!hasPercent && !hasFixed) {
    if (required) {
      return {
        error: "A discount needs --percent <1-100> or --fixed <amount>.",
      };
    }
    return { type: undefined, value: undefined };
  }

  if (hasPercent) {
    if (percent.value! <= 0 || percent.value! > 100) {
      return {
        error: `--percent must be between 1 and 100, got ${percent.value}.`,
      };
    }
    return { type: "percent", value: percent.value };
  }

  if (fixed.value! <= 0) {
    return { error: `--fixed must be greater than 0, got ${fixed.value}.` };
  }
  return { type: "fixed", value: fixed.value };
}

//Valida el formato del código (sin tocar unicidad, que la valida el repository).
function validateCode(code: string): string | null {
  if (!CODE_PATTERN.test(code)) {
    return `Invalid code "${code}". Use 3-20 alphanumeric characters (e.g. DEMO20).`;
  }
  return null;
}

//Lista descuentos. Sin filtro: todos. Con --event: los del evento + los globales.
//Solo lectura.

function listDiscounts(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  if (readString(flags, "event") !== undefined) {
    const ref = requireRef(ctx, "event", getEventById, "event");
    if (!ref.ok) return ref.error;
    const discounts = getDiscountsByEvent(ctx.state, ref.id);
    return {
      ok: true,
      data: discounts,
      message: `Found ${discounts.length} discount(s) for event ${ref.id} (including global).`,
    };
  }

  const discounts = getAllDiscounts(ctx.state);
  return {
    ok: true,
    data: discounts,
    message: `Found ${discounts.length} discount(s).`,
  };
}

//Devuelve un descuento por ID o por código. Solo lectura.
function getDiscount(ctx: CommandContext): CommandResult {
  const code = readString(ctx.parsed.flags, "code");
  if (code !== undefined) {
    const discount = getDiscountByCode(ctx.state, code);
    if (!discount) {
      return {
        ok: false,
        error: `Discount with code "${code.toUpperCase()}" not found.`,
      };
    }
    return { ok: true, data: discount };
  }

  const found = requireEntity(ctx, getDiscountById, "discount");
  if (!found.ok) return found.error;
  return { ok: true, data: found.entity };
}

//Crea un descuento. Escritura. Soporta --dry-run.
function createDiscountCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const code = readString(flags, "code");
  if (!code) {
    return {
      ok: false,
      error:
        "discounts create requires --code. Usage: fanz discounts create --code DEMO20 --percent 20.",
    };
  }
  const codeError = validateCode(code);
  if (codeError) return { ok: false, error: codeError };

  const amount = resolveAmount(flags, { required: true });
  if (amount.error) return { ok: false, error: amount.error };

  let eventId: string | null = null;
  let scope: "event" | "global" = "global";
  if (readString(flags, "event") !== undefined) {
    const ref = requireRef(ctx, "event", getEventById, "event");
    if (!ref.ok) return ref.error;
    eventId = ref.id;
    scope = "event";
  }

  const limit = readNumber(flags, "limit");
  if (limit.error) return { ok: false, error: limit.error };
  if (limit.value !== undefined && limit.value <= 0) {
    return {
      ok: false,
      error: `--limit must be greater than 0, got ${limit.value}.`,
    };
  }
  const usageLimit = limit.value ?? 100;

  const data = {
    eventId,
    code: code.toUpperCase(),
    type: amount.type!,
    value: amount.value!,
    scope,
    usageLimit,
  };

  if (wantsDryRun(flags)) {
    return dryRunResult(`create discount "${data.code}"`, data);
  }

  const result = createDiscount(ctx.state, data);
  if (result.error) return { ok: false, error: result.error };

  return {
    ok: true,
    data: result.discount,
    message: `Discount ${result.discount!.id} ("${data.code}") created.`,
  };
}

//Actualiza un descuento. Escritura. Soporta --dry-run.

function updateDiscountCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const found = requireEntity(ctx, getDiscountById, "discount");
  if (!found.ok) return found.error;
  const { id } = found;

  const changes: Partial<
    Pick<Discount, "code" | "type" | "value" | "usageLimit" | "active">
  > = {};

  const code = readString(flags, "code");
  if (code !== undefined) {
    const codeError = validateCode(code);
    if (codeError) return { ok: false, error: codeError };
    changes.code = code.toUpperCase();
  }

  const amount = resolveAmount(flags, { required: false });
  if (amount.error) return { ok: false, error: amount.error };
  if (amount.type !== undefined) {
    changes.type = amount.type;
    changes.value = amount.value;
  }

  const limit = readNumber(flags, "limit");
  if (limit.error) return { ok: false, error: limit.error };
  if (limit.value !== undefined) {
    if (limit.value <= 0)
      return {
        ok: false,
        error: `--limit must be greater than 0, got ${limit.value}.`,
      };
    changes.usageLimit = limit.value;
  }

  const active = readBoolean(flags, "active");
  if (active.error) return { ok: false, error: active.error };
  if (active.value !== undefined) changes.active = active.value;

  if (Object.keys(changes).length === 0) {
    return {
      ok: false,
      error:
        "discounts update requires at least one field to change: --code, --percent/--fixed, --limit, --active.",
    };
  }

  if (wantsDryRun(flags)) {
    return dryRunResult(`update discount ${id}`, { id, changes });
  }

  const result = updateDiscount(ctx.state, id, changes);
  if (result.error) return { ok: false, error: result.error };

  return {
    ok: true,
    data: result.discount,
    message: `Discount ${id} updated.`,
  };
}

//Borra un descuento. Destructivo. Guardrails: --dry-run y --yes.
function deleteDiscountCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const found = requireEntity(ctx, getDiscountById, "discount");
  if (!found.ok) return found.error;
  const { id, entity: discount } = found;

  if (wantsDryRun(flags)) {
    return dryRunResult(`delete discount ${id} ("${discount.code}")`, {
      discount,
    });
  }

  const blocked = requireConfirmation(
    flags,
    `discount ${id} ("${discount.code}")`,
  );
  if (blocked) return blocked;

  deleteDiscount(ctx.state, id);
  return {
    ok: true,
    data: { id, deleted: true },
    message: `Discount ${id} deleted.`,
  };
}

export const discountCommands: Record<string, CommandHandler> = {
  list: listDiscounts,
  get: getDiscount,
  create: createDiscountCmd,
  update: updateDiscountCmd,
  delete: deleteDiscountCmd,
};
