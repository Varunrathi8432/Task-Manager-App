import { UserPreferences } from '@core/models';

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  password: string;
  avatar: string;
  preferences: UserPreferences;
}

const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-user-1',
    email: 'demo@taskmanager.com',
    name: 'Alex Johnson',
    password: 'password123',
    avatar: '',
    preferences: {
      theme: 'light',
      defaultView: 'list',
      notificationsEnabled: true,
      defaultPriority: 'medium',
    },
  },
  {
    id: 'demo-user-2',
    email: 'sarah.mitchell@taskmanager.com',
    name: 'Sarah Mitchell',
    password: 'password123',
    avatar: '',
    preferences: {
      theme: 'dark',
      defaultView: 'kanban',
      notificationsEnabled: true,
      defaultPriority: 'high',
    },
  },
  {
    id: 'demo-user-3',
    email: 'michael.chen@taskmanager.com',
    name: 'Michael Chen',
    password: 'password123',
    avatar: '',
    preferences: {
      theme: 'light',
      defaultView: 'calendar',
      notificationsEnabled: false,
      defaultPriority: 'low',
    },
  },
];

function clone(user: DemoUser): DemoUser {
  return { ...user, preferences: { ...user.preferences } };
}

export function getDemoUsers(): DemoUser[] {
  return DEMO_USERS.map(clone);
}

export function getDemoUserById(id: string): DemoUser | undefined {
  const user = DEMO_USERS.find(u => u.id === id);
  return user ? clone(user) : undefined;
}

export function getDemoUserByEmail(email: string): DemoUser | undefined {
  const user = DEMO_USERS.find(u => u.email === email);
  return user ? clone(user) : undefined;
}

export function getPrimaryDemoUser(): DemoUser {
  return clone(DEMO_USERS[0]);
}

export function setDemoUser(user: DemoUser): void {
  const index = DEMO_USERS.findIndex(u => u.id === user.id);
  if (index >= 0) {
    DEMO_USERS[index] = clone(user);
  } else {
    DEMO_USERS.push(clone(user));
  }
}
