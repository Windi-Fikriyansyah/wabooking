"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

const TABS = [
  { id: "profil", label: "Profil Bisnis" },
  { id: "integrasi", label: "Integrasi WhatsApp" },
  { id: "bot", label: "Kustomisasi Bot" },
  { id: "notifikasi", label: "Notifikasi" },
];

const BUSINESS_TYPES = [
  { value: "Salon", label: "Salon" },
  { value: "Klinik", label: "Klinik" },
  { value: "Barbershop", label: "Barbershop" },
  { value: "Laundry", label: "Laundry" },
  { value: "Bengkel", label: "Bengkel" },
  { value: "Lainnya", label: "Lainnya" },
];

const AVAILABLE_VARS = [
  "{nama_pelanggan}",
  "{layanan}",
  "{tanggal}",
  "{jam}",
  "{nama_bisnis}",
  "{kode_booking}",
];

const DEFAULT_WELCOME =
  "Halo {nama_pelanggan}👋 Selamat datang di {nama_bisnis}. Silakan pilih menu berikut";
const DEFAULT_CONFIRM = `✅ *Booking Berhasil Dikonfirmasi*

Halo {nama_pelanggan},

Booking Anda telah berhasil dikonfirmasi dengan detail berikut:

📌 *Layanan:* {layanan}
📅 *Tanggal:* {tanggal}
🕒 *Jam:* {jam}
🎫 *Kode Booking:* {kode_booking}

Mohon simpan kode booking ini untuk keperluan konfirmasi atau perubahan jadwal.

Terima kasih telah mempercayakan layanan kepada kami. Kami tunggu kedatangan Anda 😊`;
const DEFAULT_REMINDER =
  "Halo {nama_pelanggan}! Ini adalah pengingat untuk booking {layanan} Anda besok, {tanggal} pukul {jam} di {nama_bisnis}. Sampai jumpa!";

const PREVIEW_DATA: Record<string, string> = {
  "{nama_pelanggan}": "Budi Santoso",
  "{layanan}": "Potong Rambut",
  "{tanggal}": "15 Juni 2026",
  "{jam}": "10:00",
  "{kode_booking}": "BK-001",
};

type BusinessData = {
  id: string;
  name: string;
  type: string;
  address: string;
  description: string;
  logoUrl: string;
  waNumber: string;
  waConnected: boolean;
  zernioConnected: boolean;
  welcomeMessage: string;
  confirmTemplate: string;
  reminderTemplate: string;
};

type ZernioStatus = {
  waConnected: boolean;
  waNumber?: string;
};

function resolvePreview(text: string, businessName: string) {
  let preview = text;
  for (const [key, value] of Object.entries(PREVIEW_DATA)) {
    preview = preview.replaceAll(key, value);
  }
  preview = preview.replaceAll("{nama_bisnis}", businessName);
  return preview;
}

function TemplateField({
  label,
  description,
  value,
  onChange,
  textareaRef,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const insertVar = (v: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = value.slice(0, start) + v + value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">{label}</label>
        <span className="text-xs text-zinc-400">{value.length} karakter</span>
      </div>
      <p className="text-xs text-zinc-400">{description}</p>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px]"
      />
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-zinc-400 leading-7">Variabel:</span>
        {AVAILABLE_VARS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => insertVar(v)}
            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profil");
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/business");
        if (!res.ok) throw new Error("Gagal memuat data bisnis");
        const data = await res.json();
        const biz = Array.isArray(data) ? data[0] : data;
        if (!biz?.id) throw new Error("Belum ada bisnis");
        if (!cancelled) setBusiness(biz);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-500">{error || "Belum ada bisnis"}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Pengaturan</h1>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "profil" && (
        <ProfilTab business={business} onUpdate={setBusiness} />
      )}
      {activeTab === "integrasi" && (
        <IntegrasiTab business={business} onUpdate={setBusiness} />
      )}
      {activeTab === "bot" && (
        <BotTab business={business} onUpdate={setBusiness} />
      )}
      {activeTab === "notifikasi" && <NotifikasiTab />}
    </div>
  );
}

function proxyImageUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("https://") && url.includes(".r2.dev")) {
    const match = url.match(/\.r2\.dev\/(.+)/);
    if (match) return `/api/images/${match[1]}`;
  }
  return url;
}

function ProfilTab({
  business,
  onUpdate,
}: {
  business: BusinessData;
  onUpdate: (b: BusinessData) => void;
}) {
  const [name, setName] = useState(business.name);
  const [type, setType] = useState(business.type);
  const [address, setAddress] = useState(business.address);
  const [description, setDescription] = useState(business.description);
  const [logoUrl, setLogoUrl] = useState(business.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        if (logoUrl && !logoUrl.startsWith("data:")) {
          fd.append("oldUrl", logoUrl);
        }
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        if (!uploadRes.ok) throw new Error("Gagal mengunggah logo");
        const uploadData = await uploadRes.json();
        finalLogoUrl = uploadData.url;
        setLogoPreview(null);
        setLogoFile(null);
      }

      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: business.id,
          name,
          type,
          address,
          description,
          logoUrl: finalLogoUrl,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      const updated = await res.json();
      onUpdate({ ...business, ...updated, logoUrl: finalLogoUrl });
      setLogoUrl(finalLogoUrl);
      setMessage({ type: "success", text: "Data bisnis berhasil disimpan" });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
              {logoPreview || logoUrl ? (
                <img
                  src={logoPreview || proxyImageUrl(logoUrl)}
                  alt="Logo"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl text-zinc-300">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
              Pilih Logo
              <input
                type="file"
                accept="image/*"
                onChange={handleLogo}
                className="hidden"
              />
            </label>
            <p className="mt-1 text-xs text-zinc-400">
              Format: JPG, PNG. Maks 2 MB
            </p>
          </div>
        </div>

        <Input
          label="Nama Bisnis"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Select
          label="Jenis Bisnis"
          options={BUSINESS_TYPES}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <Textarea
          label="Alamat"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="min-h-[80px]"
        />
        <Textarea
          label="Deskripsi"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px]"
        />

        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-500"}`}
          >
            {message.text}
          </p>
        )}

        <Button onClick={save} loading={saving}>
          Simpan
        </Button>
      </div>
    </Card>
  );
}

function IntegrasiTab({
  business,
  onUpdate,
}: {
  business: BusinessData;
  onUpdate: (b: BusinessData) => void;
}) {
  const [status, setStatus] = useState<ZernioStatus | null>(null);
  const [checking, setChecking] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waConnectError, setWaConnectError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [waAccount, setWaAccount] = useState<{
    name: string;
    username: string;
    id: string;
  } | null>(null);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/zernio/status?businessId=${business.id}`);
      if (!res.ok) throw new Error("Gagal cek status");
      const data = await res.json();
      setStatus({
        waConnected: data.connected,
        waNumber: data.waNumber,
      });
    } catch {
      setStatus({ waConnected: false });
    } finally {
      setChecking(false);
    }
  }, [business.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const zernioParam = params.get("zernio");

    if (zernioParam === "connected") {
      (async () => {
        try {
          const res = await fetch(`/api/zernio/accounts`);
          if (res.ok) {
            const data = await res.json();
            const wa = Array.isArray(data.accounts)
              ? data.accounts.find(
                  (a: any) =>
                    (a.platform === "whatsapp" || a.platform === "wa") &&
                    a.status === "connected",
                )
              : null;
            const number =
              wa?.phone || wa?.username || params.get("wa") || "";
            setWaAccount(
              wa
                ? {
                    name: wa.name || wa.username || "",
                    username: number,
                    id: wa.id,
                  }
                : null,
            );
            onUpdate({
              ...business,
              zernioConnected: true,
              waNumber: number,
              waConnected: true,
            });
            setStatus({ waConnected: true, waNumber: number });
          }
        } catch {
          setWaAccount({
            name: params.get("wa") || "",
            username: params.get("wa") || "",
            id: "",
          });
          onUpdate({ ...business, zernioConnected: true, waConnected: true });
          setStatus({
            waConnected: true,
            waNumber: params.get("wa") || "",
          });
        }
      })();
      window.history.replaceState({}, "", "/settings");
    } else if (zernioParam === "error") {
      window.history.replaceState({}, "", "/settings");
    } else {
      checkStatus();
    }
  }, [checkStatus]);

  const connectWhatsApp = async () => {
    setWaConnecting(true);
    setWaConnectError(null);
    try {
      const res = await fetch("/api/zernio/connect-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.authUrl)
        throw new Error(data.error || "Gagal mendapatkan tautan");

      window.open(data.authUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setWaConnectError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setWaConnecting(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/zernio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setTestResult({
        ok: res.ok,
        msg: data.connected
          ? "WhatsApp terhubung ✓"
          : data.error || "WhatsApp belum terhubung",
      });
    } catch {
      setTestResult({ ok: false, msg: "Gagal menghubungi Zernio" });
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const syncAccounts = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/zernio/accounts`);
      if (!res.ok) throw new Error("Gagal sync");
      const data = await res.json();
      const wa = Array.isArray(data.accounts)
        ? data.accounts.find(
            (a: any) =>
              (a.platform === "whatsapp" || a.platform === "wa") &&
              a.status === "connected",
          )
        : null;
      if (wa) {
        const number = wa.phone || wa.username || "";
        setWaAccount({
          name: wa.name || wa.username || "",
          username: number,
          id: wa.id,
        });
        onUpdate({
          ...business,
          zernioConnected: true,
          waNumber: number,
          waConnected: true,
        });
        setStatus({ waConnected: true, waNumber: number });
        setSyncResult({ ok: true, msg: `WhatsApp terhubung: ${number}` });
      } else {
        setWaAccount(null);
        setStatus({ waConnected: false });
        onUpdate({ ...business, zernioConnected: false, waConnected: false });
        setSyncResult({
          ok: false,
          msg: "Belum ada akun WhatsApp terhubung di Zernio",
        });
      }
    } catch {
      setSyncResult({ ok: false, msg: "Gagal sync dengan Zernio" });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  const disconnectWA = async () => {
    if (!waAccount?.id) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/zernio/disconnect-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          accountId: waAccount.id,
        }),
      });
      if (!res.ok) throw new Error("Gagal memutuskan WhatsApp");
      setWaAccount(null);
      setStatus({ waConnected: false });
      onUpdate({
        ...business,
        zernioConnected: false,
        waNumber: "",
        waConnected: false,
      });
    } catch {
      setWaConnectError("Gagal memutuskan WhatsApp");
    } finally {
      setDisconnecting(false);
    }
  };

  const waConnected = status?.waConnected ?? business.zernioConnected;

  return (
    <div className="space-y-4">
      {waConnected ? (
        <div className="max-w-xs">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] shadow-sm">
                  <svg
                    className="h-6 w-6 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    WhatsApp
                  </p>
                  <span className="mt-0.5 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    connected
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-zinc-800 truncate">
                  {waAccount?.name || "WhatsApp"}
                </span>
                <span className="text-zinc-300">·</span>
                <span className="text-sm text-zinc-500 truncate">
                  {waAccount?.username || status?.waNumber || "-"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const text = waAccount?.username || status?.waNumber || "";
                    if (text) navigator.clipboard.writeText(text);
                  }}
                  className="ml-0.5 flex-shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors"
                  title="Salin nomor"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                {new Date().toLocaleDateString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-4">
              <button
                type="button"
                onClick={disconnectWA}
                disabled={disconnecting}
                className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {disconnecting ? "Memproses..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {waConnected ? null : (
        <Card>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              Status Koneksi
            </h2>
            {checking ? (
              <div className="h-5 w-32 animate-pulse rounded bg-zinc-200" />
            ) : (
              <p className="text-sm text-zinc-400">Belum terhubung</p>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {!waAccount && !waConnected && (
              <Button onClick={connectWhatsApp} loading={waConnecting}>
                Hubungkan WhatsApp
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={syncAccounts}
              loading={syncing}
            >
              Sync
            </Button>
            <Button
              variant="secondary"
              onClick={testConnection}
              loading={testing}
            >
              Test Koneksi
            </Button>
          </div>
          {waConnectError && (
            <p className="text-sm text-red-500">{waConnectError}</p>
          )}
          {syncResult && (
            <p
              className={`text-sm ${syncResult.ok ? "text-emerald-600" : "text-amber-600"}`}
            >
              {syncResult.msg}
            </p>
          )}
          {testResult && (
            <p
              className={`text-sm ${testResult.ok ? "text-emerald-600" : "text-red-500"}`}
            >
              {testResult.msg}
            </p>
          )}
        </div>
      </Card>

      {!waAccount && !waConnected && (
        <Card>
          <div className="space-y-2 text-sm text-zinc-600">
            <p>
              Klik <strong>Hubungkan WhatsApp</strong> untuk membuka halaman
              otorisasi Zernio. Setelah menyelesaikan otorisasi, Anda akan
              diarahkan kembali ke halaman ini.
            </p>
            <p className="text-xs text-zinc-400">
              Pastikan Anda sudah login ke akun Zernio di browser yang sama.
            </p>
          </div>
        </Card>
      )}

      <Card>
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="flex w-full items-center justify-between text-sm font-medium text-zinc-700"
        >
          Panduan Koneksi
          <svg
            className={`h-4 w-4 transition-transform ${guideOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {guideOpen && (
          <ol className="mt-4 space-y-2 text-sm text-zinc-600 list-decimal pl-5">
            <li>
              Klik <strong>Hubungkan WhatsApp</strong> untuk memulai
            </li>
            <li>
              Login ke akun Zernio (jika belum) dan izinkan akses ke WhatsApp
            </li>
            <li>
              Setelah otorisasi selesai, Anda akan diarahkan kembali ke halaman
              ini
            </li>
          </ol>
        )}
      </Card>
    </div>
  );
}

function BotTab({
  business,
  onUpdate,
}: {
  business: BusinessData;
  onUpdate: (b: BusinessData) => void;
}) {
  const [welcome, setWelcome] = useState(
    business.welcomeMessage || DEFAULT_WELCOME,
  );
  const [confirm, setConfirm] = useState(
    business.confirmTemplate || DEFAULT_CONFIRM,
  );
  const [reminder, setReminder] = useState(
    business.reminderTemplate || DEFAULT_REMINDER,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const welcomeRef = useRef<HTMLTextAreaElement | null>(null);
  const confirmRef = useRef<HTMLTextAreaElement | null>(null);
  const reminderRef = useRef<HTMLTextAreaElement | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: business.id,
          welcomeMessage: welcome,
          confirmTemplate: confirm,
          reminderTemplate: reminder,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      onUpdate({
        ...business,
        welcomeMessage: welcome,
        confirmTemplate: confirm,
        reminderTemplate: reminder,
      });
      setMessage({ type: "success", text: "Template berhasil disimpan" });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resetDefaults = () => {
    setWelcome(DEFAULT_WELCOME);
    setConfirm(DEFAULT_CONFIRM);
    setReminder(DEFAULT_REMINDER);
  };

  const openPreview = (label: string, text: string) => {
    setPreviewLabel(label);
    setPreviewText(resolvePreview(text, business.name));
    setPreviewOpen(true);
  };

  return (
    <Card>
      <div className="space-y-6">
        <TemplateField
          label="Pesan Sambutan"
          description="Pesan yang dikirim saat pelanggan memulai chat"
          value={welcome}
          onChange={setWelcome}
          textareaRef={welcomeRef}
        />
        <Button
          variant="ghost"
          onClick={() => openPreview("Pesan Sambutan", welcome)}
        >
          Preview Pesan
        </Button>

        <TemplateField
          label="Pesan Konfirmasi Booking"
          description="Pesan yang dikirim saat booking dikonfirmasi"
          value={confirm}
          onChange={setConfirm}
          textareaRef={confirmRef}
        />
        <Button
          variant="ghost"
          onClick={() => openPreview("Pesan Konfirmasi Booking", confirm)}
        >
          Preview Pesan
        </Button>

        <TemplateField
          label="Pesan Pengingat H-1"
          description="Pesan pengingat yang dikirim H-1 sebelum jadwal booking"
          value={reminder}
          onChange={setReminder}
          textareaRef={reminderRef}
        />
        <Button
          variant="ghost"
          onClick={() => openPreview("Pesan Pengingat H-1", reminder)}
        >
          Preview Pesan
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
          <Button variant="secondary" onClick={resetDefaults}>
            Reset ke Default
          </Button>
          <div className="flex items-center gap-2">
            {message && (
              <p
                className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-500"}`}
              >
                {message.text}
              </p>
            )}
            <Button onClick={save} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview: ${previewLabel}`}
      >
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="whitespace-pre-wrap text-sm text-zinc-800">
            {previewText}
          </p>
        </div>
      </Dialog>
    </Card>
  );
}

function NotifikasiTab() {
  const [sendToWa, setSendToWa] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [dailySummary, setDailySummary] = useState(false);
  const [summaryTime, setSummaryTime] = useState("07:00");
  const [saved, setSaved] = useState(false);

  const save = () => {
    const data = { sendToWa, waNumber, dailySummary, summaryTime };
    localStorage.setItem("notification-settings", JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <div className="space-y-5">
        <p className="text-sm text-zinc-500">
          Notifikasi akan dikirim ke nomor WhatsApp pribadi Anda.
        </p>

        <Toggle
          checked={sendToWa}
          onChange={setSendToWa}
          label="Terima notifikasi WA untuk booking baru"
        />
        {sendToWa && (
          <Input
            label="Nomor WA Pribadi"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="628123456789"
          />
        )}

        <Toggle
          checked={dailySummary}
          onChange={setDailySummary}
          label="Terima ringkasan booking harian via WA"
        />
        {dailySummary && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Jam Pengiriman Ringkasan
            </label>
            <input
              type="time"
              value={summaryTime}
              onChange={(e) => setSummaryTime(e.target.value)}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={save}>Simpan</Button>
          {saved && (
            <p className="text-sm text-emerald-600">Pengaturan tersimpan</p>
          )}
        </div>
      </div>
    </Card>
  );
}
