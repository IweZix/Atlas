'use client';

import { Badge, Flex, IconButton, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { IconType } from 'react-icons';
import {
  LuChartLine,
  LuLayoutDashboard,
  LuLock,
  LuMegaphone,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuScrollText,
  LuSettings,
  LuUsers,
} from 'react-icons/lu';
import LogoutButton from '@/components/core/auth/logout-button';
import { Tooltip } from '@/components/ui/tooltip';
import type { Feature } from '@/lib/features';
import { tKeys } from '@/localization/tKeys';
import { Role } from '@/types/Role';

interface NavItem {
  key:
    | 'dashboard'
    | 'users'
    | 'analytics'
    | 'annonces'
    | 'journal'
    | 'settings';
  href: string;
  icon: IconType;
  /** Whether the page behind this link actually exists yet. */
  implemented: boolean;
  /** Roles allowed to see this item at all — checked before `implemented`. */
  allowedRoles: Role[];
  /** Feature flag gating this item, if any — checked after `implemented`. */
  feature?: Feature;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: LuLayoutDashboard,
    implemented: true,
    allowedRoles: [Role.ADMIN, Role.MANAGER],
  },
  {
    key: 'users',
    href: '/dashboard/users',
    icon: LuUsers,
    implemented: true,
    allowedRoles: [Role.ADMIN],
  },
  {
    key: 'analytics',
    href: '/dashboard/analytics',
    icon: LuChartLine,
    implemented: true,
    allowedRoles: [Role.ADMIN],
    feature: 'analytics',
  },
  {
    key: 'annonces',
    href: '/dashboard/annonces',
    icon: LuMegaphone,
    implemented: true,
    allowedRoles: [Role.ADMIN],
    feature: 'banner',
  },
  {
    key: 'journal',
    href: '/dashboard/journal',
    icon: LuScrollText,
    implemented: true,
    allowedRoles: [Role.ADMIN],
  },
  {
    key: 'settings',
    href: '/dashboard/settings',
    icon: LuSettings,
    implemented: true,
    allowedRoles: [Role.ADMIN],
  },
];

interface SidebarContentProps {
  email?: string | null;
  fullName?: string;
  role: Role | null;
  lockedFeatures: Feature[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

export default function SidebarContent({
  email,
  fullName,
  role,
  lockedFeatures,
  isCollapsed = false,
  onToggleCollapse,
  onNavigate,
}: SidebarContentProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <Flex direction="column" h="full" justify="space-between">
      <Stack gap={1} p={4}>
        <Flex align="center" justify="space-between" mb={2}>
          {!isCollapsed && (
            <Text fontWeight="bold">{t(tKeys.sidebar.menu)}</Text>
          )}
          {onToggleCollapse && (
            <IconButton
              aria-label={t(
                isCollapsed ? tKeys.sidebar.expand : tKeys.sidebar.collapse,
              )}
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              mx={isCollapsed ? 'auto' : undefined}
            >
              {isCollapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
            </IconButton>
          )}
        </Flex>

        {NAV_ITEMS.filter(
          (item) => role !== null && item.allowedRoles.includes(role),
        ).map((item) => {
          const Icon = item.icon;
          const label = t(tKeys.sidebar.nav[item.key]);

          if (!item.implemented) {
            return (
              <Tooltip
                key={item.key}
                content={label}
                disabled={!isCollapsed}
                positioning={{ placement: 'right' }}
              >
                <Flex
                  align="center"
                  justify={isCollapsed ? 'center' : 'flex-start'}
                  gap={2}
                  px={3}
                  py={2}
                  rounded="md"
                  color="fg.muted"
                  cursor="not-allowed"
                  opacity={0.5}
                >
                  <Icon />
                  {!isCollapsed && (
                    <>
                      <Text flex="1">{label}</Text>
                      <Badge size="sm" colorPalette="gray">
                        {t(tKeys.sidebar.comingSoon)}
                      </Badge>
                    </>
                  )}
                </Flex>
              </Tooltip>
            );
          }

          const isLocked =
            item.feature && lockedFeatures.includes(item.feature);

          if (isLocked) {
            return (
              <Tooltip
                key={item.key}
                content={label}
                disabled={!isCollapsed}
                positioning={{ placement: 'right' }}
              >
                {/* Native anchor: a feature-gated destination must always
                    hit the server (middleware + page check) fresh, never a
                    client-side navigation served from Next's route cache. */}
                <a
                  href={`/${locale}/dashboard/upgrade?feature=${item.feature}`}
                  onClick={onNavigate}
                >
                  <Flex
                    align="center"
                    justify={isCollapsed ? 'center' : 'flex-start'}
                    gap={2}
                    px={3}
                    py={2}
                    rounded="md"
                    color="fg.muted"
                    opacity={0.6}
                    _hover={{ bg: 'bg.muted' }}
                  >
                    <Icon />
                    {!isCollapsed && (
                      <>
                        <Text flex="1">{label}</Text>
                        <Badge size="sm" colorPalette="orange">
                          <LuLock /> {t(tKeys.sidebar.featureLocked)}
                        </Badge>
                      </>
                    )}
                  </Flex>
                </a>
              </Tooltip>
            );
          }

          const href = `/${locale}${item.href}`;
          const isActive = pathname === href;

          const navContent = (
            <Flex
              align="center"
              justify={isCollapsed ? 'center' : 'flex-start'}
              gap={2}
              px={3}
              py={2}
              rounded="md"
              bg={isActive ? 'bg.emphasized' : 'transparent'}
              fontWeight={isActive ? 'semibold' : 'normal'}
              _hover={{ bg: 'bg.muted' }}
            >
              <Icon />
              {!isCollapsed && <Text>{label}</Text>}
            </Flex>
          );

          return (
            <Tooltip
              key={item.key}
              content={label}
              disabled={!isCollapsed}
              positioning={{ placement: 'right' }}
            >
              {item.feature ? (
                // Feature-gated destination: native anchor, same reasoning
                // as the locked branch above — always hit the server fresh.
                <a href={href} onClick={onNavigate}>
                  {navContent}
                </a>
              ) : (
                <Link href={href} onClick={onNavigate}>
                  {navContent}
                </Link>
              )}
            </Tooltip>
          );
        })}
      </Stack>

      <Stack
        gap={2}
        p={4}
        borderTopWidth="1px"
        align={isCollapsed ? 'center' : 'stretch'}
      >
        {!isCollapsed && (
          <>
            <Text fontSize="sm" color="fg.muted" truncate>
              {fullName ?? email}
            </Text>
            {role && (
              <Badge alignSelf="flex-start" colorPalette="blue">
                {t(tKeys.dashboard.role, { role })}
              </Badge>
            )}
          </>
        )}
        <Tooltip
          content={t(tKeys.dashboard.logout)}
          disabled={!isCollapsed}
          positioning={{ placement: 'right' }}
        >
          <LogoutButton isCollapsed={isCollapsed} />
        </Tooltip>
      </Stack>
    </Flex>
  );
}
