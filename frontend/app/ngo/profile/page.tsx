"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type NgoProfile = {
  id?: number;
  user_id?: number;
  organization_name: string;
  description: string | null;
  focus_areas: string[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  verification_tier?: string | null;
  verification_status?: string | null;
  risk_level: "low" | "medium" | "high" | null;
};

type ProfileResponse = {
  profile: NgoProfile | null;
};

type UpdateResponse = {
  message: string;
  profile: NgoProfile;
};

const navigation = [
  { label: "Dashboard", href: "/ngo" },
  { label: "Projects", href: "/ngo/projects" },
  { label: "Applications", href: "/ngo/applications" },
  { label: "Verification", href: "/ngo/verification" },
  { label: "Profile", href: "/ngo/profile" },
];

export default function NgoProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [organizationName, setOrganizationName] = useState("");
  const [description, setDescription] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [riskLevel, setRiskLevel] = useState<
    "low" | "medium" | "high"
  >("low");

  const [verificationStatus, setVerificationStatus] =
    useState<string>("not_submitted");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "ngo") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProfile() {
      try {
        const response = await apiFetch<ProfileResponse>(
          "/ngo/profile",
          {
            token: token ?? undefined,
          }
        );

        const profile = response.profile;

        if (profile) {
          setOrganizationName(profile.organization_name ?? "");
          setDescription(profile.description ?? "");
          setFocusAreas(
            Array.isArray(profile.focus_areas)
              ? profile.focus_areas.join(", ")
              : ""
          );
          setContactEmail(profile.contact_email ?? "");
          setContactPhone(profile.contact_phone ?? "");
          setAddress(profile.address ?? "");
          setRiskLevel(profile.risk_level ?? "low");
          setVerificationStatus(
            profile.verification_status ?? "not_submitted"
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil profile NGO."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const focusAreaList = focusAreas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await apiFetch<UpdateResponse>(
        "/ngo/profile",
        {
          method: "PUT",
          token,
          body: JSON.stringify({
            organization_name: organizationName.trim(),
            description: description.trim() || null,
            focus_areas:
              focusAreaList.length > 0 ? focusAreaList : null,
            contact_email: contactEmail.trim() || null,
            contact_phone: contactPhone.trim() || null,
            address: address.trim() || null,
            risk_level: riskLevel,
          }),
        }
      );

      setVerificationStatus(
        response.profile.verification_status ??
          verificationStatus
      );

      setSuccess(
        response.message || "NGO profile saved successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan profile NGO."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />
          Menyiapkan profile NGO...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="ngo"
      navigation={navigation}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Organization
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                NGO Profile
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Informasi ini digunakan untuk identitas organisasi
                dan proses pengelolaan volunteer project.
              </p>
            </div>

            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold capitalize text-gray-600 shadow-sm ring-1 ring-black/5">
              Verification:{" "}
              {verificationStatus.replaceAll("_", " ")}
            </span>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Something went wrong
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-700">
              Profile updated
            </p>
            <p className="mt-1 text-sm text-emerald-600">
              {success}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
        >
          {loading ? (
            <div className="space-y-5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="mt-3 h-12 rounded-xl bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-7">
              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Organization Name
                </label>

                <input
                  required
                  value={organizationName}
                  onChange={(event) =>
                    setOrganizationName(event.target.value)
                  }
                  placeholder="Example: Yayasan Volunteer Bali"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={5}
                  placeholder="Tell students about your organization..."
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-gray-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Focus Areas
                </label>

                <input
                  value={focusAreas}
                  onChange={(event) =>
                    setFocusAreas(event.target.value)
                  }
                  placeholder="environment, education, community"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Pisahkan setiap focus area dengan koma.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-900">
                    Contact Email
                  </label>

                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) =>
                      setContactEmail(event.target.value)
                    }
                    placeholder="contact@organization.org"
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900">
                    Contact Phone
                  </label>

                  <input
                    value={contactPhone}
                    onChange={(event) =>
                      setContactPhone(event.target.value)
                    }
                    placeholder="+62..."
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Address
                </label>

                <textarea
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  rows={3}
                  placeholder="Organization address"
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-gray-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Risk Level
                </label>

                <select
                  value={riskLevel}
                  onChange={(event) =>
                    setRiskLevel(
                      event.target.value as
                        | "low"
                        | "medium"
                        | "high"
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-black/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-gray-400">
                  Organization name wajib diisi. Field lain
                  dapat dilengkapi sesuai kebutuhan organisasi.
                </p>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </DashboardShell>
  );
}