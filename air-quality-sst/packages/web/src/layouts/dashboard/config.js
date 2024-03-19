import ChartBarIcon from '@heroicons/react/24/solid/ChartBarIcon';
import UserIcon from '@heroicons/react/24/solid/UserIcon';
import UsersIcon from '@heroicons/react/24/solid/UsersIcon';
import BookOpenIcon from '@heroicons/react/24/solid/BookOpenIcon';
import ArrowDownTrayIcon from '@heroicons/react/24/solid/ArrowDownTrayIcon';
import CpuChipIcon from '@heroicons/react/24/solid/CpuChipIcon';
import { SvgIcon } from '@mui/material';

export const items = [
  {
    title: 'Overview',
    path: '/',
    icon: (
      <SvgIcon fontSize="small">
        <ChartBarIcon />
      </SvgIcon>
    ),
  },
  {
    title: 'Data',
    path: '/data',
    icon: (
      <SvgIcon fontSize="small">
        <BookOpenIcon />
      </SvgIcon>
    ),
  },
  {
    title: 'Download',
    path: '/download',
    icon: (
      <SvgIcon fontSize="small">
        <ArrowDownTrayIcon />
      </SvgIcon>
    ),
  },
  {
    title: 'Device Managment',
    path: '/devices',
    icon: (
      <SvgIcon fontSize="small">
        <UsersIcon />
      </SvgIcon>
    ),
  },
  {
    title: 'Account',
    path: '/account',
    icon: (
      <SvgIcon fontSize="small">
        <UserIcon />
      </SvgIcon>
    ),
  },
  {
    title: 'ML',
    path: '/ml',
    icon: (
      <SvgIcon fontSize="small">
        <CpuChipIcon />
      </SvgIcon>
    ),
  },
];
