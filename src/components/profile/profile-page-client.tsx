"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { cn } from "@/lib/cn";
import type { ProfileData } from "@/lib/auth/types";
import {
  loginFormSchema,
  profileFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type ProfileFormValues,
  type RegisterFormValues,
} from "@/lib/auth/validation";

type ProfilePageClientProps = {
  initialMessage?: string;
};

type MessageTone = "error" | "success" | "info";

function toneColorClass(tone: MessageTone): string {
  if (tone === "error") {
    return "text-app-error";
  }

  if (tone === "success") {
    return "text-app-success";
  }

  return "text-app-secondary";
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 font-body text-xs text-app-error">{message}</p>;
}

export function ProfilePageClient({ initialMessage = "" }: ProfilePageClientProps) {
  const { session, loading, setSession, logout } = useAuthSession();

  const [authFormVisible, setAuthFormVisible] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [authMessage, setAuthMessage] = useState(initialMessage);
  const [authMessageTone, setAuthMessageTone] = useState<MessageTone>(
    initialMessage.length > 0 ? "info" : "success",
  );
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageTone, setSaveMessageTone] = useState<MessageTone>("success");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const loadProfile = useCallback(async () => {
    if (!session) {
      return;
    }

    setProfileLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as { profile?: ProfileData; error?: string };

      if (!response.ok || !data.profile) {
        throw new Error(data.error || "Не вдалося завантажити профіль");
      }

      setProfile(data.profile);
      profileForm.reset({
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        phone: data.profile.phone,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не вдалося завантажити профіль";
      setSaveMessage(message);
      setSaveMessageTone("error");
    } finally {
      setProfileLoading(false);
    }
  }, [profileForm, session]);

  useEffect(() => {
    setSaveMessage("");

    if (session) {
      setAuthFormVisible(false);
      setAuthMessage("");
      setAuthMessageTone("success");
      void loadProfile();
      return;
    }

    setProfile(null);
    profileForm.reset({
      firstName: "",
      lastName: "",
      phone: "",
    });
  }, [loadProfile, profileForm, session]);

  useEffect(() => {
    if (!session && initialMessage.length > 0) {
      setAuthMessage(initialMessage);
      setAuthMessageTone("info");
    }
  }, [initialMessage, session]);

  const submitLogin = loginForm.handleSubmit(async (values) => {
    setAuthSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as {
        session?: {
          customerId: number;
          firstName: string;
          lastName: string;
          email: string;
          isAdmin: boolean;
        };
        error?: string;
      };

      if (!response.ok || !data.session) {
        setAuthMessage(data.error || "Не вдалося увійти");
        setAuthMessageTone("error");
        return;
      }

      setSession(data.session);
      setAuthMessage("Успішно");
      setAuthMessageTone("success");
      loginForm.reset({
        email: values.email,
        password: "",
      });
    } catch {
      setAuthMessage("Не вдалося увійти");
      setAuthMessageTone("error");
    } finally {
      setAuthSubmitting(false);
    }
  });

  const submitRegistration = registerForm.handleSubmit(async (values) => {
    setAuthSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as {
        session?: {
          customerId: number;
          firstName: string;
          lastName: string;
          email: string;
          isAdmin: boolean;
        };
        error?: string;
      };

      if (!response.ok || !data.session) {
        setAuthMessage(data.error || "Не вдалося зареєструватися");
        setAuthMessageTone("error");
        return;
      }

      setSession(data.session);
      setAuthMessage("Успішно");
      setAuthMessageTone("success");
      registerForm.reset({
        firstName: "",
        lastName: "",
        email: values.email,
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch {
      setAuthMessage("Не вдалося зареєструватися");
      setAuthMessageTone("error");
    } finally {
      setAuthSubmitting(false);
    }
  });

  const submitProfile = profileForm.handleSubmit(async (values) => {
    setSaveMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as {
        profile?: ProfileData;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.profile) {
        setSaveMessage(data.error || "Не вдалося зберегти зміни профілю");
        setSaveMessageTone("error");
        return;
      }

      setProfile(data.profile);
      profileForm.reset({
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        phone: data.profile.phone,
      });

      setSession((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          firstName: data.profile?.firstName ?? current.firstName,
          lastName: data.profile?.lastName ?? current.lastName,
          email: data.profile?.email ?? current.email,
        };
      });

      setSaveMessage(data.message || "Збережено");
      setSaveMessageTone("success");
    } catch {
      setSaveMessage("Не вдалося зберегти зміни профілю");
      setSaveMessageTone("error");
    }
  });

  const switchToLogin = () => {
    setRegisterMode(false);
    setAuthMessage("");
  };

  const switchToRegistration = () => {
    setRegisterMode(true);
    setAuthMessage("");
  };

  const closeAuthForm = () => {
    setAuthFormVisible(false);
    setAuthMessage("");
    setAuthMessageTone("info");
  };

  const revealAuthForm = () => {
    setAuthFormVisible(true);
    setRegisterMode(false);
    setAuthMessage("");
    setAuthMessageTone("info");
  };

  const logoutFromProfile = async () => {
    await logout();
    setSaveMessage("");
    setProfile(null);
    setAuthFormVisible(false);
  };

  if (loading) {
    return (
      <div className="rounded-soft border border-app-border-light bg-app-card p-8">
        <p className="font-body text-sm text-app-secondary">Завантаження профілю...</p>
      </div>
    );
  }

  const authInputClass =
    "h-[50px] w-full rounded-soft border border-app-border-light bg-white/[0.02] px-m font-body text-[13px] text-app-primary outline-none transition duration-fast placeholder:text-app-muted focus:border-app-white focus:bg-white/[0.05]";

  return (
    <section className="space-y-8">
      {!session ? (
        <div className="relative rounded-soft border border-app-border-light bg-white/[0.02] px-6 py-8 mobile:px-10">
          {authFormVisible ? (
            <button
              type="button"
              onClick={closeAuthForm}
              aria-label="Назад"
              className="absolute left-m top-m flex h-[34px] w-[34px] items-center justify-center rounded-full border border-app-border-light text-app-primary transition duration-fast hover:bg-white/[0.1]"
            >
              &lt;
            </button>
          ) : null}

          <div className="mx-auto w-full max-w-[460px] space-y-m">
            <h2 className="text-center font-display text-[30px] text-app-primary">Увійдіть у профіль</h2>

            <p className="text-center font-body text-[13px] leading-relaxed text-app-secondary">
              У гостьовому режимі доступний перегляд книг та авторів. Для кошика, замовлень і відгуків
              увійдіть або створіть акаунт.
            </p>

            {!authFormVisible ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={revealAuthForm}
                  className="mx-auto flex h-[46px] w-[250px] items-center justify-center rounded-pill border border-app-white bg-transparent font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body"
                >
                  Увійти в акаунт
                </button>
              </div>
            ) : (
              <div className="space-y-m pt-2">
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className={cn(
                      "h-[38px] w-[140px] rounded-pill border font-body text-[11px] uppercase tracking-[0.1em] text-app-primary transition duration-fast",
                      registerMode
                        ? "border-app-border-light bg-transparent"
                        : "border-app-white bg-white/[0.08]",
                    )}
                  >
                    Вхід
                  </button>

                  <button
                    type="button"
                    onClick={switchToRegistration}
                    className={cn(
                      "h-[38px] w-[140px] rounded-pill border font-body text-[11px] uppercase tracking-[0.1em] text-app-primary transition duration-fast",
                      registerMode
                        ? "border-app-white bg-white/[0.08]"
                        : "border-app-border-light bg-transparent",
                    )}
                  >
                    Реєстрація
                  </button>
                </div>

                {registerMode ? (
                  <form onSubmit={submitRegistration} className="space-y-m">
                    <div>
                      <input
                        {...registerForm.register("firstName")}
                        placeholder="Ім'я"
                        className={authInputClass}
                        autoComplete="given-name"
                      />
                      <FieldError message={registerForm.formState.errors.firstName?.message} />
                    </div>

                    <div>
                      <input
                        {...registerForm.register("lastName")}
                        placeholder="Прізвище"
                        className={authInputClass}
                        autoComplete="family-name"
                      />
                      <FieldError message={registerForm.formState.errors.lastName?.message} />
                    </div>

                    <div>
                      <input
                        {...registerForm.register("email")}
                        type="email"
                        placeholder="Email"
                        className={authInputClass}
                        autoComplete="email"
                      />
                      <FieldError message={registerForm.formState.errors.email?.message} />
                    </div>

                    <div>
                      <input
                        {...registerForm.register("phone")}
                        placeholder="Телефон (+380XXXXXXXXX)"
                        className={authInputClass}
                        autoComplete="tel"
                      />
                      <FieldError message={registerForm.formState.errors.phone?.message} />
                    </div>

                    <div>
                      <input
                        {...registerForm.register("password")}
                        type="password"
                        placeholder="Пароль"
                        className={authInputClass}
                        autoComplete="new-password"
                      />
                      <FieldError message={registerForm.formState.errors.password?.message} />
                    </div>

                    <div>
                      <input
                        {...registerForm.register("confirmPassword")}
                        type="password"
                        placeholder="Підтвердіть пароль"
                        className={authInputClass}
                        autoComplete="new-password"
                      />
                      <FieldError message={registerForm.formState.errors.confirmPassword?.message} />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="mx-auto flex h-[46px] w-[250px] items-center justify-center rounded-pill border border-app-white bg-transparent font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body disabled:opacity-60"
                    >
                      {authSubmitting ? "Зачекайте..." : "Створити акаунт"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={submitLogin} className="space-y-m">
                    <div>
                      <input
                        {...loginForm.register("email")}
                        type="email"
                        placeholder="Email"
                        className={authInputClass}
                        autoComplete="email"
                      />
                      <FieldError message={loginForm.formState.errors.email?.message} />
                    </div>

                    <div>
                      <input
                        {...loginForm.register("password")}
                        type="password"
                        placeholder="Пароль"
                        className={authInputClass}
                        autoComplete="current-password"
                      />
                      <FieldError message={loginForm.formState.errors.password?.message} />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="mx-auto flex h-[46px] w-[250px] items-center justify-center rounded-pill border border-app-white bg-transparent font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body disabled:opacity-60"
                    >
                      {authSubmitting ? "Зачекайте..." : "Увійти"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {authMessage.length > 0 ? (
              <p className={cn("text-center font-body text-xs", toneColorClass(authMessageTone))}>
                {authMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-l pb-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#222]" />

            <div className="space-y-1">
              <h2 className="font-display text-[32px] text-app-primary">
                {(profile?.firstName || session.firstName) + " " + (profile?.lastName || session.lastName)}
              </h2>
              <p className="font-body text-xs uppercase tracking-[0.1em] text-app-muted">
                {profile?.loyaltyProgram ? "ПРЕМІУМ УЧАСНИК" : "УЧАСНИК"}
              </p>
              <p className="font-body text-xs text-app-secondary">
                Бонусні бали: {profile?.loyaltyPoints ?? 0}
              </p>
            </div>
          </div>

          {profileLoading ? (
            <div className="rounded-soft border border-app-border-light bg-app-card p-6">
              <p className="font-body text-sm text-app-secondary">Завантаження даних профілю...</p>
            </div>
          ) : (
            <form onSubmit={submitProfile} className="space-y-8">
              <div className="grid max-w-[800px] grid-cols-1 gap-x-10 gap-y-6 compact:grid-cols-2">
                <div>
                  <p className="font-body text-xs text-app-secondary">Ім&apos;я</p>
                  <input
                    {...profileForm.register("firstName")}
                    className="h-11 w-full border-b border-app-border-light bg-transparent font-display text-base text-app-primary outline-none transition duration-fast focus:border-app-white"
                    autoComplete="given-name"
                  />
                  <FieldError message={profileForm.formState.errors.firstName?.message} />
                </div>

                <div>
                  <p className="font-body text-xs text-app-secondary">Прізвище</p>
                  <input
                    {...profileForm.register("lastName")}
                    className="h-11 w-full border-b border-app-border-light bg-transparent font-display text-base text-app-primary outline-none transition duration-fast focus:border-app-white"
                    autoComplete="family-name"
                  />
                  <FieldError message={profileForm.formState.errors.lastName?.message} />
                </div>

                <div>
                  <p className="font-body text-xs text-app-secondary">Електронна пошта</p>
                  <input
                    value={profile?.email ?? session.email}
                    readOnly
                    className="h-11 w-full border-b border-app-border-light bg-transparent font-display text-base text-app-secondary outline-none"
                  />
                </div>

                <div>
                  <p className="font-body text-xs text-app-secondary">Телефон</p>
                  <input
                    {...profileForm.register("phone")}
                    className="h-11 w-full border-b border-app-border-light bg-transparent font-display text-base text-app-primary outline-none transition duration-fast focus:border-app-white"
                    autoComplete="tel"
                  />
                  <FieldError message={profileForm.formState.errors.phone?.message} />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  className="flex h-[46px] w-[220px] items-center justify-center rounded-sharp border border-app-white bg-transparent font-body text-xs uppercase tracking-[0.08em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body"
                >
                  Зберегти зміни
                </button>

                <button
                  type="button"
                  onClick={logoutFromProfile}
                  className="flex h-[46px] w-[220px] items-center justify-center rounded-sharp border border-app-white bg-transparent font-body text-xs uppercase tracking-[0.08em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body"
                >
                  Вийти з акаунта
                </button>
              </div>

              {saveMessage.length > 0 ? (
                <p className={cn("font-body text-xs", toneColorClass(saveMessageTone))}>{saveMessage}</p>
              ) : null}
            </form>
          )}
        </>
      )}
    </section>
  );
}
