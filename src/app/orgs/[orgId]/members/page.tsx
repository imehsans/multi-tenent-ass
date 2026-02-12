/**
 * Organization Members Page
 *
 * Lists members of the organization.
 * Allows inviting new members.
 */

import { getOrganizationMembers } from '@/lib/actions/organizations';
import { InviteMemberForm } from '@/components/InviteMemberForm';
import { Button } from '@/components/ui/Button'; // Kept if needed elsewhere, but InviteMemberForm uses it internally
import { EmptyState } from '@/components/ui/EmptyState'; // Kept for empty state logic

interface PageProps {
   params: Promise<{ orgId: string }>;
}

export default async function MembersPage({ params }: PageProps) {
   const { orgId } = await params;
   const members = await getOrganizationMembers(orgId);

   return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
         <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
               <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
               <p className="mt-2 text-sm text-gray-700">
                  A list of all the users in your organization including their name, role, and email.
               </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
               <InviteMemberForm orgId={orgId} />
            </div>
         </div>

         <div className="mt-8 flex flex-col">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
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
                                 <span className="sr-only">Edit</span>
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
                                    {member.role}
                                 </td>
                                 <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                                       Active
                                    </span>
                                 </td>
                                 <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                     {members.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No members found.</div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
