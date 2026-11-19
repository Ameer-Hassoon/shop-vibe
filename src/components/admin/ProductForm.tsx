"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, buttonClass, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { IconImage } from "./icons";
import { Notice } from "./AdminUI";
import { PRODUCT_CATEGORIES, type AdminProduct } from "./types";

type FieldName = "name" | "description" | "price" | "stock" | "category" | "image";
type Errors = Partial<Record<FieldName, string>>;
type ErrorKey =
  | "errNameRequired"
  | "errDescRequired"
  | "errPriceInvalid"
  | "errStockInvalid"
  | "errCategoryRequired"
  | "errImageRequired"
  | "errImageUrl";

interface Values {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image: string;
}

const FIELDS: FieldName[] = ["name", "description", "price", "stock", "category", "image"];

function validate(v: Values): Partial<Record<FieldName, ErrorKey>> {
  const e: Partial<Record<FieldName, ErrorKey>> = {};
  if (!v.name.trim()) e.name = "errNameRequired";
  if (!v.description.trim()) e.description = "errDescRequired";
  const price = Number(v.price);
  if (v.price.trim() === "" || !Number.isFinite(price) || price < 0) e.price = "errPriceInvalid";
  const stock = Number(v.stock);
  if (v.stock.trim() === "" || !Number.isInteger(stock) || stock < 0) e.stock = "errStockInvalid";
  if (!v.category.trim()) e.category = "errCategoryRequired";
  const img = v.image.trim();
  if (!img) e.image = "errImageRequired";
  else if (!/^(https?:\/\/\S+|\/\S+)$/i.test(img)) e.image = "errImageUrl";
  return e;
}

function ImagePreview({ url }: { url: string }) {
  const t = useTranslations("admin");
  const [failed, setFailed] = useState<string | null>(null);
  const src = url.trim();
  const showImg = src && failed !== src;
  return (
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-dashed border-line-strong bg-surface-2">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={t("imagePreview")} onError={() => setFailed(src)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted">
          <IconImage className="h-8 w-8" />
          {src ? t("imageFailed") : t("imageEmpty")}
        </div>
      )}
    </div>
  );
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");
  const router = useRouter();
  const editing = Boolean(product);

  const [values, setValues] = useState<Values>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "",
    category: product?.category ?? "",
    image: product?.image ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (name: FieldName) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  // Keep a product's current category selectable even if it isn't in the standard list.
  const extraCategory =
    values.category && !PRODUCT_CATEGORIES.some((c) => c.value === values.category) ? values.category : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(Object.fromEntries(Object.entries(found).map(([k, key]) => [k, t(key as ErrorKey)])) as Errors);
      const first = FIELDS.find((f) => found[f]);
      if (first) (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/products/${product!.id}` : "/api/products", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description.trim(),
          price: Number(values.price),
          stock: Number(values.stock),
          category: values.category.trim(),
          image: values.image.trim(),
        }),
      });
      if (res.ok) {
        router.push(`/admin/products?notice=${editing ? "updated" : "created"}`);
        return;
      }
      const body = await res.json().catch(() => null);
      if (body?.code === "VALIDATION" && body.fields && typeof body.fields === "object") {
        const mapped: Errors = {};
        for (const [k, v] of Object.entries(body.fields as Record<string, unknown>)) {
          if (FIELDS.includes(k as FieldName)) {
            mapped[k as FieldName] = String(Array.isArray(v) ? v[0] : v);
          }
        }
        setErrors(mapped);
        setFormError(Object.keys(mapped).length ? t("fixHighlighted") : body.error || t("saveFailed"));
      } else if (body?.code === "DEMO_READ_ONLY") {
        setFormError(t("readOnlyDesc"));
      } else if (res.status === 401 || res.status === 403) {
        setFormError(t("notAuthorizedDesc"));
      } else {
        setFormError(typeof body?.error === "string" && body.error ? body.error : t("saveFailed"));
      }
    } catch {
      setFormError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError && <Notice tone="danger">{formError}</Notice>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-5 p-5 sm:p-6 lg:col-span-2">
          <Field label={t("fName")} error={errors.name}>
            {(p) => (
              <Input {...p} name="name" value={values.name} onChange={set("name")} disabled={saving} />
            )}
          </Field>
          <Field label={t("fDescription")} error={errors.description}>
            {(p) => (
              <Textarea
                {...p}
               
                name="description"
                rows={5}
                value={values.description}
                onChange={set("description")}
                disabled={saving}
              />
            )}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("fPrice")} error={errors.price} hint={t("fPriceHint")}>
              {(p) => (
                <Input
                  {...p}
                 
                  name="price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={values.price}
                  onChange={set("price")}
                  disabled={saving}
                />
              )}
            </Field>
            <Field label={t("fStock")} error={errors.stock}>
              {(p) => (
                <Input
                  {...p}
                 
                  name="stock"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={values.stock}
                  onChange={set("stock")}
                  disabled={saving}
                />
              )}
            </Field>
          </div>
          <Field label={t("fCategory")} error={errors.category}>
            {(p) => (
              <Select {...p} name="category" value={values.category} onChange={set("category")} disabled={saving}>
                <option value="">{t("selectCategory")}</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {tCat(c.key)}
                  </option>
                ))}
                {extraCategory && <option value={extraCategory}>{extraCategory}</option>}
              </Select>
            )}
          </Field>
        </Card>

        <Card className="h-fit space-y-4 p-5 sm:p-6">
          <Field label={t("fImage")} error={errors.image} hint={t("fImageHint")}>
            {(p) => (
              <Input
                {...p}
               
                name="image"
                type="url"
                dir="ltr"
                placeholder="https://"
                value={values.image}
                onChange={set("image")}
                disabled={saving}
                className="text-start"
              />
            )}
          </Field>
          <ImagePreview url={values.image} />
        </Card>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/products" className={buttonClass("outline", "md")}>
          {tc("cancel")}
        </Link>
        <Button type="submit" loading={saving}>
          {saving ? t("saving") : editing ? t("saveChanges") : t("createProduct")}
        </Button>
      </div>
    </form>
  );
}
