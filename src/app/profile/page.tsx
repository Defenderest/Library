import { ProfilePageClient } from "@/components/profile/profile-page-client";

type ProfilePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readStringParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default function ProfilePage({ searchParams }: ProfilePageProps) {
  const initialMessage = readStringParam(searchParams?.message).trim();

  return <ProfilePageClient initialMessage={initialMessage} />;
}
