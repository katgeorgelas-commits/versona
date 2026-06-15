import { listMissionRequests } from "@/features/admin/data";
import { AdminRequestRow } from "@/features/admin/admin-request-row";

export default async function AdminRequestsPage() {
  const requests = await listMissionRequests();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Mission requests</h1>
      <p className="text-sm text-muted-foreground">
        Members propose new missions; approving one creates it and notifies the requester.
      </p>
      <div className="space-y-2">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          requests.map((r) => <AdminRequestRow key={r.id} request={r} />)
        )}
      </div>
    </div>
  );
}
