"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Upload,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { modules, type Field } from "@/lib/modules";
type Row = Record<string, unknown>;
export function AdminEditor({
  module: moduleKey,
  rows,
  csrf,
  seoOnly = false,
  defaultCurrency = "USD",
  serviceOptions = [],
}: {
  module: string;
  rows: Row[];
  csrf: string;
  seoOnly?: boolean;
  defaultCurrency?: string;
  serviceOptions?: { id: string; title: string }[];
}) {
  const m = modules[moduleKey],
    router = useRouter();
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [editing, setEditing] = useState<Row | null>(null),
    [deleting, setDeleting] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const visible = rows.filter(
    (r) =>
      JSON.stringify(r).toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" ||
        String(r.status ?? r.published ?? r.visible) === filter),
  );
  const fields = seoOnly
    ? m.fields.filter((f) =>
        [
          "seo_title",
          "seo_description",
          "canonical",
          "og_image",
          "noindex",
        ].includes(f.key),
      )
    : m.fields;
  function start(row: Row) {
    setError("");
    setMessage("");
    setEditing(row);
  }
  async function mutation(action: string, id: unknown, data?: Row) {
    const res = await fetch("/api/admin/" + moduleKey, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ action, id, data }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    return body;
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      const data: Row = { ...editing };
      for (const f of fields) {
        const value = String(form.get(f.key) ?? "");
        data[f.key] =
          f.type === "checkbox"
            ? form.has(f.key)
            : f.type === "list"
              ? value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : f.type === "json"
                ? JSON.parse(value || "[]")
                : f.type === "number"
                  ? value === "" && f.key === "amount"
                    ? null
                    : Number(value)
                  : f.key === "service_id" && !value
                    ? null
                    : value;
      }
      await mutation(
        editing?.id || m.singleton ? "update" : "create",
        editing?.id,
        data,
      );
      setEditing(null);
      setMessage("Changes saved. Public content is now up to date.");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "Invalid JSON. Use an array of question and answer objects."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await mutation("delete", deleting?.id);
      setDeleting(null);
      setMessage("Record deleted.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }
  async function exportCSV() {
    setError("");
    try {
      const r = await fetch("/api/admin/leads?export=csv", {
        headers: { "x-csrf-token": csrf },
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "inquiries.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    try {
      const r = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-csrf-token": csrf },
        body: new FormData(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage(
        "Image uploaded. Copy its URL into the relevant content field.",
      );
      form.reset();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">CONTENT WORKSPACE</span>
          <h1>{seoOnly ? "SEO management" : m.title}</h1>
          <p>
            {seoOnly
              ? "Control search metadata, canonical URLs, and indexing for public pages."
              : m.description}
          </p>
        </div>
        {m.singleton ? (
          <button className="button" onClick={() => start(rows[0] || {})}>
            <Pencil size={16} />
            Edit settings
          </button>
        ) : (
          !m.noCreate && (
            <button
              className="button"
              onClick={() =>
                start({
                  ...m.defaults,
                  ...(moduleKey === "pricing"
                    ? { currency: defaultCurrency }
                    : {}),
                })
              }
            >
              <Plus size={17} />
              Add {moduleKey === "media" ? "image URL" : "entry"}
            </button>
          )
        )}
      </div>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      {error && !editing && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
      {moduleKey === "media" && (
        <form className="upload-panel" onSubmit={upload}>
          <div>
            <Upload size={20} />
            <strong>Upload an image</strong>
            <p>
              JPG, PNG, WebP, SVG · Maximum 5 MB. SVGs are sanitized and
              converted to WebP.
            </p>
          </div>
          <label>
            Image file
            <input
              type="file"
              name="file"
              required
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
            />
          </label>
          <label>
            Alternative text
            <input name="alt" maxLength={250} />
          </label>
          <button className="button button-outline" disabled={busy}>
            Upload image
          </button>
        </form>
      )}
      {m.singleton ? (
        <div className="admin-panel settings-preview">
          <h2>Brand & contact details</h2>
          {m.fields.map((f) => (
            <div key={f.key}>
              <strong>{f.label}</strong>
              <span>
                {Array.isArray(rows[0]?.[f.key])
                  ? (rows[0][f.key] as string[]).join(" · ")
                  : String(rows[0]?.[f.key] || "Not configured")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-panel">
          <div className="table-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Search records"
                placeholder="Search records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {["services", "pricing", "faqs", "sections", "leads"].includes(
              moduleKey,
            ) && (
              <select
                aria-label="Filter records"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {moduleKey === "leads" ? (
                  ["new", "contacted", "qualified", "closed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))
                ) : (
                  <>
                    <option value="true">Published / visible</option>
                    <option value="false">Draft / hidden</option>
                  </>
                )}
              </select>
            )}
            {moduleKey === "leads" && (
              <button className="button button-outline" onClick={exportCSV}>
                <Download size={16} />
                Export CSV
              </button>
            )}
            <span className="record-count">{visible.length} records</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>
                    {moduleKey === "leads"
                      ? "Inquiry"
                      : moduleKey === "media"
                        ? "Asset"
                        : "Content"}
                  </th>
                  <th>
                    {moduleKey === "leads" ? "Service / received" : "Details"}
                  </th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={String(r.id)}>
                    <td>
                      <div className="record-title">
                        {moduleKey === "media" && (
                          <img
                            src={String(r.url)}
                            alt={String(r.alt || "")}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div>
                          <strong>{String(r[m.label])}</strong>
                          <small>
                            {String(
                              r.email || r.slug || r.currency || r.alt || "",
                            )}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-description">
                        {String(
                          r.service ||
                            r.description ||
                            r.answer ||
                            r.url ||
                            "—",
                        ).slice(0, 100)}
                      </span>
                      {!!r.created_at && (
                        <small>
                          {new Date(String(r.created_at)).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${r.status === "new" ? "new" : ""}`}
                      >
                        {String(
                          r.status ||
                            (r.published === false || r.visible === false
                              ? "Draft"
                              : "Active"),
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          aria-label={"Edit " + r[m.label]}
                          onClick={() => start(r)}
                        >
                          <Pencil size={16} />
                        </button>
                        {(!m.noCreate || moduleKey === "leads") && (
                          <button
                            aria-label={"Delete " + r[m.label]}
                            onClick={() => setDeleting(r)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && (
              <div className="table-empty">
                <Search />
                <h3>No records to show</h3>
                <p>
                  {search || filter !== "all"
                    ? "Try a different search or filter."
                    : "New entries will appear here."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <Dialog.Root
        open={!!editing}
        onOpenChange={(open) => {
          if (!busy && !open) setEditing(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="editor-dialog">
            <Dialog.Title>
              {editing?.id || m.singleton ? "Edit" : "Create"}{" "}
              {seoOnly ? "SEO metadata" : m.title.toLowerCase()}
            </Dialog.Title>
            <Dialog.Description>
              Save changes to update the database. Published content updates
              immediately.
            </Dialog.Description>
            <Dialog.Close
              className="close"
              aria-label="Close editor"
              disabled={busy}
            >
              <X />
            </Dialog.Close>
            {editing && (
              <form onSubmit={save}>
                {moduleKey === "leads" && (
                  <div className="lead-detail">
                    {[
                      "name",
                      "company",
                      "email",
                      "phone",
                      "country",
                      "service",
                      "description",
                      "budget",
                      "notification_status",
                    ].map((k) => (
                      <div key={k}>
                        <strong>{k.replaceAll("_", " ")}</strong>
                        <p>{String(editing[k] || "—")}</p>
                      </div>
                    ))}
                  </div>
                )}
                {editing.id != null && (
                  <p className="record-id">Record ID: {String(editing.id)}</p>
                )}
                {fields.map((f) => (
                  <EditorField
                    key={f.key}
                    field={f}
                    value={editing[f.key]}
                    serviceOptions={serviceOptions}
                  />
                ))}
                {error && (
                  <p role="alert" className="form-message error">
                    {error}
                  </p>
                )}
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setEditing(null)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button className="button" disabled={busy}>
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <AlertDialog.Root
        open={!!deleting}
        onOpenChange={(open) => {
          if (!busy && !open) setDeleting(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-overlay" />
          <AlertDialog.Content className="confirm-dialog">
            <AlertDialog.Title>Delete this record?</AlertDialog.Title>
            <AlertDialog.Description>
              “{String(deleting?.[m.label] || "")}” will be permanently removed.
              This cannot be undone.
            </AlertDialog.Description>
            <div className="dialog-actions">
              <AlertDialog.Cancel
                className="button button-outline"
                disabled={busy}
              >
                Keep record
              </AlertDialog.Cancel>
              <button
                className="button danger"
                onClick={remove}
                disabled={busy}
              >
                {busy ? "Deleting…" : "Delete record"}
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
function EditorField({
  field: f,
  value,
  serviceOptions,
}: {
  field: Field;
  value: unknown;
  serviceOptions: { id: string; title: string }[];
}) {
  if (f.type === "checkbox")
    return (
      <label className="checkbox-label">
        <input type="checkbox" name={f.key} defaultChecked={Boolean(value)} />
        <span>{f.label}</span>
      </label>
    );
  const display =
    f.type === "list"
      ? Array.isArray(value)
        ? value.join("\n")
        : ""
      : f.type === "json"
        ? JSON.stringify(value || [], null, 2)
        : String(value ?? "");
  return (
    <label>
      {f.label}
      {f.key === "service_id" ? (
        <select name={f.key} defaultValue={String(value || "")}>
          <option value="">No related service</option>
          {serviceOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      ) : ["textarea", "list", "json"].includes(f.type || "") ? (
        <textarea
          name={f.key}
          defaultValue={display}
          rows={f.type === "json" ? 6 : 4}
        />
      ) : f.type === "select" ? (
        <select name={f.key} defaultValue={display}>
          {f.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          name={f.key}
          type={
            f.type === "number" ? "number" : f.type === "url" ? "url" : "text"
          }
          step={f.key === "amount" ? "0.01" : "1"}
          defaultValue={display}
          readOnly={
            f.key === "slug" &&
            [
              "home",
              "about",
              "services",
              "solutions",
              "pricing",
              "industries",
              "contact",
              "privacy-policy",
              "terms-and-conditions",
              "why",
              "process",
              "managed",
              "faq",
            ].includes(display)
          }
        />
      )}
      <small>{f.help || (f.type === "list" ? "One item per line." : "")}</small>
    </label>
  );
}
