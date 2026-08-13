"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/src/components/ui/Avatar";
import { toast } from "@/src/components/ui/Toast";
import {
  getCurrentProfile,
  updateCurrentProfile,
  type CurrentProfile,
  type ProfileUpdatePayload,
} from "@/src/services/auth/authService";

type ProfileForm = Omit<ProfileUpdatePayload, "avatar_upload"> & {
  avatar_upload: File | null;
};

const inputClass = "w-full rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500";

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    first_name: "",
    last_name: "",
    phone_number: "",
    organization: "",
    farm_location: "",
    farm_group: "",
    avatar_upload: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const avatarPreview = useMemo(() => {
    return form.avatar_upload ? URL.createObjectURL(form.avatar_upload) : profile?.avatarUrl || "";
  }, [form.avatar_upload, profile?.avatarUrl]);

  useEffect(() => {
    return () => {
      if (form.avatar_upload && avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, form.avatar_upload]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const current = await getCurrentProfile();
      setProfile(current);
      setForm({
        first_name: current.firstName,
        last_name: current.lastName,
        phone_number: current.phoneNumber,
        organization: current.organization,
        farm_location: current.farmLocation,
        farm_group: current.farmGroup,
        avatar_upload: null,
      });
    } catch (error) {
      toast.error({
        title: "Could not load profile",
        description: error instanceof Error ? error.message : "Profile data could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadProfile]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      form.first_name !== profile.firstName ||
      form.last_name !== profile.lastName ||
      form.phone_number !== profile.phoneNumber ||
      form.organization !== profile.organization ||
      form.farm_location !== profile.farmLocation ||
      form.farm_group !== profile.farmGroup ||
      Boolean(form.avatar_upload)
    );
  }, [form, profile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasChanges) return;

    setSubmitting(true);
    try {
      const result = await updateCurrentProfile(form);
      setProfile(result.profile);
      setForm({
        first_name: result.profile.firstName,
        last_name: result.profile.lastName,
        phone_number: result.profile.phoneNumber,
        organization: result.profile.organization,
        farm_location: result.profile.farmLocation,
        farm_group: result.profile.farmGroup,
        avatar_upload: null,
      });
      toast.success({
        title: "Profile saved",
        description: result.message,
      });
    } catch (error) {
      toast.error({
        title: "Could not save profile",
        description: error instanceof Error ? error.message : "Profile changes could not be saved.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-main-200 bg-main-100 py-20 text-center text-main-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p className="mt-4 font-semibold">Loading profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <section className="rounded-xl border border-main-200 bg-main-100 p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative w-max">
            <Avatar src={avatarPreview} alt={`${form.first_name} ${form.last_name}`.trim() || profile?.email || "Profile"} initials={`${form.first_name} ${form.last_name}`.trim() || profile?.email || "Profile"} size={88} status="offline" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => setForm({ ...form, avatar_upload: event.target.files?.[0] ?? null })}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-main-100 bg-primary-600 text-main-0 hover:bg-primary-700"
              title="Upload profile picture"
              aria-label="Upload profile picture"
            >
              <i className="bi bi-camera-fill text-sm" />
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-main-950">{[form.first_name, form.last_name].filter(Boolean).join(" ") || profile?.username}</p>
            <p className="break-all text-sm text-main-500">{profile?.email}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-main-400">{typeof profile?.role === "string" ? profile.role : profile?.role?.name}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-main-200 bg-main-100 p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="First Name">
            <input value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Last Name">
            <input value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Phone Number">
            <input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Organization">
            <input value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Farm Location">
            <input value={form.farm_location} onChange={(event) => setForm({ ...form, farm_location: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Farm Group">
            <input value={form.farm_group} onChange={(event) => setForm({ ...form, farm_group: event.target.value })} className={inputClass} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            disabled={submitting || !hasChanges}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-main-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
