import { Pencil, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import TableContainer from "../../components/TableContainer";
import { useData } from "../../context/DataContext";

export default function AdminList() {
  const { admins } = useData();
  return (
    <>
      <PageHeader title="Administrators" action={<Link className="button-primary" to="/administrators/new"><Plus size={17} /> ADD NEW ADMIN</Link>} />
      <TableContainer title="Administrator accounts" description="Manage people who can access the admin panel." count={`${admins.length} admins`}>
        <div className="table-wrap"><table><thead><tr><th>Username</th><th>Full name</th><th>Email</th><th className="align-right">Action</th></tr></thead>
          <tbody>{admins.map((admin) => <tr key={admin.id}><td><span className="admin-username-badge">{admin.username}</span></td><td><strong className="table-primary-text">{admin.fullName}</strong></td><td>{admin.email}</td><td><div className="row-actions"><Link className="action-button action-edit" to={`/administrators/${admin.id}/edit`} aria-label={`Edit ${admin.username}`}><Pencil size={16} /></Link></div></td></tr>)}
            {!admins.length && <tr><td className="empty-table" colSpan="4">No administrators have been added.</td></tr>}</tbody>
        </table></div>
        <div className="table-foot"><span>Showing <strong>{admins.length}</strong> administrators</span></div>
      </TableContainer>
    </>
  );
}
