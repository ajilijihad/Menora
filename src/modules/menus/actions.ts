"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { refreshPublicMenu } from "@/lib/menus/refresh-public-menu";
import { redirect } from "next/navigation";

import { clientIpFromForwarded } from "@/lib/auth/ip";
import { parseLocale } from "@/lib/auth/schemas";
import { canEditBusiness } from "@/lib/businesses/access";
import { parseBusinessId } from "@/lib/businesses/ids";
import { imageExtension, maxImageBytes } from "@/lib/businesses/media";
import { buildMenuImagePath, isSafeMenuImagePath, menuImageLimit } from "@/lib/menus/media";
import { currencyExponent } from "@/lib/menus/money";
import { menuRateLimiter, menuRateLimits } from "@/lib/menus/rate-limit";
import {
  parseCategoryForm,
  parseCurrency,
  parseProductForm,
  readFormLists,
  type MenuMessageCode,
  type PricedOption,
} from "@/lib/menus/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { canAddProduct } from "@/modules/billing/queries";

import { requireMenu } from "./menu-access";
import { businessCurrency } from "./queries";

const mediaBucket = "menu-media";

async function requestIp() {
  const headerStore = await headers();
  return clientIpFromForwarded(headerStore.get("x-forwarded-for"), headerStore.get("x-real-ip"));
}

function menuPath(locale: string, businessId: string, suffix = "") {
  return `/${locale}/dashboard/businesses/${businessId}/menu${suffix}`;
}

function menuNoticePath(locale: string, businessId: string, notice: string, tab?: "products") {
  const params = new URLSearchParams({ notice });
  if (tab) {
    params.set("tab", tab);
  }
  return `${menuPath(locale, businessId)}?${params}`;
}

async function nextCategorySort(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
) {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (error) {
    throw error;
  }
  return (data?.[0]?.sort_order ?? -1) + 1;
}

async function nextProductSort(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
  categoryId: string,
) {
  const { data, error } = await supabase
    .from("menu_products")
    .select("sort_order")
    .eq("business_id", businessId)
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (error) {
    throw error;
  }
  return (data?.[0]?.sort_order ?? -1) + 1;
}

async function replaceOptions(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  table: "product_variants" | "product_addons",
  businessId: string,
  productId: string,
  rows: PricedOption[],
): Promise<MenuMessageCode | null> {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("business_id", businessId)
    .eq("product_id", productId);
  if (error) {
    return "save_failed";
  }

  const existing = new Set((data ?? []).map((row) => row.id));
  const keep = new Set(rows.flatMap((row) => (row.id ? [row.id] : [])));
  for (const id of keep) {
    if (!existing.has(id)) {
      return "not_found";
    }
  }

  const remove = [...existing].filter((id) => !keep.has(id));
  if (remove.length > 0) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .in("id", remove);
    if (deleteError) {
      return "save_failed";
    }
  }

  for (const [index, row] of rows.entries()) {
    const payload = {
      name: row.name,
      name_ar: row.nameAr,
      price_cents: row.priceCents,
      sort_order: index,
      is_active: row.isActive,
    };
    if (row.id) {
      const { error: updateError } = await supabase
        .from(table)
        .update(payload)
        .eq("id", row.id)
        .eq("business_id", businessId)
        .eq("product_id", productId);
      if (updateError) {
        return updateError.code === "23505" ? "name_taken" : "save_failed";
      }
    } else {
      const { error: insertError } = await supabase.from(table).insert({
        ...payload,
        business_id: businessId,
        product_id: productId,
      });
      if (insertError) {
        return insertError.code === "23505" ? "name_taken" : "save_failed";
      }
    }
  }

  return null;
}

async function removeStored(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
  productId: string,
  path: string,
) {
  if (!isSafeMenuImagePath(businessId, productId, path)) {
    return;
  }
  await supabase.storage.from(mediaBucket).remove([path]);
}

async function syncCover(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
  productId: string,
) {
  const { data } = await supabase
    .from("product_images")
    .select("image_path")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .limit(1);
  const cover = data?.[0]?.image_path ?? null;
  await supabase
    .from("menu_products")
    .update({ image_path: cover })
    .eq("id", productId)
    .eq("business_id", businessId);
}

async function storeGallery(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
  productId: string,
  formData: FormData,
): Promise<MenuMessageCode | null> {
  const removeIds = formData
    .getAll("removeImage")
    .filter((value): value is string => typeof value === "string")
    .map((value) => parseBusinessId(value))
    .filter((value): value is string => Boolean(value));
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const { data: current, error } = await supabase
    .from("product_images")
    .select("id, image_path, sort_order")
    .eq("business_id", businessId)
    .eq("product_id", productId);
  if (error) {
    return "image_failed";
  }

  const images = current ?? [];
  const removable = images.filter((image) => removeIds.includes(image.id));
  if (images.length - removable.length + files.length > menuImageLimit) {
    return "image_limit";
  }

  for (const file of files) {
    if (file.size > maxImageBytes) {
      return "image_too_large";
    }
    if (!imageExtension(file.type)) {
      return "image_type";
    }
  }

  if (removable.length > 0) {
    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .in(
        "id",
        removable.map((image) => image.id),
      );
    if (deleteError) {
      return "image_failed";
    }
    for (const image of removable) {
      await removeStored(supabase, businessId, productId, image.image_path);
    }
  }

  let sort = images.reduce((max, image) => Math.max(max, image.sort_order), -1);
  for (const file of files) {
    const extension = imageExtension(file.type);
    if (!extension) {
      return "image_type";
    }
    const path = buildMenuImagePath(businessId, productId, extension, crypto.randomUUID());
    if (!isSafeMenuImagePath(businessId, productId, path)) {
      return "image_failed";
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength === 0) {
      return "image_failed";
    }
    if (bytes.byteLength > maxImageBytes) {
      return "image_too_large";
    }
    const { error: uploadError } = await supabase.storage.from(mediaBucket).upload(path, new Blob([bytes], { type: file.type }), {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) {
      console.error(`product image upload failed: ${uploadError.message}`);
      return "image_failed";
    }
    sort += 1;
    const { error: insertError } = await supabase.from("product_images").insert({
      business_id: businessId,
      product_id: productId,
      image_path: path,
      sort_order: sort,
    });
    if (insertError) {
      console.error(`product image record failed: ${insertError.message}`);
      await removeStored(supabase, businessId, productId, path);
      return insertError.code === "23514" ? "image_limit" : "image_failed";
    }
  }

  await syncCover(supabase, businessId, productId);
  return null;
}

export async function saveCategoryAction(_state: unknown, formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  if (!locale || !access) {
    return { message: "not_found" as const };
  }
  if (access.unconfigured || !access.supabase) {
    return { message: "unconfigured" as const };
  }

  const parsed = parseCategoryForm(readFormLists(formData));
  if (!parsed.ok) {
    return { message: parsed.message };
  }

  const limit = menuRateLimiter.consume(`menu-write:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    return { message: "rate_limited" as const };
  }

  const categoryId = parseBusinessId(formData.get("categoryId"));
  const payload = {
    name: parsed.data.name,
    name_ar: parsed.data.nameAr,
    description: parsed.data.description,
    description_ar: parsed.data.descriptionAr,
    is_active: parsed.data.isActive,
    is_published: parsed.data.isPublished,
  };

  if (categoryId) {
    const { data, error } = await access.supabase
      .from("menu_categories")
      .update(payload)
      .eq("id", categoryId)
      .eq("business_id", access.business.id)
      .select("id");
    if (error) {
      return { message: error.code === "23505" ? ("name_taken" as const) : ("save_failed" as const) };
    }
    if (!data?.length) {
      return { message: "not_found" as const };
    }
  } else {
    const sortOrder = await nextCategorySort(access.supabase, access.business.id);
    const { error } = await access.supabase.from("menu_categories").insert({
      ...payload,
      id: crypto.randomUUID(),
      business_id: access.business.id,
      sort_order: sortOrder,
    });
    if (error) {
      return { message: error.code === "23505" ? ("name_taken" as const) : ("save_failed" as const) };
    }
  }

  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
  redirect(`${menuPath(locale, access.business.id)}?notice=${categoryId ? "saved" : "created"}`);
}

export async function saveProductAction(_state: unknown, formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  if (!locale || !access) {
    return { message: "not_found" as const };
  }
  if (access.unconfigured || !access.supabase) {
    return { message: "unconfigured" as const };
  }

  const currency = await businessCurrency(access.business.id);
  const exponent = currencyExponent(currency) ?? 2;
  const parsed = parseProductForm(readFormLists(formData), exponent);
  if (!parsed.ok) {
    return { message: parsed.message };
  }

  const limit = menuRateLimiter.consume(`menu-write:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    return { message: "rate_limited" as const };
  }

  const { data: category, error: categoryError } = await access.supabase
    .from("menu_categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .eq("business_id", access.business.id)
    .maybeSingle();
  if (categoryError || !category) {
    return { message: "category_invalid" as const };
  }

  const payload = {
    category_id: category.id,
    name: parsed.data.name,
    name_ar: parsed.data.nameAr,
    description: parsed.data.description,
    description_ar: parsed.data.descriptionAr,
    price_cents: parsed.data.priceCents,
    compare_at_cents: parsed.data.compareAtCents,
    is_active: parsed.data.isActive,
    is_published: parsed.data.isPublished,
    is_featured: parsed.data.isFeatured,
    stock_status: parsed.data.stockStatus,
    dietary_labels: parsed.data.dietaryLabels,
  };

  const requestedId = parseBusinessId(formData.get("productId"));
  let productId = requestedId;
  if (requestedId) {
    const { data, error } = await access.supabase
      .from("menu_products")
      .update(payload)
      .eq("id", requestedId)
      .eq("business_id", access.business.id)
      .select("id");
    if (error) {
      return { message: error.code === "23505" ? ("name_taken" as const) : ("save_failed" as const) };
    }
    if (!data?.length) {
      return { message: "not_found" as const };
    }
  } else {
    try {
      const allowed = await canAddProduct(access.business.id);
      if (!allowed) {
        return { message: "plan_limit" as const };
      }
    } catch {
      return { message: "save_failed" as const };
    }

    productId = crypto.randomUUID();
    const sortOrder = await nextProductSort(access.supabase, access.business.id, category.id);
    const { error } = await access.supabase.from("menu_products").insert({
      ...payload,
      id: productId,
      business_id: access.business.id,
      sort_order: sortOrder,
    });
    if (error) {
      if (error.message.includes("product_limit")) {
        return { message: "plan_limit" as const };
      }
      return { message: error.code === "23505" ? ("name_taken" as const) : ("save_failed" as const) };
    }
  }

  if (!productId) {
    return { message: "save_failed" as const };
  }

  const variantError = await replaceOptions(
    access.supabase,
    "product_variants",
    access.business.id,
    productId,
    parsed.data.variants,
  );
  if (variantError) {
    if (!requestedId) {
      revalidatePath(menuPath(locale, access.business.id));
      refreshPublicMenu(access.business.slug);
      redirect(`${menuPath(locale, access.business.id, `/products/${productId}`)}?notice=${variantError}`);
    }
    return { message: variantError };
  }
  const addonError = await replaceOptions(
    access.supabase,
    "product_addons",
    access.business.id,
    productId,
    parsed.data.addons,
  );
  if (addonError) {
    if (!requestedId) {
      revalidatePath(menuPath(locale, access.business.id));
      refreshPublicMenu(access.business.slug);
      redirect(`${menuPath(locale, access.business.id, `/products/${productId}`)}?notice=${addonError}`);
    }
    return { message: addonError };
  }

  const imageError = await storeGallery(access.supabase, access.business.id, productId, formData);
  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
  const notice = imageError ?? (requestedId ? "saved" : "created");
  redirect(`${menuPath(locale, access.business.id, `/products/${productId}`)}?notice=${notice}`);
}

export async function deleteCategoryAction(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  const categoryId = parseBusinessId(formData.get("categoryId"));
  if (!locale || !access || !categoryId) {
    return;
  }
  if (access.unconfigured || !access.supabase) {
    redirect(`${menuPath(locale, access.business.id)}?notice=unconfigured`);
  }

  const limit = menuRateLimiter.consume(`menu-delete:${await requestIp()}`, menuRateLimits.remove);
  if (!limit.ok) {
    redirect(`${menuPath(locale, access.business.id)}?notice=rate_limited`);
  }

  const { data: products } = await access.supabase
    .from("menu_products")
    .select("id")
    .eq("business_id", access.business.id)
    .eq("category_id", categoryId);
  const productIds = (products ?? []).map((product) => product.id);
  if (productIds.length > 0) {
    const { data: images } = await access.supabase
      .from("product_images")
      .select("product_id, image_path")
      .eq("business_id", access.business.id)
      .in("product_id", productIds);
    for (const image of images ?? []) {
      await removeStored(access.supabase, access.business.id, image.product_id, image.image_path);
    }
  }

  const { data, error } = await access.supabase
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("business_id", access.business.id)
    .select("id");
  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
  redirect(
    `${menuPath(locale, access.business.id)}?notice=${error || !data?.length ? "save_failed" : "deleted"}`,
  );
}

export async function deleteProductAction(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  const productId = parseBusinessId(formData.get("productId"));
  if (!locale || !access || !productId || access.unconfigured || !access.supabase) {
    return;
  }

  const limit = menuRateLimiter.consume(`menu-delete:${await requestIp()}`, menuRateLimits.remove);
  if (!limit.ok) {
    redirect(menuNoticePath(locale, access.business.id, "rate_limited", "products"));
  }

  const { data: images } = await access.supabase
    .from("product_images")
    .select("image_path")
    .eq("business_id", access.business.id)
    .eq("product_id", productId);
  for (const image of images ?? []) {
    await removeStored(access.supabase, access.business.id, productId, image.image_path);
  }

  const { data, error } = await access.supabase
    .from("menu_products")
    .delete()
    .eq("id", productId)
    .eq("business_id", access.business.id)
    .select("id");
  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
  redirect(menuNoticePath(locale, access.business.id, error || !data?.length ? "save_failed" : "deleted", "products"));
}

export async function setPublishedAction(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  const kind = formData.get("kind");
  const id = parseBusinessId(formData.get("recordId"));
  if (!locale || !access || !id || access.unconfigured || !access.supabase) {
    return;
  }
  if (kind !== "category" && kind !== "product") {
    return;
  }

  const tab = kind === "product" ? "products" : undefined;
  const limit = menuRateLimiter.consume(`menu-write:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    redirect(menuNoticePath(locale, access.business.id, "rate_limited", tab));
  }

  const table = kind === "category" ? "menu_categories" : "menu_products";
  const { data } = await access.supabase
    .from(table)
    .update({ is_published: formData.get("published") === "1" })
    .eq("id", id)
    .eq("business_id", access.business.id)
    .select("id");
  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
  redirect(menuNoticePath(locale, access.business.id, data?.length ? "saved" : "not_found", tab));
}

export async function moveRecordAction(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  const kind = formData.get("kind");
  const id = parseBusinessId(formData.get("recordId"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!locale || !access || !id || access.unconfigured || !access.supabase) {
    return;
  }
  if (kind !== "category" && kind !== "product") {
    return;
  }

  const tab = kind === "product" ? "products" : undefined;
  const limit = menuRateLimiter.consume(`menu-write:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    redirect(menuNoticePath(locale, access.business.id, "rate_limited", tab));
  }

  if (kind === "category") {
    const { data } = await access.supabase
      .from("menu_categories")
      .select("id, sort_order")
      .eq("business_id", access.business.id)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    await swapSort(access.supabase, "menu_categories", access.business.id, data ?? [], id, direction);
  } else {
    const { data: current } = await access.supabase
      .from("menu_products")
      .select("category_id")
      .eq("id", id)
      .eq("business_id", access.business.id)
      .maybeSingle();
    if (!current) {
      redirect(menuNoticePath(locale, access.business.id, "not_found", "products"));
    }
    const { data } = await access.supabase
      .from("menu_products")
      .select("id, sort_order")
      .eq("business_id", access.business.id)
      .eq("category_id", current.category_id)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    await swapSort(access.supabase, "menu_products", access.business.id, data ?? [], id, direction);
  }

  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
  redirect(menuNoticePath(locale, access.business.id, "saved", tab));
}

async function swapSort(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  table: "menu_categories" | "menu_products",
  businessId: string,
  rows: { id: string; sort_order: number }[],
  id: string,
  direction: number,
) {
  const index = rows.findIndex((row) => row.id === id);
  const neighbor = rows[index + direction];
  const current = rows[index];
  if (!current || !neighbor) {
    return;
  }
  await supabase
    .from(table)
    .update({ sort_order: neighbor.sort_order })
    .eq("id", current.id)
    .eq("business_id", businessId);
  await supabase
    .from(table)
    .update({ sort_order: current.sort_order })
    .eq("id", neighbor.id)
    .eq("business_id", businessId);
  if (current.sort_order === neighbor.sort_order) {
    for (const [position, row] of rows.entries()) {
      await supabase
        .from(table)
        .update({ sort_order: position === index ? index + direction : position === index + direction ? index : position })
        .eq("id", row.id)
        .eq("business_id", businessId);
    }
  }
}

export async function reorderCategoriesAction(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  const ids = String(formData.get("order") ?? "")
    .split(",")
    .map((value) => parseBusinessId(value))
    .filter((value): value is string => Boolean(value));
  if (!locale || !access || access.unconfigured || !access.supabase || ids.length === 0) {
    return;
  }

  const limit = menuRateLimiter.consume(`menu-write:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    redirect(`${menuPath(locale, access.business.id)}?notice=rate_limited`);
  }

  const { data } = await access.supabase
    .from("menu_categories")
    .select("id")
    .eq("business_id", access.business.id);
  const known = new Set((data ?? []).map((row) => row.id.toLowerCase()));
  if (ids.length !== known.size || ids.some((id) => !known.has(id))) {
    redirect(`${menuPath(locale, access.business.id)}?notice=not_found`);
  }

  for (const [index, id] of ids.entries()) {
    const updated = await access.supabase
      .from("menu_categories")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("business_id", access.business.id);
    if (updated.error) {
      redirect(`${menuPath(locale, access.business.id)}?notice=save_failed`);
    }
  }

  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
  redirect(`${menuPath(locale, access.business.id)}?notice=saved`);
}

export async function updateCurrencyAction(_state: unknown, formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  const currency = parseCurrency(formData.get("currency"));
  if (!locale || !access) {
    return { message: "not_found" as const };
  }
  if (!canEditBusiness(access.business.role)) {
    return { message: "forbidden" as const };
  }
  if (!currency) {
    return { message: "currency_invalid" as const };
  }
  if (access.unconfigured || !access.supabase) {
    return { message: "unconfigured" as const };
  }

  const limit = menuRateLimiter.consume(`menu-write:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    return { message: "rate_limited" as const };
  }

  const { data, error } = await access.supabase
    .from("businesses")
    .update({ currency })
    .eq("id", access.business.id)
    .select("id");
  if (error || !data?.length) {
    return { message: "save_failed" as const };
  }

  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
  redirect(`${menuPath(locale, access.business.id)}?notice=saved`);
}

export async function setProductActiveAction(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  const productId = parseBusinessId(formData.get("productId"));
  const active = formData.get("active") === "1";
  if (!locale || !access || !productId) {
    return;
  }
  if (access.unconfigured || !access.supabase) {
    redirect(`${menuPath(locale, access.business.id)}?notice=unconfigured`);
  }

  const limit = menuRateLimiter.consume(`menu-active:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    redirect(`${menuPath(locale, access.business.id)}?notice=rate_limited`);
  }

  const { data, error } = await access.supabase
    .from("menu_products")
    .update({ is_active: active })
    .eq("id", productId)
    .eq("business_id", access.business.id)
    .select("id");
  if (error || !data?.length) {
    redirect(`${menuPath(locale, access.business.id)}?notice=save_failed`);
  }

  revalidatePath(`/${locale}/dashboard/businesses/${access.business.id}`);
  revalidatePath(menuPath(locale, access.business.id));
  refreshPublicMenu(access.business.slug);
}

