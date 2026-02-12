import { getUserProfile } from '@/lib/actions/profile';
import { ProfileUpdateForm } from '@/components/profile/ProfileUpdateForm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProfilePage() {
   const result = await getUserProfile();

   if ('error' in result) {
      redirect('/auth/login');
   }

   const { email, full_name } = result;

   return (
      <div className="min-h-screen bg-gray-50 py-8">
         <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
               <Link
                  href="/orgs"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
               >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
               </Link>
               <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
               <p className="text-gray-500 mt-2">Manage your account settings and preferences</p>
            </div>

            {/* Profile Form */}
            <ProfileUpdateForm initialName={full_name || ''} email={email || ''} />
         </div>
      </div>
   );
}
