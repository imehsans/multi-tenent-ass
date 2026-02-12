/**
 * Organization Members Page
 *
 * Lists active members and pending invitations.
 * Allows inviting new members and canceling pending invites.
 */

import { getOrganizationMembers } from '@/lib/actions/organizations';
import { listInvites } from '@/lib/actions/invites';
import { InviteMemberForm } from '@/components/InviteMemberForm';
import { PendingInvitesList } from '@/components/PendingInvitesList';

interface PageProps {
   params: Promise<{ orgId: string }>;
}

export default async function MembersPage({ params }: PageProps) {
   const { orgId } = await params;
   const [members, pendingInvites] = await Promise.all([
      getOrganizationMembers(orgId),
      listInvites(orgId).catch(() => []) as any, // Gracefully handle if user doesn't have permission
   ]);

   return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
         <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
               <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
               <p className="mt-2 text-sm text-gray-700">
                  Manage your organization members and pending invitations.
               </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
               <InviteMemberForm orgId={orgId} />
            </div>
         </div>

         {/* Pending Invitations */}
         {pendingInvites.length > 0 && (
            <div className="mt-8">
               <h2 className="text-lg font-medium text-gray-900">Pending Invitations</h2>
               <p className="mt-1 text-sm text-gray-500">
                  These users have been invited but haven&apos;t accepted yet.
               </p>
               <PendingInvitesList invites={pendingInvites} orgId={orgId} />
            </div>
         )}

         {/* Active Members */}
         <div className="mt-8 flex flex-col">
            <h2 className="text-lg font-medium text-gray-900">Active Members</h2>
            <div className="mt-4 -mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
               <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="ring-opacity-5 overflow-hidden shadow ring-1 ring-black md:rounded-lg">
                     <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                           <tr>
                              <th
                                 scope="col"
                                 className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                              >
                                 Name
                              </th>
                              <th
                                 scope="col"
                                 className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                              >
                                 Role
                              </th>
                              <th
                                 scope="col"
                                 className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                              >
                                 Status
                              </th>
                              <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
                                 <span className="sr-only">Actions</span>
                              </th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                           {members.map((member: any) => (
                              <tr key={member.id}>
                                 <td className="py-4 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-6">
                                    <div className="flex flex-col">
                                       <span className="font-medium text-gray-900">
                                          {member.user?.full_name || 'Unknown User'}
                                       </span>
                                       <span className="text-xs text-gray-500">{member.user?.email}</span>
                                    </div>
                                 </td>
                                 <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 capitalize">
                                   <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                      {member.role}
                                   </span>
                                </td>
                                <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                                   <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                      Active
                                   </span>
                                </td>
                                <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                                   <button className="text-gray-400 hover:text-gray-500">
                                      {/* Actions like change role, remove member could go here */}
                                      <span className="sr-only">Edit {member.user?.email}</span>
                                   </button>
                                </td>
                             </tr>
                          ))}
                        </tbody>
                     </table>
                     {members.length === 0 && (
                        <div className="bg-gray-50 px-4 py-12 text-center text-gray-500">
                           <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                           </svg>
                           <h3 className="mt-2 text-sm font-medium text-gray-900">No members</h3>
                           <p className="mt-1 text-sm text-gray-500">Get started by inviting a team member.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
