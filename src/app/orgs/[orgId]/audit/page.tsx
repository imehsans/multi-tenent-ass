import { getAuditLogs } from '@/lib/actions/audit';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  params: Promise<{ orgId: string }>;
}

export default async function AuditPage({ params }: PageProps) {
  const { orgId } = await params;
  const { logs } = await getAuditLogs({ org_id: orgId });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Audit Log</h1>

      <div className="flow-root">
        <ul className="-mb-8">
          {logs.length === 0 ? (
            <div className="bg-white px-4 py-5 text-center text-gray-500 shadow sm:rounded-lg sm:px-6">
              No audit logs recorded yet.
            </div>
          ) : (
            logs.map((log: any, idx: number) => (
              <li key={log.id}>
                <div className="relative pb-8">
                  {idx !== logs.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white">
                      <span className="font-mono text-xs font-bold text-white">
                        {log.action.split('.')[0].substring(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{log.action}</span> on{' '}
                          {log.entity_type}{' '}
                          <span className="font-mono text-xs">{log.entity_id.slice(0, 8)}</span>
                        </p>
                        {/* JSON details could go here, maybe expanded */}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={log.created_at}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
