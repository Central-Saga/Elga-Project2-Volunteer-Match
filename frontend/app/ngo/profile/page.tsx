"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
  {
    label: "Dashboard",
    href: "/ngo",
  },
  {
    label: "Projects",
    href: "/ngo/projects",
  },
  {
    label: "Applications",
    href: "/ngo/applications",
  },
  {
    label: "Verification",
    href: "/ngo/verification",
  },
  {
    label: "Profile",
    href: "/ngo/profile",
  },
];

const pageVariants = {
  hidden: {},

  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  show: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
    },
  },
};

const heroImage =
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=90";

function getVerificationLabel(
  status?: string | null,
) {
  switch (status) {
    case "approved":
      return "Verified";

    case "submitted":
      return "Submitted";

    case "reviewing":
      return "Under Review";

    case "rejected":
      return "Rejected";

    case "needs_info":
      return "Needs Info";

    default:
      return "Not Submitted";
  }
}

function getVerificationClass(
  status?: string | null,
) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";

    case "submitted":
    case "reviewing":
      return "bg-amber-50 text-amber-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    case "needs_info":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-[#f1eef4] text-[#746b7c]";
  }
}

function getRiskClass(
  risk: "low" | "medium" | "high",
) {
  switch (risk) {
    case "high":
      return "bg-red-50 text-red-700";

    case "medium":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

export default function NgoProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    organizationName,
    setOrganizationName,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    focusAreas,
    setFocusAreas,
  ] = useState("");

  const [
    contactEmail,
    setContactEmail,
  ] = useState("");

  const [
    contactPhone,
    setContactPhone,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    riskLevel,
    setRiskLevel,
  ] = useState<
    "low" | "medium" | "high"
  >("low");

  const [
    verificationStatus,
    setVerificationStatus,
  ] = useState<string>(
    "not_submitted",
  );

  const [
    verificationTier,
    setVerificationTier,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    const token =
      getStoredToken();

    const storedUser =
      getStoredUser();

    if (
      !token ||
      !storedUser
    ) {
      router.replace(
        "/login",
      );

      return;
    }

    if (
      storedUser.role !==
      "ngo"
    ) {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProfile(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<ProfileResponse>(
            "/ngo/profile",
            {
              token:
                authToken,
            },
          );

        const profile =
          response.profile;

        if (profile) {
          setOrganizationName(
            profile.organization_name ??
              "",
          );

          setDescription(
            profile.description ??
              "",
          );

          setFocusAreas(
            Array.isArray(
              profile.focus_areas,
            )
              ? profile.focus_areas.join(
                  ", ",
                )
              : "",
          );

          setContactEmail(
            profile.contact_email ??
              "",
          );

          setContactPhone(
            profile.contact_phone ??
              "",
          );

          setAddress(
            profile.address ??
              "",
          );

          setRiskLevel(
            profile.risk_level ??
              "low",
          );

          setVerificationStatus(
            profile.verification_status ??
              "not_submitted",
          );

          setVerificationTier(
            profile.verification_tier ??
              null,
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil profile NGO.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile(token);
  }, [router]);

  const focusAreaList =
    useMemo(() => {
      return focusAreas
        .split(",")
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean);
    }, [focusAreas]);

  const profileCompletion =
    useMemo(() => {
      const values = [
        organizationName.trim(),
        description.trim(),
        focusAreas.trim(),
        contactEmail.trim(),
        contactPhone.trim(),
        address.trim(),
      ];

      const completed =
        values.filter(Boolean)
          .length;

      return Math.round(
        (completed /
          values.length) *
          100,
      );
    }, [
      organizationName,
      description,
      focusAreas,
      contactEmail,
      contactPhone,
      address,
    ]);

  const initials =
    organizationName
      .split(" ")
      .map((part) =>
        part.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user?.name
      ?.split(" ")
      .map((part) =>
        part.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "NG";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<UpdateResponse>(
          "/ngo/profile",
          {
            method: "PUT",
            token,

            body: JSON.stringify(
              {
                organization_name:
                  organizationName.trim(),

                description:
                  description.trim() ||
                  null,

                focus_areas:
                  focusAreaList.length >
                  0
                    ? focusAreaList
                    : null,

                contact_email:
                  contactEmail.trim() ||
                  null,

                contact_phone:
                  contactPhone.trim() ||
                  null,

                address:
                  address.trim() ||
                  null,

                risk_level:
                  riskLevel,
              },
            ),
          },
        );

      setVerificationStatus(
        response.profile
          .verification_status ??
          verificationStatus,
      );

      setVerificationTier(
        response.profile
          .verification_tier ??
          verificationTier,
      );

      setSuccess(
        response.message ||
          "NGO profile saved successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan profile NGO.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan profile NGO...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="ngo"
      navigation={
        navigation
      }
    >
      <motion.div
        variants={
          pageVariants
        }
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* HERO */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[410px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                ORGANIZATION PROFILE
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Your organization
                identity ✨
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Tell your story.

                <span className="block text-[#6d35e8]">
                  Build lasting trust.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Lengkapi identitas
                organisasi agar student
                dapat memahami siapa kamu
                dan admin memiliki informasi
                yang jelas dalam proses
                verification.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "profile-form",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/verification",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Verification →
                </button>
              </div>
            </div>

            {/* PHOTO */}
            <div className="relative hidden min-h-[410px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Organization profile"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* COMPLETION */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[10px] font-bold text-[#6d35e8]">
                  {profileCompletion}%
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Profile Completion
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Organization profile
                  </p>
                </div>
              </div>

              {/* GLASS PROFILE */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#6d35e8] text-base font-bold text-white shadow-[0_8px_20px_rgba(109,53,232,0.2)]">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8d7d9e]">
                      Organization
                    </p>

                    <h3 className="mt-1 truncate text-lg font-bold text-[#19131f]">
                      {organizationName ||
                        user.name}
                    </h3>

                    <p className="mt-1 truncate text-[10px] text-[#84778f]">
                      {contactEmail ||
                        "Contact email not set"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold ${getVerificationClass(
                      verificationStatus,
                    )}`}
                  >
                    {getVerificationLabel(
                      verificationStatus,
                    )}
                  </span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eee9f3]">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${profileCompletion}%`,
                    }}
                    transition={{
                      duration: 0.7,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full bg-[#6d35e8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INFO STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroInfo
              label="Verification"
              value={getVerificationLabel(
                verificationStatus,
              )}
              description="Trust status"
            />

            <HeroInfo
              label="Tier"
              value={
                verificationTier ||
                "Not Assigned"
              }
              description="Verification tier"
            />

            <HeroInfo
              label="Risk Level"
              value={riskLevel}
              description="Organization risk"
            />

            <HeroInfo
              label="Focus Areas"
              value={`${focusAreaList.length}`}
              description="Active categories"
            />
          </div>
        </motion.section>

        {/* ALERTS */}
        {error && (
          <motion.div
            variants={
              sectionVariants
            }
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                ×
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{
              opacity: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                ✓
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Profile updated
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {success}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* OVERVIEW */}
        {!loading && (
          <motion.section
            variants={
              sectionVariants
            }
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Organization Overview
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Your identity at a glance
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Informasi utama yang
                menggambarkan organization
                profile kamu.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <OverviewCard
                number="01"
                label="Organization"
                value={
                  organizationName ||
                  "Not set"
                }
                description={
                  description ||
                  "Organization description belum diisi."
                }
              />

              <OverviewCard
                number="02"
                label="Contact"
                value={
                  contactEmail ||
                  "Not set"
                }
                description={
                  contactPhone ||
                  "Phone number belum diisi."
                }
              />

              <OverviewCard
                number="03"
                label="Trust"
                value={getVerificationLabel(
                  verificationStatus,
                )}
                description={`Risk level: ${riskLevel}`}
              />
            </div>
          </motion.section>
        )}

        {/* FORM */}
        <motion.section
          variants={
            sectionVariants
          }
          id="profile-form"
          className="scroll-mt-28"
        >
          <form
            onSubmit={
              handleSubmit
            }
            className="grid gap-6 xl:grid-cols-[1fr_350px]"
          >
            {/* LEFT */}
            <div className="space-y-6">
              {/* IDENTITY */}
              <FormSection
                eyebrow="Organization Identity"
                title="Basic information"
                description="Informasi ini menjadi identitas utama organisasi di Volunteer Match."
              >
                {loading ? (
                  <LoadingFields
                    count={3}
                  />
                ) : (
                  <>
                    <Field
                      label="Organization Name"
                      required
                    >
                      <input
                        required
                        value={
                          organizationName
                        }
                        onChange={(
                          event,
                        ) =>
                          setOrganizationName(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Example: Yayasan Volunteer Bali"
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field
                      label="Description"
                    >
                      <textarea
                        value={
                          description
                        }
                        onChange={(
                          event,
                        ) =>
                          setDescription(
                            event.target
                              .value,
                          )
                        }
                        rows={6}
                        placeholder="Tell students about your organization..."
                        className={`${inputClass} resize-none leading-6`}
                      />

                      <p className="mt-2 text-[10px] leading-5 text-[#9a8da5]">
                        Ceritakan tujuan,
                        aktivitas, atau
                        impact utama
                        organisasi.
                      </p>
                    </Field>

                    <Field
                      label="Focus Areas"
                    >
                      <input
                        value={
                          focusAreas
                        }
                        onChange={(
                          event,
                        ) =>
                          setFocusAreas(
                            event.target
                              .value,
                          )
                        }
                        placeholder="environment, education, community"
                        className={
                          inputClass
                        }
                      />

                      <p className="mt-2 text-[10px] text-[#9a8da5]">
                        Pisahkan setiap
                        focus area dengan
                        koma.
                      </p>

                      {focusAreaList.length >
                        0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {focusAreaList.map(
                            (
                              area,
                            ) => (
                              <span
                                key={
                                  area
                                }
                                className="rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[9px] font-semibold text-[#6d35e8]"
                              >
                                {area}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </Field>
                  </>
                )}
              </FormSection>

              {/* CONTACT */}
              <FormSection
                eyebrow="Contact"
                title="Contact information"
                description="Berikan informasi yang dapat digunakan untuk komunikasi terkait project dan organisasi."
              >
                {loading ? (
                  <LoadingFields
                    count={3}
                  />
                ) : (
                  <>
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Contact Email"
                      >
                        <input
                          type="email"
                          value={
                            contactEmail
                          }
                          onChange={(
                            event,
                          ) =>
                            setContactEmail(
                              event.target
                                .value,
                            )
                          }
                          placeholder="contact@organization.org"
                          className={
                            inputClass
                          }
                        />
                      </Field>

                      <Field
                        label="Contact Phone"
                      >
                        <input
                          value={
                            contactPhone
                          }
                          onChange={(
                            event,
                          ) =>
                            setContactPhone(
                              event.target
                                .value,
                            )
                          }
                          placeholder="+62..."
                          className={
                            inputClass
                          }
                        />
                      </Field>
                    </div>

                    <Field
                      label="Address"
                    >
                      <textarea
                        value={
                          address
                        }
                        onChange={(
                          event,
                        ) =>
                          setAddress(
                            event.target
                              .value,
                          )
                        }
                        rows={4}
                        placeholder="Organization address"
                        className={`${inputClass} resize-none leading-6`}
                      />
                    </Field>
                  </>
                )}
              </FormSection>

              {/* RISK */}
              <FormSection
                eyebrow="Organization Settings"
                title="Risk classification"
                description="Risk level membantu platform memahami kebutuhan review organisasi."
              >
                {loading ? (
                  <LoadingFields
                    count={1}
                  />
                ) : (
                  <>
                    <Field
                      label="Risk Level"
                    >
                      <select
                        value={
                          riskLevel
                        }
                        onChange={(
                          event,
                        ) =>
                          setRiskLevel(
                            event.target
                              .value as
                              | "low"
                              | "medium"
                              | "high",
                          )
                        }
                        className={
                          inputClass
                        }
                      >
                        <option value="low">
                          Low
                        </option>

                        <option value="medium">
                          Medium
                        </option>

                        <option value="high">
                          High
                        </option>
                      </select>
                    </Field>

                    <div
                      className={`rounded-xl p-4 ${
                        riskLevel ===
                        "high"
                          ? "bg-red-50"
                          : riskLevel ===
                              "medium"
                            ? "bg-amber-50"
                            : "bg-emerald-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${getRiskClass(
                            riskLevel,
                          )}`}
                        >
                          {riskLevel}
                        </span>

                        <p className="text-xs leading-5 text-[#665970]">
                          {riskLevel ===
                          "high"
                            ? "High-risk organization activities may require additional review and information."
                            : riskLevel ===
                                "medium"
                              ? "Medium-risk activities may require additional context depending on project scope."
                              : "Low-risk classification follows the standard review workflow."}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </FormSection>
            </div>

            {/* RIGHT */}
            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              {/* PROFILE PREVIEW */}
              <div className="overflow-hidden rounded-[24px] border border-[#ece7f5] bg-white shadow-[0_12px_35px_rgba(72,45,120,0.07)]">
                <div className="relative h-[160px] overflow-hidden">
                  <img
                    src={heroImage}
                    alt="Organization"
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute bottom-4 left-5 right-5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/65">
                      Organization Preview
                    </p>

                    <h3 className="mt-1 truncate text-lg font-semibold text-white">
                      {organizationName ||
                        "Organization name"}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${getVerificationClass(
                        verificationStatus,
                      )}`}
                    >
                      {getVerificationLabel(
                        verificationStatus,
                      )}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${getRiskClass(
                        riskLevel,
                      )}`}
                    >
                      {riskLevel} risk
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 min-h-[60px] text-xs leading-5 text-[#7b6e85]">
                    {description ||
                      "Organization description will appear here."}
                  </p>

                  <div className="mt-5 space-y-3 border-t border-[#f0edf5] pt-4">
                    <PreviewRow
                      label="Email"
                      value={
                        contactEmail ||
                        "Not set"
                      }
                    />

                    <PreviewRow
                      label="Phone"
                      value={
                        contactPhone ||
                        "Not set"
                      }
                    />

                    <PreviewRow
                      label="Focus Areas"
                      value={`${focusAreaList.length}`}
                    />
                  </div>
                </div>
              </div>

              {/* COMPLETION */}
              <div className="rounded-[22px] border border-[#e8dfff] bg-[#f7f3ff] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8874aa]">
                      Profile Completion
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#30233a]">
                      {profileCompletion}%
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-bold text-[#6d35e8] shadow-sm">
                    {profileCompletion}
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${profileCompletion}%`,
                    }}
                    transition={{
                      duration: 0.5,
                    }}
                    className="h-full rounded-full bg-[#6d35e8]"
                  />
                </div>

                <p className="mt-4 text-[10px] leading-5 text-[#81718d]">
                  Profile yang lengkap
                  membantu student dan admin
                  memahami organization
                  identity dengan lebih
                  jelas.
                </p>
              </div>

              {/* VERIFICATION */}
              <div className="rounded-[22px] border border-[#ece7f5] bg-white p-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#988ba2]">
                  Verification
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#4a3d53]">
                    Status
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${getVerificationClass(
                      verificationStatus,
                    )}`}
                  >
                    {getVerificationLabel(
                      verificationStatus,
                    )}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#4a3d53]">
                    Tier
                  </span>

                  <span className="text-[10px] font-semibold text-[#81748c]">
                    {verificationTier ||
                      "Not Assigned"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/verification",
                    )
                  }
                  className="mt-5 w-full rounded-xl bg-[#f3eeff] px-4 py-3 text-xs font-semibold text-[#6d35e8] transition-colors hover:bg-[#ebe3ff]"
                >
                  Manage Verification →
                </button>
              </div>

              {/* SAVE */}
              <button
                type="submit"
                disabled={
                  saving ||
                  loading
                }
                className="w-full rounded-xl bg-[#6d35e8] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(109,53,232,0.2)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving Profile..."
                  : "Save Profile →"}
              </button>
            </aside>
          </form>
        </motion.section>

        {/* WHY PROFILE */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
              Organization Identity
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
              Why your profile matters
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <FeatureCard
              number="01"
              title="Student Trust"
              description="A clear profile helps students understand the organization behind each project."
            />

            <FeatureCard
              number="02"
              title="Verification Context"
              description="Organization information provides context during the verification process."
            />

            <FeatureCard
              number="03"
              title="Project Identity"
              description="Your organization profile supports a consistent identity across volunteer opportunities."
            />
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#5e2bd0] via-[#7b45eb] to-[#aa78ed] px-7 py-8 text-white"
        >
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/10" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Organization Workspace
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Ready to create more impact?
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/75">
                Keep your profile accurate,
                create meaningful projects,
                and connect with more
                volunteers.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/ngo/projects/create",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              + Create Project
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#e8e2ee] bg-white px-4 py-3.5 text-sm text-[#352a3e] outline-none transition placeholder:text-[#b4aabd] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#41364b]">
        {label}

        {required && (
          <span className="ml-1 text-[#6d35e8]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
      <div className="border-b border-[#f0edf5] pb-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
          {title}
        </h2>

        <p className="mt-2 max-w-xl text-xs leading-5 text-[#877a91]">
          {description}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {children}
      </div>
    </div>
  );
}

function HeroInfo({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-r sm:even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
          {label}
        </p>

        <p className="mt-1 text-[9px] text-[#aaa0b3]">
          {description}
        </p>
      </div>

      <p className="max-w-[145px] truncate text-right text-xs font-bold capitalize text-[#30283e]">
        {value}
      </p>
    </div>
  );
}

function OverviewCard({
  number,
  label,
  value,
  description,
}: {
  number: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-[20px] border border-[#eeeaf5] bg-white p-5 shadow-[0_6px_22px_rgba(72,45,120,0.04)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
          {number}
        </div>

        <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#a094aa]">
          {label}
        </span>
      </div>

      <p className="mt-5 line-clamp-1 text-sm font-semibold text-[#30283e]">
        {value}
      </p>

      <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-[#93869e]">
        {description}
      </p>
    </motion.div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9a8da4]">
        {label}
      </span>

      <span className="max-w-[185px] truncate text-right text-[10px] font-semibold text-[#55485f]">
        {value}
      </span>
    </div>
  );
}

function FeatureCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-[20px] border border-[#eeeaf5] bg-white p-5 shadow-[0_6px_22px_rgba(72,45,120,0.04)]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
        {number}
      </div>

      <h3 className="mt-5 text-sm font-semibold text-[#30283e]">
        {title}
      </h3>

      <p className="mt-2 text-[11px] leading-5 text-[#93869e]">
        {description}
      </p>
    </motion.div>
  );
}

function LoadingFields({
  count,
}: {
  count: number;
}) {
  return (
    <div className="space-y-5">
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse"
        >
          <div className="h-3 w-28 rounded bg-[#eeeaf2]" />

          <div className="mt-3 h-12 rounded-xl bg-[#f5f2f8]" />
        </div>
      ))}
    </div>
  );
}