"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";

import { apiFetch } from "@/lib/api";

type Role =
  | "student"
  | "ngo"
  | "campus"
  | "admin";

type RegisterRole =
  | "student"
  | "ngo";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

type AuthResponse = {
  message: string;
  user: AuthUser;
  token: string;
};

type AuthMode =
  | "login"
  | "register";

type Campus = {
  id: number;
  name: string;
  code?: string | null;
};

type CampusesResponse = {
  message: string;
  data: Campus[];
};

const heroImage =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

const inputClass =
  "w-full rounded-xl border border-[#e7e1ed] bg-[#fbfaff] px-4 py-3.5 text-sm text-[#413548] outline-none transition placeholder:text-[#b1a6b8] focus:border-[#9c79ee] focus:bg-white focus:ring-4 focus:ring-[#6d35e8]/5";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [
    registerRole,
    setRegisterRole,
  ] =
    useState<RegisterRole>(
      "student",
    );

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Student Registration
  |--------------------------------------------------------------------------
  */

  const [
    campuses,
    setCampuses,
  ] = useState<Campus[]>([]);

  const [
    campusId,
    setCampusId,
  ] = useState("");

  const [nim, setNim] =
    useState("");

  const [
    studyProgram,
    setStudyProgram,
  ] = useState("");

  const [
    campusesLoading,
    setCampusesLoading,
  ] = useState(true);

  const [
    campusesError,
    setCampusesError,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Campuses
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadCampuses() {
      try {
        const response =
          await apiFetch<CampusesResponse>(
            "/campuses",
          );

        setCampuses(
          response.data ?? [],
        );
      } catch (err) {
        setCampusesError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil daftar kampus.",
        );
      } finally {
        setCampusesLoading(
          false,
        );
      }
    }

    loadCampuses();
  }, []);

  function redirectByRole(
    role: Role,
  ) {
    switch (role) {
      case "student":
        router.push(
          "/student",
        );
        break;

      case "ngo":
        router.push(
          "/ngo",
        );
        break;

      case "campus":
        router.push(
          "/campus",
        );
        break;

      case "admin":
        router.push(
          "/admin",
        );
        break;

      default:
        router.push("/");
    }
  }

  function redirectAfterRegistration(
    role: RegisterRole,
  ) {
    if (role === "ngo") {
      router.push(
        "/ngo/profile",
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Student
    |--------------------------------------------------------------------------
    |
    | Karena data akademik utama sudah dibuat saat registrasi,
    | student bisa langsung masuk ke profile untuk mengisi
    | interests, skills, availability, location, bio, dll.
    |
    */

    router.push(
      "/student/profile",
    );
  }

  function saveSession(
    result: AuthResponse,
  ) {
    localStorage.setItem(
      "auth_token",
      result.token,
    );

    localStorage.setItem(
      "auth_user",
      JSON.stringify(
        result.user,
      ),
    );
  }

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function switchMode(
    nextMode: AuthMode,
  ) {
    if (nextMode === mode) {
      return;
    }

    setMode(nextMode);

    resetMessages();

    setPassword("");

    setPasswordConfirmation(
      "",
    );

    setShowPassword(false);
  }

  function switchRegisterRole(
    role: RegisterRole,
  ) {
    if (
      role === registerRole
    ) {
      return;
    }

    setRegisterRole(role);

    resetMessages();

    setPassword("");
    setPasswordConfirmation(
      "",
    );

    setShowPassword(false);
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    resetMessages();

    try {
      const result =
        await apiFetch<AuthResponse>(
          "/auth/login",
          {
            method: "POST",

            body: JSON.stringify({
              email:
                email.trim(),

              password,
            }),
          },
        );

      saveSession(result);

      redirectByRole(
        result.user.role,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login gagal. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    resetMessages();

    if (!name.trim()) {
      setError(
        registerRole === "ngo"
          ? "Nama organisasi wajib diisi."
          : "Nama mahasiswa wajib diisi.",
      );

      setLoading(false);
      return;
    }

    if (
      password !==
      passwordConfirmation
    ) {
      setError(
        "Konfirmasi password tidak sama.",
      );

      setLoading(false);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Student Validation
    |--------------------------------------------------------------------------
    */

    if (
      registerRole ===
      "student"
    ) {
      if (!campusId) {
        setError(
          "Kampus wajib dipilih.",
        );

        setLoading(false);
        return;
      }

      if (!nim.trim()) {
        setError(
          "NIM wajib diisi.",
        );

        setLoading(false);
        return;
      }

      if (
        !studyProgram.trim()
      ) {
        setError(
          "Jurusan / Study Program wajib diisi.",
        );

        setLoading(false);
        return;
      }
    }

    try {
      const payload =
        registerRole ===
        "student"
          ? {
              name:
                name.trim(),

              email:
                email.trim(),

              password,

              password_confirmation:
                passwordConfirmation,

              role:
                registerRole,

              campus_id:
                Number(
                  campusId,
                ),

              nim:
                nim.trim(),

              study_program:
                studyProgram.trim(),
            }
          : {
              name:
                name.trim(),

              email:
                email.trim(),

              password,

              password_confirmation:
                passwordConfirmation,

              role:
                registerRole,
            };

      const result =
        await apiFetch<AuthResponse>(
          "/auth/register",
          {
            method: "POST",

            body: JSON.stringify(
              payload,
            ),
          },
        );

      saveSession(result);

      redirectAfterRegistration(
        registerRole,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration gagal. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaff] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid h-[820px] max-w-[1440px] overflow-hidden rounded-[30px] border border-[#ece7f5] bg-white shadow-[0_24px_80px_rgba(72,45,120,0.10)] lg:grid-cols-[1.05fr_0.95fr]">

        {/* LEFT PANEL */}
        <section className="relative hidden h-[820px] overflow-hidden lg:block">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Volunteer community"
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-[#4c22ad]/75 via-[#6d35e8]/45 to-black/15" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">

            {/* BRAND */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-sm font-bold text-[#6d35e8] shadow-lg">
                VM
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Volunteer Match
                </p>

                <p className="text-[10px] uppercase tracking-[0.14em] text-white/65">
                  Connect. Contribute. Grow.
                </p>
              </div>
            </div>

            {/* HERO */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                  Volunteer ecosystem
                </span>
              </div>

              <h1 className="mt-5 text-[48px] font-semibold leading-[1.02] tracking-[-0.045em] text-white xl:text-[58px]">
                Find meaningful work.

                <span className="block text-white/75">
                  Build real impact.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-white/75">
                Platform untuk mahasiswa,
                organisasi, kampus, dan
                admin dalam mengelola
                pengalaman volunteer dari
                awal sampai credential
                terverifikasi.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <VisualStat
                  value="01"
                  label="Discover"
                />

                <VisualStat
                  value="02"
                  label="Participate"
                />

                <VisualStat
                  value="03"
                  label="Credential"
                />
              </div>
            </div>

            <p className="text-[10px] text-white/60">
              Volunteer Match Platform
            </p>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="flex h-[820px] justify-center overflow-y-auto px-5 py-10 sm:px-10 lg:px-12 lg:py-0 xl:px-16">
          <div className="w-full max-w-[470px] pb-12 lg:pt-[82px]">

            {/* MOBILE BRAND */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#6d35e8] text-xs font-bold text-white">
                VM
              </div>

              <div>
                <p className="text-sm font-semibold text-[#261c2d]">
                  Volunteer Match
                </p>

                <p className="text-[9px] uppercase tracking-[0.14em] text-[#9a8ca6]">
                  Volunteer ecosystem
                </p>
              </div>
            </div>

            {/* TITLE */}
            <div className="relative h-[130px] overflow-hidden">
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.div
                  key={`${mode}-${registerRole}`}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.22,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                    Welcome
                  </p>

                  <h2 className="mt-2 text-[36px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#171321] sm:text-[42px]">
                    {mode ===
                    "login"
                      ? "Welcome back."
                      : registerRole ===
                          "ngo"
                        ? "Grow your impact."
                        : "Start your journey."}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#786d83]">
                    {mode ===
                    "login"
                      ? "Masuk untuk melanjutkan aktivitas volunteer kamu."
                      : registerRole ===
                          "ngo"
                        ? "Daftarkan organisasi dan mulai membangun volunteer project."
                        : "Daftar sebagai mahasiswa dan temukan pengalaman volunteer yang sesuai."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* MODE SELECTOR */}
            <div className="relative mt-8 grid grid-cols-2 rounded-xl bg-[#f6f3fb] p-1">
              <motion.div
                initial={false}
                animate={{
                  x:
                    mode ===
                    "login"
                      ? "0%"
                      : "100%",
                }}
                transition={{
                  type:
                    "spring",

                  stiffness:
                    420,

                  damping:
                    36,

                  mass:
                    0.7,
                }}
                className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-[0_2px_8px_rgba(70,50,95,0.10)]"
              />

              <button
                type="button"
                onClick={() =>
                  switchMode(
                    "login",
                  )
                }
                className={`relative z-10 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors duration-200 ${
                  mode ===
                  "login"
                    ? "text-[#6d35e8]"
                    : "text-[#94879e] hover:text-[#6d35e8]"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() =>
                  switchMode(
                    "register",
                  )
                }
                className={`relative z-10 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors duration-200 ${
                  mode ===
                  "register"
                    ? "text-[#6d35e8]"
                    : "text-[#94879e] hover:text-[#6d35e8]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* FORM AREA */}
            <div className="mt-7 min-h-[430px]">

              {mode ===
              "login" ? (
                <form
                  onSubmit={
                    handleLogin
                  }
                  className="space-y-5"
                >
                  <AuthField label="Email">
                    <input
                      type="email"
                      value={
                        email
                      }
                      onChange={(
                        event,
                      ) =>
                        setEmail(
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      autoComplete="email"
                      placeholder="email@example.com"
                      className={
                        inputClass
                      }
                    />
                  </AuthField>

                  <AuthField label="Password">
                    <div className="relative">
                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          password
                        }
                        onChange={(
                          event,
                        ) =>
                          setPassword(
                            event
                              .target
                              .value,
                          )
                        }
                        required
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className={`${inputClass} pr-20`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#6d35e8]"
                      >
                        {showPassword
                          ? "Hide"
                          : "Show"}
                      </button>
                    </div>
                  </AuthField>

                  <MessageBox
                    error={
                      error
                    }
                    success={
                      success
                    }
                  />

                  <button
                    type="submit"
                    disabled={
                      loading
                    }
                    className="w-full rounded-xl bg-[#6d35e8] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(109,53,232,0.20)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Logging in..."
                      : "Login"}
                  </button>

                  <p className="text-center text-xs text-[#95899f]">
                    Belum punya akun?{" "}
                    <button
                      type="button"
                      onClick={() =>
                        switchMode(
                          "register",
                        )
                      }
                      className="font-semibold text-[#6d35e8]"
                    >
                      Create account
                    </button>
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={
                    handleRegister
                  }
                  className="space-y-5"
                >
                  {/* ROLE */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
                      I am registering as
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <RoleCard
                        active={
                          registerRole ===
                          "student"
                        }
                        title="Student"
                        description="Find volunteer opportunities"
                        icon="ST"
                        onClick={() =>
                          switchRegisterRole(
                            "student",
                          )
                        }
                      />

                      <RoleCard
                        active={
                          registerRole ===
                          "ngo"
                        }
                        title="Organization"
                        description="Create volunteer projects"
                        icon="NG"
                        onClick={() =>
                          switchRegisterRole(
                            "ngo",
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* NAME */}
                  <AuthField
                    label={
                      registerRole ===
                      "ngo"
                        ? "Organization Name"
                        : "Full Name"
                    }
                  >
                    <input
                      type="text"
                      value={
                        name
                      }
                      onChange={(
                        event,
                      ) =>
                        setName(
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      autoComplete="name"
                      placeholder={
                        registerRole ===
                        "ngo"
                          ? "Your organization name"
                          : "Your full name"
                      }
                      className={
                        inputClass
                      }
                    />
                  </AuthField>

                  {/* EMAIL */}
                  <AuthField label="Email">
                    <input
                      type="email"
                      value={
                        email
                      }
                      onChange={(
                        event,
                      ) =>
                        setEmail(
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      autoComplete="email"
                      placeholder={
                        registerRole ===
                        "ngo"
                          ? "organization@example.com"
                          : "student@example.com"
                      }
                      className={
                        inputClass
                      }
                    />
                  </AuthField>

                  {/* STUDENT ACADEMIC */}
                  <AnimatePresence
                    initial={false}
                  >
                    {registerRole ===
                      "student" && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          height: 0,
                        }}
                        animate={{
                          opacity: 1,
                          height:
                            "auto",
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                        }}
                        transition={{
                          duration:
                            0.22,
                        }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-5 rounded-[18px] border border-[#e7def7] bg-[#faf8ff] p-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7d65af]">
                              Student Information
                            </p>

                            <p className="mt-1 text-[11px] leading-5 text-[#8c7e96]">
                              Data akademik wajib
                              untuk memastikan
                              mahasiswa terhubung
                              dengan kampus yang
                              benar.
                            </p>
                          </div>

                          {/* CAMPUS */}
                          <AuthField label="Campus">
                            <select
                              value={
                                campusId
                              }
                              onChange={(
                                event,
                              ) =>
                                setCampusId(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              required
                              disabled={
                                campusesLoading
                              }
                              className={
                                inputClass
                              }
                            >
                              <option value="">
                                {campusesLoading
                                  ? "Loading campuses..."
                                  : "Select your campus"}
                              </option>

                              {campuses.map(
                                (
                                  campus,
                                ) => (
                                  <option
                                    key={
                                      campus.id
                                    }
                                    value={
                                      campus.id
                                    }
                                  >
                                    {
                                      campus.name
                                    }
                                    {campus.code
                                      ? ` (${campus.code})`
                                      : ""}
                                  </option>
                                ),
                              )}
                            </select>

                            {campusesError && (
                              <p className="mt-2 text-[10px] text-red-500">
                                {
                                  campusesError
                                }
                              </p>
                            )}
                          </AuthField>

                          {/* NIM */}
                          <AuthField label="NIM">
                            <input
                              type="text"
                              value={
                                nim
                              }
                              onChange={(
                                event,
                              ) =>
                                setNim(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              required
                              placeholder="Contoh: 230101001"
                              className={
                                inputClass
                              }
                            />
                          </AuthField>

                          {/* STUDY PROGRAM */}
                          <AuthField label="Study Program / Jurusan">
                            <input
                              type="text"
                              value={
                                studyProgram
                              }
                              onChange={(
                                event,
                              ) =>
                                setStudyProgram(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              required
                              placeholder="Contoh: Teknik Informatika"
                              className={
                                inputClass
                              }
                            />
                          </AuthField>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* PASSWORD */}
                  <AuthField label="Password">
                    <div className="relative">
                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          password
                        }
                        onChange={(
                          event,
                        ) =>
                          setPassword(
                            event
                              .target
                              .value,
                          )
                        }
                        required
                        minLength={
                          8
                        }
                        autoComplete="new-password"
                        placeholder="Create a password"
                        className={`${inputClass} pr-20`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#6d35e8]"
                      >
                        {showPassword
                          ? "Hide"
                          : "Show"}
                      </button>
                    </div>
                  </AuthField>

                  {/* CONFIRM */}
                  <AuthField label="Confirm Password">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        passwordConfirmation
                      }
                      onChange={(
                        event,
                      ) =>
                        setPasswordConfirmation(
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      minLength={
                        8
                      }
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      className={
                        inputClass
                      }
                    />
                  </AuthField>

                  {/* INFO */}
                  <div className="rounded-xl border border-[#e6dcfb] bg-[#f8f5ff] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7c62b2]">
                      {registerRole ===
                      "ngo"
                        ? "Organization Account"
                        : "Student Account"}
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#85758f]">
                      {registerRole ===
                      "ngo"
                        ? "Setelah membuat akun, lengkapi profile organisasi lalu submit verification untuk direview admin."
                        : "Setelah registrasi, kamu bisa melengkapi skill, minat, availability, lokasi, bio, dan foto profile."}
                    </p>
                  </div>

                  <MessageBox
                    error={
                      error
                    }
                    success={
                      success
                    }
                  />

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (registerRole ===
                        "student" &&
                        campusesLoading)
                    }
                    className="w-full rounded-xl bg-[#6d35e8] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(109,53,232,0.20)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Creating account..."
                      : registerRole ===
                          "ngo"
                        ? "Create Organization Account"
                        : "Create Student Account"}
                  </button>

                  <p className="text-center text-xs text-[#95899f]">
                    Sudah punya akun?{" "}
                    <button
                      type="button"
                      onClick={() =>
                        switchMode(
                          "login",
                        )
                      }
                      className="font-semibold text-[#6d35e8]"
                    >
                      Login
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
        {label}
      </label>

      {children}
    </div>
  );
}

function RoleCard({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{
        scale: 0.985,
      }}
      className={`relative overflow-hidden rounded-xl border p-3 text-left transition-colors ${
        active
          ? "border-[#bca7f5] bg-[#f8f5ff]"
          : "border-[#ece7f1] bg-white hover:border-[#d9cdef] hover:bg-[#fcfbff]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ${
            active
              ? "bg-[#6d35e8] text-white"
              : "bg-[#f3f0f6] text-[#8f8199]"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p
            className={`text-xs font-semibold ${
              active
                ? "text-[#5d2dca]"
                : "text-[#473a50]"
            }`}
          >
            {title}
          </p>

          <p className="mt-1 text-[9px] leading-4 text-[#9a8da4]">
            {description}
          </p>
        </div>
      </div>

      {active && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#6d35e8] text-[9px] font-bold text-white">
          ✓
        </div>
      )}
    </motion.button>
  );
}

function MessageBox({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-xs font-semibold text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
        <p className="text-xs font-semibold text-emerald-700">
          {success}
        </p>
      </div>
    );
  }

  return null;
}

function VisualStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
      <p className="text-xs font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/65">
        {label}
      </p>
    </div>
  );
}