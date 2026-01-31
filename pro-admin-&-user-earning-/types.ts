
export interface AppConfig {
  reward: number;
  limit: number;
  minRef: number;
  minAmt: number;
}

export interface Post {
  id?: string;
  title: string;
  thumb: string;
  zone: string;
  ads: number;
  link: string;
}

export interface Milestone {
  id?: string;
  count: number;
  bonus: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  balance: number;
  totalRefer: number;
  referCode: string;
}

export interface WithdrawalRequest {
  id?: string;
  userId: string;
  name: string;
  number: string;
  amount: number;
  status: 'pending' | 'completed';
}

export enum AdminTabs {
  DASHBOARD = 'dashboard',
  ADD_POST = 'add-post',
  POST_LIST = 'post-list',
  TASK_SETTINGS = 'task-settings',
  REFER_MILESTONE = 'refer-milestone',
  MANAGE_USERS = 'manage-users',
  WITHDRAW_REQUESTS = 'withdraw-requests'
}

export enum UserPages {
  HOME = 'home',
  EARN = 'earn',
  TASKS = 'tasks',
  REFER = 'refer',
  PROFILE = 'profile'
}
