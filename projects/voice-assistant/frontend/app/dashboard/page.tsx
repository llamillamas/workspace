'use client';

import { useEffect, useState } from 'react';
import { Mail, Calendar, Settings, ArrowRight, Flame, Phone } from 'lucide-react';
import Link from 'next/link';
import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthStore } from '@/lib/store';
import { useEmailStore } from '@/lib/store';
import { useCalendarStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { account: emailAccount, fetchAccount } = useEmailStore();
  const { accounts: calendars, fetchAccounts } = useCalendarStore();
  const [hotLeads, setHotLeads] = useState<any[]>([]);
  const [hotLeadsLoading, setHotLeadsLoading] = useState(true);

  useEffect(() => {
    fetchAccount();
    fetchAccounts();
    fetchHotLeads();
  }, [fetchAccount, fetchAccounts]);

  const fetchHotLeads = async () => {
    try {
      const response = await apiClient.getTopLeads(5);
      setHotLeads(response.data.leads.filter((lead: any) => lead.qualification_level === 'HOT'));
    } catch (error) {
      console.error('Error fetching hot leads:', error);
    } finally {
      setHotLeadsLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your email and calendar settings in one place
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Email Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Email Account</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {emailAccount?.email || 'Not connected'}
                </h3>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
            {emailAccount && (
              <div className="text-xs text-gray-500">
                Last synced:{' '}
                {emailAccount.last_synced
                  ? new Date(emailAccount.last_synced).toLocaleDateString()
                  : 'Never'}
              </div>
            )}
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Connected Calendars</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {calendars.length > 0 ? `${calendars.length} calendar${calendars.length !== 1 ? 's' : ''}` : 'None'}
                </h3>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
            {calendars.length > 0 && (
              <p className="text-xs text-gray-500">
                Primary: {calendars.find((c) => c.primary)?.name || 'Unknown'}
              </p>
            )}
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Configuration Status</p>
                <h3 className="text-lg font-semibold text-gray-900">Ready</h3>
              </div>
              <Settings className="w-8 h-8 text-green-500" />
            </div>
            <Link
              href="/dashboard/settings"
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              View settings →
            </Link>
          </div>

          {/* Hot Leads Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Hot Leads</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {hotLeadsLoading ? '—' : hotLeads.length}
                </h3>
              </div>
              <Flame className="w-8 h-8 text-red-500" />
            </div>
            <Link
              href="/leads?qualification=HOT"
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              View hot leads →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/calls"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-600">
                    Voice Calls
                  </h3>
                  <p className="text-sm text-gray-600">Start a voice call with AI assistant</p>
                </div>
                <Phone className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
              </div>
            </Link>

            <Link
              href="/dashboard/email"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    Email Settings
                  </h3>
                  <p className="text-sm text-gray-600">Configure auto-replies and forwarding</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </div>
            </Link>

            <Link
              href="/dashboard/calendar"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">
                    Calendar Settings
                  </h3>
                  <p className="text-sm text-gray-600">Manage auto-responses and availability</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
              </div>
            </Link>
          </div>
        </section>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
          <p className="text-sm text-blue-800">
            Your Google account is securely connected. All tokens are encrypted and stored safely.
            You can configure your email auto-replies, forwarding rules, and calendar preferences
            from the respective sections.
          </p>
        </div>
      </div>
    </ProtectedLayout>
  );
}
