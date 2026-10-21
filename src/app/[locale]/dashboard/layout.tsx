import { Box, Flex } from '@chakra-ui/react';
import Sidebar from '@/components/core/dashboard/sidebar';
import PreferencesSync from '@/components/core/preferences-sync';
import { getLockedFeatures } from '@/lib/features';
import { getPreferencesSyncInfo } from '@/lib/preferences';
import { getCurrentUser } from '@/lib/supabase/current-user';
import { getUserRole } from '@/lib/supabase/role';
import { getUserMetadata } from '@/lib/supabase/user-metadata';

// Feature flags must never be resolved at build time — a flag flip in the
// Vercel dashboard needs to take effect on the next request, not the next deploy.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const role = getUserRole(user);
  const { firstName, lastName } = getUserMetadata(user);
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || undefined;
  const lockedFeatures = await getLockedFeatures();
  const preferences = await getPreferencesSyncInfo();

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      <PreferencesSync
        locale={preferences.locale}
        theme={preferences.theme}
        neverCustomized={preferences.neverCustomized}
      />
      <Sidebar
        email={user?.email}
        fullName={fullName}
        role={role}
        lockedFeatures={lockedFeatures}
      />
      <Box flex="1" p={6}>
        {children}
      </Box>
    </Flex>
  );
}
