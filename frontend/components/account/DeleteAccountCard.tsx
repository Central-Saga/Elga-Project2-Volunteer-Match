"use client";

import {
  FormEvent,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
} from "@/lib/auth";

type DeleteAccountResponse = {
  message: string;
};

type DeleteAccountCardProps = {
  title?: string;
  description?: string;
};

export default function DeleteAccountCard({
  title = "Delete account",
  description = "Hapus akses akun secara permanen dari platform. Riwayat volunteer dan data terkait tetap dipertahankan untuk integritas record.",
}: DeleteAccountCardProps) {
  const router = useRouter();

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  function openModal() {
    setError("");
    setPassword("");
    setShowPassword(false);
    setOpen(true);
  }

  function closeModal() {
    if (processing) {
      return;
    }

    setOpen(false);
    setError("");
    setPassword("");
    setShowPassword(false);
  }

  async function handleDelete(
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

    if (
      !password.trim()
    ) {
      setError(
        "Password wajib diisi.",
      );

      return;
    }

    setProcessing(true);
    setError("");

    try {
      await apiFetch<DeleteAccountResponse>(
        "/auth/account",
        {
          method:
            "DELETE",

          token,

          body: JSON.stringify(
            {
              password,
            },
          ),
        },
      );

      localStorage.removeItem(
        "auth_token",
      );

      localStorage.removeItem(
        "auth_user",
      );

      router.replace(
        "/login",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus akun.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <section className="rounded-[24px] border border-red-100 bg-white p-6 shadow-[0_8px_28px_rgba(120,40,40,0.04)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-600">
                !
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-500">
                  Danger Zone
                </p>

                <h2 className="mt-1 text-lg font-semibold text-[#2f252f]">
                  {title}
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#837583]">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={
              openModal
            }
            className="w-fit rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Delete Account
          </button>
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.18,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171321]/45 px-4 backdrop-blur-[3px]"
            onMouseDown={
              closeModal
            }
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 12,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.97,
                y: 8,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              onMouseDown={(
                event,
              ) =>
                event.stopPropagation()
              }
              className="w-full max-w-md rounded-[24px] border border-[#eee8f3] bg-white p-6 shadow-[0_28px_90px_rgba(35,20,45,0.20)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-500">
                    Confirm deletion
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#241b28]">
                    Delete your account?
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#847887]">
                    Akses akun akan
                    dinonaktifkan dan semua
                    sesi login akan dicabut.
                    Masukkan password untuk
                    konfirmasi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    processing
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f4fa] text-sm font-semibold text-[#726677] transition hover:bg-[#f0ebf4] disabled:opacity-40"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  handleDelete
                }
                className="mt-6"
              >
                <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
                  Current Password
                </label>

                <div className="relative mt-2">
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
                        event.target
                          .value,
                      )
                    }
                    autoFocus
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#e7e1ed] bg-[#fbfaff] px-4 py-3.5 pr-20 text-sm text-[#413548] outline-none transition placeholder:text-[#b1a6b8] focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
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

                {error && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-xs font-semibold text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                <div className="mt-6 rounded-xl border border-red-100 bg-red-50/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-500">
                    Important
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-red-700">
                    Setelah akun dihapus,
                    kamu tidak dapat login
                    lagi menggunakan akun
                    ini.
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      processing
                    }
                    className="rounded-xl border border-[#e6dfe9] px-5 py-3 text-sm font-semibold text-[#6e6275] transition hover:bg-[#faf8fb] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      processing
                    }
                    className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing
                      ? "Deleting..."
                      : "Delete Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}