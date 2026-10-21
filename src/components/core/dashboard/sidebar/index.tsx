'use client';

import { Box, Drawer, IconButton, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuMenu } from 'react-icons/lu';
import SidebarContent from '@/components/core/dashboard/sidebar-content';
import { StorageKeys, useLocalStorage } from '@/hooks/useLocalStorage';
import type { Feature } from '@/lib/features';
import { tKeys } from '@/localization/tKeys';
import type { Role } from '@/types/Role';

const EXPANDED_WIDTH = '240px';
const COLLAPSED_WIDTH = '72px';

interface SidebarProps {
  email?: string | null;
  fullName?: string;
  role: Role | null;
  lockedFeatures: Feature[];
}

export default function Sidebar({
  email,
  fullName,
  role,
  lockedFeatures,
}: SidebarProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    StorageKeys.SIDEBAR_COLLAPSED,
    false,
  );

  return (
    <>
      <Box
        display={{ base: 'none', md: 'block' }}
        w={isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
        flexShrink={0}
        borderRightWidth="1px"
        h="100vh"
        position="sticky"
        top={0}
        transition="width 0.2s ease"
        overflow="hidden"
      >
        <SidebarContent
          email={email}
          fullName={fullName}
          role={role}
          lockedFeatures={lockedFeatures}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </Box>

      <Box display={{ base: 'flex', md: 'none' }} borderBottomWidth="1px" p={2}>
        <IconButton
          aria-label={t(tKeys.sidebar.menu)}
          variant="ghost"
          onClick={() => setIsOpen(true)}
        >
          <LuMenu />
        </IconButton>
      </Box>

      <Drawer.Root
        open={isOpen}
        onOpenChange={(e) => setIsOpen(e.open)}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content maxW="240px">
              <SidebarContent
                email={email}
                fullName={fullName}
                role={role}
                lockedFeatures={lockedFeatures}
                onNavigate={() => setIsOpen(false)}
              />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}
