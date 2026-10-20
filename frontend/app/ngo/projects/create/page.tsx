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

type Project = {
  id: number;
  title: string;
};

type CreateResponse = {
  message: string;
  data: Project;
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
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

function formatPreviewDate(
  date: string,
) {
  if (!date) {
    return "Choose date";
  }

  return new Date(
    date,
  ).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function formatPreviewTime(
  date: string,
) {
  if (!date) {
    return "--:--";
  }

  return new Date(
    date,
  ).toLocaleTimeString(
    "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function riskClass(
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

export default function CreateNgoProjectPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [startAt, setStartAt] =
    useState("");

  const [endAt, setEndAt] =
    useState("");

  const [
    capacity,
    setCapacity,
  ] = useState("10");

  const [skills, setSkills] =
    useState("");

  const [
    interests,
    setInterests,
  ] = useState("");

  const [
    riskLevel,
    setRiskLevel,
  ] = useState<
    "low" | "medium" | "high"
  >("low");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

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
    setAuthLoading(false);
  }, [router]);

  const skillList =
    useMemo(() => {
      return skills
        .split(",")
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean);
    }, [skills]);

  const interestList =
    useMemo(() => {
      return interests
        .split(",")
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean);
    }, [interests]);

  const formProgress =
    useMemo(() => {
      const fields = [
        title.trim(),
        description.trim(),
        startAt,
        endAt,
        capacity,
      ];

      const completed =
        fields.filter(Boolean)
          .length;

      return Math.round(
        (completed /
          fields.length) *
          100,
      );
    }, [
      title,
      description,
      startAt,
      endAt,
      capacity,
    ]);

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

    try {
      await apiFetch<CreateResponse>(
        "/ngo/projects",
        {
          method: "POST",
          token,

          body: JSON.stringify({
            title:
              title.trim(),

            description:
              description.trim(),

            location:
              location.trim() ||
              null,

            start_at:
              new Date(
                startAt,
              ).toISOString(),

            end_at:
              new Date(
                endAt,
              ).toISOString(),

            capacity:
              Number(
                capacity,
              ),

            required_skills:
              skillList,

            required_interests:
              interestList,

            risk_level:
              riskLevel,
          }),
        },
      );

      router.push(
        "/ngo/projects",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat project.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (
    authLoading ||
    !user
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan create project...
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
        className="space-y-9"
      >
        {/* BACK */}
        <motion.div
          variants={
            sectionVariants
          }
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/ngo/projects",
              )
            }
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#81748c] transition-colors hover:text-[#6d35e8]"
          >
            ← Back to Projects
          </button>
        </motion.div>

        {/* HERO */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[390px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                CREATE OPPORTUNITY
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                New volunteer project
                ✨
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Start with an idea.

                <span className="block text-[#6d35e8]">
                  Turn it into impact.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Buat project volunteer
                baru, tentukan schedule,
                requirements, capacity,
                dan risk level sebelum
                masuk ke proses review.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "project-form",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Start Creating
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/projects",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  View Projects →
                </button>
              </div>
            </div>

            {/* RIGHT PHOTO */}
            <div className="relative hidden min-h-[390px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Create volunteer project"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* PROGRESS */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[10px] font-bold text-[#6d35e8]">
                  {formProgress}%
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Form Progress
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Draft project
                  </p>
                </div>
              </div>

              {/* PREVIEW */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                        Live Preview
                      </span>

                      <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                      <span
                        className={`rounded-full px-2 py-0.5 text-[8px] font-semibold capitalize ${riskClass(
                          riskLevel,
                        )}`}
                      >
                        {riskLevel} risk
                      </span>
                    </div>

                    <h3 className="mt-2 truncate text-[18px] font-bold tracking-[-0.02em] text-[#19131f]">
                      {title ||
                        "Your project title"}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#81748c]">
                      {description ||
                        "Project description will appear here as you type."}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <PreviewStat
                        label="Capacity"
                        value={`${capacity || 0}`}
                      />

                      <PreviewStat
                        label="Date"
                        value={formatPreviewDate(
                          startAt,
                        )}
                      />

                      <PreviewStat
                        label="Skills"
                        value={`${skillList.length}`}
                      />
                    </div>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)]">
                    +
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FLOW STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <FlowStat
              number="01"
              label="Create"
              description="Build project draft"
            />

            <FlowStat
              number="02"
              label="Submit"
              description="Send for review"
            />

            <FlowStat
              number="03"
              label="Moderation"
              description="Admin review"
            />

            <FlowStat
              number="04"
              label="Published"
              description="Students can apply"
            />
          </div>
        </motion.section>

        {/* ERROR */}
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
                  Cannot create project
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* MAIN FORM */}
        <motion.section
          variants={
            sectionVariants
          }
          id="project-form"
          className="scroll-mt-28"
        >
          <form
            onSubmit={
              handleSubmit
            }
            className="grid gap-6 xl:grid-cols-[1fr_360px]"
          >
            {/* LEFT FORM */}
            <div className="space-y-6">
              {/* BASIC */}
              <FormSection
                eyebrow="Basic Information"
                title="Project overview"
                description="Jelaskan opportunity yang akan dibuat dan bagaimana student akan berkontribusi."
              >
                <Field
                  label="Project Title"
                  required
                >
                  <input
                    required
                    maxLength={255}
                    value={title}
                    onChange={(
                      event,
                    ) =>
                      setTitle(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Beach Cleanup Sanur"
                    className={
                      inputClass
                    }
                  />
                </Field>

                <Field
                  label="Description"
                  required
                >
                  <textarea
                    required
                    rows={6}
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
                    placeholder="Describe the volunteer activity, goals, and what volunteers will do..."
                    className={`${inputClass} resize-none`}
                  />

                  <div className="mt-2 flex justify-between text-[10px] text-[#a095aa]">
                    <span>
                      Explain the activity clearly.
                    </span>

                    <span>
                      {
                        description.length
                      }{" "}
                      characters
                    </span>
                  </div>
                </Field>

                <Field
                  label="Location"
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#a091a9]">
                      📍
                    </span>

                    <input
                      maxLength={
                        255
                      }
                      value={
                        location
                      }
                      onChange={(
                        event,
                      ) =>
                        setLocation(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Sanur Beach, Bali"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </Field>
              </FormSection>

              {/* SCHEDULE */}
              <FormSection
                eyebrow="Schedule"
                title="When will it happen?"
                description="Atur waktu mulai dan selesai kegiatan volunteer."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Start"
                    required
                  >
                    <input
                      required
                      type="datetime-local"
                      value={
                        startAt
                      }
                      onChange={(
                        event,
                      ) =>
                        setStartAt(
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field
                    label="End"
                    required
                  >
                    <input
                      required
                      type="datetime-local"
                      value={
                        endAt
                      }
                      onChange={(
                        event,
                      ) =>
                        setEndAt(
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>
                </div>

                {(startAt ||
                  endAt) && (
                  <div className="grid gap-3 rounded-xl bg-[#faf8ff] p-4 sm:grid-cols-2">
                    <MiniSummary
                      label="Starts"
                      value={
                        startAt
                          ? `${formatPreviewDate(
                              startAt,
                            )} • ${formatPreviewTime(
                              startAt,
                            )}`
                          : "Not set"
                      }
                    />

                    <MiniSummary
                      label="Ends"
                      value={
                        endAt
                          ? `${formatPreviewDate(
                              endAt,
                            )} • ${formatPreviewTime(
                              endAt,
                            )}`
                          : "Not set"
                      }
                    />
                  </div>
                )}
              </FormSection>

              {/* REQUIREMENTS */}
              <FormSection
                eyebrow="Volunteer Requirements"
                title="Who are you looking for?"
                description="Tentukan jumlah volunteer, skill yang dibutuhkan, dan interest yang relevan."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Volunteer Capacity"
                    required
                  >
                    <input
                      required
                      min={1}
                      type="number"
                      value={
                        capacity
                      }
                      onChange={(
                        event,
                      ) =>
                        setCapacity(
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field
                    label="Risk Level"
                    required
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
                </div>

                <Field
                  label="Required Skills"
                >
                  <input
                    value={skills}
                    onChange={(
                      event,
                    ) =>
                      setSkills(
                        event.target
                          .value,
                      )
                    }
                    placeholder="communication, teamwork, leadership"
                    className={
                      inputClass
                    }
                  />

                  <p className="mt-2 text-[10px] text-[#9a8da5]">
                    Pisahkan setiap skill
                    menggunakan koma.
                  </p>

                  {skillList.length >
                    0 && (
                    <TagPreview
                      items={
                        skillList
                      }
                    />
                  )}
                </Field>

                <Field
                  label="Relevant Interests"
                >
                  <input
                    value={
                      interests
                    }
                    onChange={(
                      event,
                    ) =>
                      setInterests(
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
                    interest menggunakan
                    koma.
                  </p>

                  {interestList.length >
                    0 && (
                    <TagPreview
                      items={
                        interestList
                      }
                    />
                  )}
                </Field>
              </FormSection>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              {/* LIVE PREVIEW */}
              <div className="overflow-hidden rounded-[24px] border border-[#ece7f5] bg-white shadow-[0_12px_35px_rgba(72,45,120,0.07)]">
                <div className="relative h-[170px] overflow-hidden">
                  <img
                    src={
                      heroImage
                    }
                    alt="Project preview"
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                  <div className="absolute left-4 top-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-[9px] font-semibold capitalize shadow-sm ${riskClass(
                        riskLevel,
                      )}`}
                    >
                      {riskLevel} risk
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-5 right-5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/65">
                      Draft Preview
                    </p>

                    <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                      {title ||
                        "Project title"}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <p className="line-clamp-3 min-h-[60px] text-xs leading-5 text-[#80738a]">
                    {description ||
                      "Your project description will appear here."}
                  </p>

                  <div className="mt-5 space-y-3">
                    <PreviewRow
                      label="Location"
                      value={
                        location ||
                        "Flexible location"
                      }
                    />

                    <PreviewRow
                      label="Date"
                      value={formatPreviewDate(
                        startAt,
                      )}
                    />

                    <PreviewRow
                      label="Capacity"
                      value={`${capacity || 0} volunteers`}
                    />

                    <PreviewRow
                      label="Skills"
                      value={`${skillList.length} selected`}
                    />
                  </div>

                  <div className="mt-5 border-t border-[#f0edf5] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9d90a7]">
                        Initial Status
                      </span>

                      <span className="rounded-full bg-[#f1eef4] px-2.5 py-1 text-[9px] font-semibold text-[#716678]">
                        Draft
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WORKFLOW */}
              <div className="rounded-[22px] border border-[#e8dfff] bg-[#f7f3ff] p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#6d35e8] shadow-sm">
                  ◇
                </div>

                <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b78a6]">
                  Draft Workflow
                </p>

                <h3 className="mt-2 text-base font-semibold text-[#2f2338]">
                  Create first. Submit when ready.
                </h3>

                <p className="mt-2 text-xs leading-5 text-[#796b85]">
                  Project baru akan
                  disimpan dengan status
                  draft. Setelah itu kamu
                  bisa membuka project dan
                  submit untuk direview
                  admin.
                </p>

                <div className="mt-5 space-y-3">
                  <WorkflowItem
                    active
                    number="1"
                    text="Create draft"
                  />

                  <WorkflowItem
                    number="2"
                    text="Submit project"
                  />

                  <WorkflowItem
                    number="3"
                    text="Admin moderation"
                  />

                  <WorkflowItem
                    number="4"
                    text="Published"
                  />
                </div>
              </div>

              {/* FORM PROGRESS */}
              <div className="rounded-[22px] border border-[#ece7f5] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#96889f]">
                      Form Progress
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#352a3e]">
                      {formProgress}%
                      complete
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3eeff] text-xs font-bold text-[#6d35e8]">
                    {formProgress}
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eee9f3]">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${formProgress}%`,
                    }}
                    transition={{
                      duration: 0.4,
                    }}
                    className="h-full rounded-full bg-[#6d35e8]"
                  />
                </div>
              </div>

              {/* BUTTON */}
              <button
                disabled={
                  saving
                }
                type="submit"
                className="w-full rounded-xl bg-[#6d35e8] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(109,53,232,0.2)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating Project..."
                  : "Create Draft Project →"}
              </button>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  router.push(
                    "/ngo/projects",
                  )
                }
                className="w-full rounded-xl border border-[#e8e2ee] bg-white px-6 py-3.5 text-sm font-semibold text-[#70637a] transition-colors hover:bg-[#faf8ff]"
              >
                Cancel
              </button>
            </aside>
          </form>
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

function PreviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#f7f3fc] px-3 py-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9587a2]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-[#24182d]">
        {value}
      </p>
    </div>
  );
}

function FlowStat({
  number,
  label,
  description,
}: {
  number: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-r sm:even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3eeff] text-[9px] font-bold text-[#6d35e8]">
        {number}
      </div>

      <div>
        <p className="text-[10px] font-semibold text-[#41354b]">
          {label}
        </p>

        <p className="mt-1 text-[9px] text-[#a094aa]">
          {description}
        </p>
      </div>
    </div>
  );
}

function MiniSummary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9e91a7]">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-[#514458]">
        {value}
      </p>
    </div>
  );
}

function TagPreview({
  items,
}: {
  items: string[];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map(
        (item) => (
          <span
            key={item}
            className="rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[9px] font-semibold text-[#6d35e8]"
          >
            {item}
          </span>
        ),
      )}
    </div>
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

      <span className="max-w-[180px] truncate text-right text-[10px] font-semibold text-[#55485f]">
        {value}
      </span>
    </div>
  );
}

function WorkflowItem({
  number,
  text,
  active = false,
}: {
  number: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ${
          active
            ? "bg-[#6d35e8] text-white"
            : "bg-white text-[#9d90a7]"
        }`}
      >
        {number}
      </div>

      <p
        className={`text-[11px] font-medium ${
          active
            ? "text-[#4a3857]"
            : "text-[#93869e]"
        }`}
      >
        {text}
      </p>
    </div>
  );
}